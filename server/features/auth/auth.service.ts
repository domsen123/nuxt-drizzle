import type { Session, User } from '../../database/schema'
import type { DatabaseClient } from '../../infrastructure/database/client'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { and, eq, gt, lt } from 'drizzle-orm'
import { ulid } from 'ulid'
import { passwordResetTokens, sessions, users } from '../../database/schema'
import { config } from '../../utils/config'

const BCRYPT_COST = 12
const SESSION_EXPIRY_DAYS = 30
const SESSION_REFRESH_THRESHOLD_DAYS = 7
const PASSWORD_RESET_TOKEN_EXPIRY_HOURS = 1

export interface AuthServiceResult {
  user: Omit<User, 'passwordHash'>
  session: Session
  token: string
}

export interface CreateAuthServiceDeps {
  db: DatabaseClient
}

export const createAuthService = ({ db }: CreateAuthServiceDeps) => {
  const hashPassword = (password: string): Promise<string> => {
    return bcrypt.hash(password, BCRYPT_COST)
  }

  const verifyPassword = (password: string, hash: string): Promise<boolean> => {
    return bcrypt.compare(password, hash)
  }

  const generateSessionToken = (): string => {
    return crypto.randomBytes(32).toString('hex')
  }

  const omitPasswordHash = (user: User): Omit<User, 'passwordHash'> => {
    const { passwordHash: _, ...safeUser } = user
    return safeUser
  }

  const createSession = async (userId: string): Promise<{ session: Session, token: string }> => {
    const token = generateSessionToken()
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const [session] = await db
      .insert(sessions)
      .values({
        id: ulid(),
        userId,
        token,
        expiresAt,
      })
      .returning()

    if (!session) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create session',
      })
    }

    return { session, token }
  }

  const register = async (
    email: string,
    password: string,
    name?: string,
  ): Promise<AuthServiceResult> => {
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (existingUser.length > 0) {
      throw createError({
        statusCode: 409,
        statusMessage: 'Email already exists',
      })
    }

    const passwordHash = await hashPassword(password)

    const [user] = await db
      .insert(users)
      .values({
        id: ulid(),
        email: email.toLowerCase(),
        passwordHash,
        name,
      })
      .returning()

    if (!user) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to create user',
      })
    }

    const { session, token } = await createSession(user.id)

    return {
      user: omitPasswordHash(user),
      session,
      token,
    }
  }

  const login = async (email: string, password: string): Promise<AuthServiceResult> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }

    const isValid = await verifyPassword(password, user.passwordHash)

    if (!isValid) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials',
      })
    }

    const { session, token } = await createSession(user.id)

    return {
      user: omitPasswordHash(user),
      session,
      token,
    }
  }

  const validateSession = async (
    token: string,
  ): Promise<{ session: Session, user: Omit<User, 'passwordHash'> } | null> => {
    const [result] = await db
      .select()
      .from(sessions)
      .innerJoin(users, eq(sessions.userId, users.id))
      .where(and(eq(sessions.token, token), gt(sessions.expiresAt, new Date())))
      .limit(1)

    if (!result) {
      return null
    }

    return {
      session: result.sessions,
      user: omitPasswordHash(result.users),
    }
  }

  const invalidateSession = async (token: string): Promise<void> => {
    await db.delete(sessions).where(eq(sessions.token, token))
  }

  const refreshSession = async (sessionId: string): Promise<Session> => {
    const expiresAt = new Date(Date.now() + SESSION_EXPIRY_DAYS * 24 * 60 * 60 * 1000)

    const [session] = await db
      .update(sessions)
      .set({ expiresAt })
      .where(eq(sessions.id, sessionId))
      .returning()

    if (!session) {
      throw createError({
        statusCode: 500,
        statusMessage: 'Failed to refresh session',
      })
    }

    return session
  }

  const shouldRefreshSession = (session: Session): boolean => {
    const daysUntilExpiry = (session.expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    return daysUntilExpiry < SESSION_REFRESH_THRESHOLD_DAYS
  }

  const requestPasswordReset = async (email: string): Promise<{ success: boolean }> => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1)

    // Always return success to prevent email enumeration
    if (!user) {
      console.log(`[Password Reset] Email not found: ${email}`)
      return { success: true }
    }

    // Delete any existing reset tokens for this user
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, user.id))

    // Generate new token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000)

    // Store token
    await db
      .insert(passwordResetTokens)
      .values({
        id: ulid(),
        userId: user.id,
        token,
        expiresAt,
      })

    // Mock email - log to console
    const resetLink = `${config.site.url}/auth/reset-password?token=${token}`
    console.log(`\n${'='.repeat(80)}`)
    console.log('PASSWORD RESET EMAIL (Mock)')
    console.log('='.repeat(80))
    console.log(`To: ${user.email}`)
    console.log(`Subject: Reset your password`)
    console.log(`\nHello ${user.name || 'there'},`)
    console.log(`\nYou requested to reset your password. Click the link below to continue:`)
    console.log(`\n${resetLink}`)
    console.log(`\nThis link will expire in ${PASSWORD_RESET_TOKEN_EXPIRY_HOURS} hour(s).`)
    console.log(`\nIf you didn't request this, you can safely ignore this email.`)
    console.log(`${'='.repeat(80)}\n`)

    return { success: true }
  }

  const validateResetToken = async (
    token: string,
  ): Promise<{ valid: boolean, userId?: string }> => {
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(and(
        eq(passwordResetTokens.token, token),
        gt(passwordResetTokens.expiresAt, new Date()),
      ))
      .limit(1)

    if (!resetToken) {
      return { valid: false }
    }

    return { valid: true, userId: resetToken.userId }
  }

  const resetPassword = async (
    token: string,
    newPassword: string,
  ): Promise<{ success: boolean }> => {
    // Validate token
    const validation = await validateResetToken(token)

    if (!validation.valid || !validation.userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid or expired reset token',
      })
    }

    // Hash new password
    const passwordHash = await hashPassword(newPassword)

    // Update user password
    await db
      .update(users)
      .set({
        passwordHash,
        updatedAt: new Date(),
      })
      .where(eq(users.id, validation.userId))

    // Delete the reset token (single-use)
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token))

    // Invalidate all existing sessions for security
    await db
      .delete(sessions)
      .where(eq(sessions.userId, validation.userId))

    console.log(`[Password Reset] Password successfully reset for user: ${validation.userId}`)

    return { success: true }
  }

  const cleanupExpiredResetTokens = async (): Promise<number> => {
    const result = await db
      .delete(passwordResetTokens)
      .where(lt(passwordResetTokens.expiresAt, new Date()))
      .returning()

    return result.length
  }

  return {
    register,
    login,
    createSession,
    validateSession,
    invalidateSession,
    refreshSession,
    shouldRefreshSession,
    requestPasswordReset,
    validateResetToken,
    resetPassword,
    cleanupExpiredResetTokens,
  }
}

export type AuthService = ReturnType<typeof createAuthService>
