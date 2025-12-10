import type { Session, User } from '../../database/schema'
import type { DatabaseClient } from '../../infrastructure/database/client'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { and, eq, gt } from 'drizzle-orm'
import { ulid } from 'ulid'
import { sessions, users } from '../../database/schema'

const BCRYPT_COST = 12
const SESSION_EXPIRY_DAYS = 30
const SESSION_REFRESH_THRESHOLD_DAYS = 7

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

  return {
    register,
    login,
    createSession,
    validateSession,
    invalidateSession,
    refreshSession,
    shouldRefreshSession,
  }
}

export type AuthService = ReturnType<typeof createAuthService>
