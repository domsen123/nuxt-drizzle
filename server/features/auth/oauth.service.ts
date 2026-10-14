import type { User } from '../../database/schema'
import type { DatabaseClient } from '../../infrastructure/database/client'
import type { EventBus } from '../../infrastructure/events'
import type { FileService } from '../files/files.service'
import type { ImageProcessingService } from '../files/image-processing.service'
import type { AuthProvidersService } from './auth-providers.service'
import type { AuthService, AuthServiceResult } from './auth.service'
import type { EncryptedSecret } from './config-crypto.utils'
import type { RegistrationPolicyService } from './registration-policy.service'
import { Buffer } from 'node:buffer'
import { createHash, randomBytes } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { ulid } from 'ulid'
import { userIdentities, users } from '../../database/schema'
import { config } from '../../utils/config'
import { AVATAR_VARIANT_SPECS } from '../files/image-processing.service'
import { decryptSecret } from './config-crypto.utils'

// `User.Read` lets the callback fetch the profile photo from Graph. It is the
// default delegated permission of every Azure app registration.
const MICROSOFT_SCOPES = 'openid profile email User.Read'
const USERINFO_ENDPOINT = 'https://graph.microsoft.com/oidc/userinfo'
const PHOTO_ENDPOINT = 'https://graph.microsoft.com/v1.0/me/photo/$value'

const AVATAR_ENTITY_TYPE = 'user-avatar'

const MIME_EXTENSIONS: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
}

export type OAuthErrorCode = 'oauth_failed' | 'oauth_no_email' | 'provider_disabled' | 'registration_disabled'

/**
 * Carries a stable error code through the OAuth flow. The callback route maps
 * it onto `/auth/sign-in?error=<code>` instead of surfacing an exception.
 */
export class OAuthFlowError extends Error {
  constructor(public readonly code: OAuthErrorCode, message?: string) {
    super(message ?? code)
    this.name = 'OAuthFlowError'
  }
}

interface MicrosoftProviderConfig {
  clientId?: string
  tenant?: string
  clientSecret?: EncryptedSecret
}

interface MicrosoftUserinfo {
  sub?: string
  email?: string
  name?: string
}

export interface OAuthCallbackInput {
  code?: string
  state?: string
  expectedState?: string
  verifier?: string
  anonymousUser?: Pick<User, 'id'>
}

export interface CreateOauthServiceDeps {
  db: DatabaseClient
  authProvidersService: AuthProvidersService
  authService: AuthService
  registrationPolicyService: RegistrationPolicyService
  fileService: FileService
  imageProcessingService: ImageProcessingService
  eventBus?: EventBus
}

export const createOauthService = ({ db, authProvidersService, authService, registrationPolicyService, fileService, imageProcessingService, eventBus }: CreateOauthServiceDeps) => {
  const redirectUri = `${config.site.url}/api/auth/oauth/microsoft/callback`

  const getMicrosoftConfig = async (provider: string): Promise<Required<MicrosoftProviderConfig>> => {
    if (provider !== 'microsoft') {
      throw new OAuthFlowError('provider_disabled', `Unknown OAuth provider: ${provider}`)
    }

    const row = await authProvidersService.getProvider('microsoft')
    if (!row || !row.enabled) {
      throw new OAuthFlowError('provider_disabled', 'Microsoft provider is disabled')
    }

    const providerConfig = row.config as MicrosoftProviderConfig
    if (!providerConfig.clientId || !providerConfig.tenant || !providerConfig.clientSecret) {
      throw new OAuthFlowError('provider_disabled', 'Microsoft provider is not fully configured')
    }

    return providerConfig as Required<MicrosoftProviderConfig>
  }

  const buildAuthorizationRedirect = async (provider: string): Promise<{ url: string, state: string, verifier: string }> => {
    const providerConfig = await getMicrosoftConfig(provider)

    const state = randomBytes(32).toString('hex')
    const verifier = randomBytes(32).toString('base64url')
    const challenge = createHash('sha256').update(verifier).digest('base64url')

    const url = new URL(`https://login.microsoftonline.com/${providerConfig.tenant}/oauth2/v2.0/authorize`)
    url.searchParams.set('client_id', providerConfig.clientId)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('redirect_uri', redirectUri)
    url.searchParams.set('scope', MICROSOFT_SCOPES)
    url.searchParams.set('state', state)
    url.searchParams.set('code_challenge', challenge)
    url.searchParams.set('code_challenge_method', 'S256')

    return { url: url.toString(), state, verifier }
  }

  const exchangeCode = async (providerConfig: Required<MicrosoftProviderConfig>, code: string, verifier: string): Promise<string> => {
    const { encrypted, iv, tag } = providerConfig.clientSecret
    const clientSecret = decryptSecret(encrypted, iv, tag)

    const response = await fetch(`https://login.microsoftonline.com/${providerConfig.tenant}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: providerConfig.clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    })

    if (!response.ok) {
      console.error('[OAuth] Token exchange failed:', response.status, await response.text().catch(() => ''))
      throw new OAuthFlowError('oauth_failed', 'Token exchange failed')
    }

    const payload = await response.json() as { access_token?: string }
    if (!payload.access_token) {
      throw new OAuthFlowError('oauth_failed', 'Token response carries no access token')
    }

    return payload.access_token
  }

  const fetchUserinfo = async (accessToken: string): Promise<{ sub: string, email: string, name?: string }> => {
    const response = await fetch(USERINFO_ENDPOINT, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!response.ok) {
      console.error('[OAuth] Userinfo request failed:', response.status)
      throw new OAuthFlowError('oauth_failed', 'Userinfo request failed')
    }

    const payload = await response.json() as MicrosoftUserinfo

    if (!payload.sub) {
      throw new OAuthFlowError('oauth_failed', 'Userinfo response carries no subject')
    }
    if (!payload.email) {
      throw new OAuthFlowError('oauth_no_email', 'Userinfo response carries no email')
    }

    return { sub: payload.sub, email: payload.email.toLowerCase().trim(), name: payload.name }
  }

  const createIdentity = async (userId: string, sub: string, email: string) => {
    await db
      .insert(userIdentities)
      .values({
        id: ulid(),
        userId,
        provider: 'microsoft',
        providerAccountId: sub,
        email,
      })
  }

  const emitUserRegistered = (user: User) => {
    eventBus?.emit('auth:user-registered', {
      userId: user.id,
      email: user.email,
      timestamp: new Date(),
    })
  }

  /**
   * Resolves the Microsoft identity to a local user, in this order: existing
   * identity, auto-linking by email, anonymous upgrade, new account. The last
   * two count as registration and go through the registration policy.
   */
  const resolveUser = async (sub: string, email: string, name: string | undefined, anonymousUser?: Pick<User, 'id'>): Promise<User> => {
    // 1. Existing identity: login via stable IdP subject.
    const [identity] = await db
      .select()
      .from(userIdentities)
      .where(and(
        eq(userIdentities.provider, 'microsoft'),
        eq(userIdentities.providerAccountId, sub),
      ))
      .limit(1)

    if (identity) {
      if (identity.email !== email) {
        await db
          .update(userIdentities)
          .set({ email, updatedAt: new Date() })
          .where(eq(userIdentities.id, identity.id))
      }

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, identity.userId))
        .limit(1)

      if (!user) {
        throw new OAuthFlowError('oauth_failed', 'Identity points to a missing user')
      }

      return user
    }

    // 2. Auto-linking: the IdP email belongs to an existing account.
    const [existingUser] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingUser) {
      await createIdentity(existingUser.id, sub, email)

      if (!existingUser.emailVerified) {
        const [updated] = await db
          .update(users)
          .set({ emailVerified: true, updatedAt: new Date() })
          .where(eq(users.id, existingUser.id))
          .returning()

        return updated ?? existingUser
      }

      return existingUser
    }

    // No existing account: both remaining paths register a new identity-backed
    // account, so the registration policy applies to each of them.
    if (!await registrationPolicyService.canRegister(email)) {
      throw new OAuthFlowError('registration_disabled', 'Registration is invite-only')
    }

    // 3. Anonymous upgrade: keep the user row, attach the Microsoft identity.
    if (anonymousUser) {
      const [upgraded] = await db
        .update(users)
        .set({
          email,
          ...(name ? { name } : {}),
          authProvider: 'microsoft',
          emailVerified: true,
          updatedAt: new Date(),
        })
        .where(eq(users.id, anonymousUser.id))
        .returning()

      if (!upgraded) {
        throw new OAuthFlowError('oauth_failed', 'Failed to upgrade anonymous user')
      }

      await createIdentity(upgraded.id, sub, email)
      emitUserRegistered(upgraded)

      return upgraded
    }

    // 4. New account.
    const [created] = await db
      .insert(users)
      .values({
        id: ulid(),
        email,
        name,
        authProvider: 'microsoft',
        emailVerified: true,
      })
      .returning()

    if (!created) {
      throw new OAuthFlowError('oauth_failed', 'Failed to create user')
    }

    await createIdentity(created.id, sub, email)
    emitUserRegistered(created)

    return created
  }

  /**
   * Imports the IdP profile photo as the user's avatar, as the upload endpoint
   * would: an `user-avatar` original plus generated size variants. Runs only
   * while the user has no avatar yet, so a photo the user picked or removed
   * later stays untouched. Best effort: no failure here may break the login —
   * a 404 means no photo, a 401/403 a registration without `User.Read`.
   */
  const syncAvatarFromIdp = async (userId: string, accessToken: string): Promise<void> => {
    try {
      const existing = await fileService.getFilesByEntity(AVATAR_ENTITY_TYPE, userId)
      if (existing.length > 0) {
        return
      }

      const response = await fetch(PHOTO_ENDPOINT, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!response.ok) {
        return
      }

      const mimeType = response.headers.get('content-type')?.split(';')[0]?.trim() || 'image/jpeg'
      const buffer = Buffer.from(await response.arrayBuffer())
      if (buffer.length === 0) {
        return
      }

      const extension = MIME_EXTENSIONS[mimeType] ?? '.jpg'
      const original = await fileService.upload({
        buffer,
        originalName: `microsoft-avatar${extension}`,
        mimeType,
        size: buffer.length,
        uploadedBy: userId,
        entityType: AVATAR_ENTITY_TYPE,
        entityId: userId,
        variant: 'original',
      })

      const variants = await imageProcessingService.generateVariants(buffer, mimeType, AVATAR_VARIANT_SPECS)
      await Promise.all(
        variants.map(variant =>
          fileService.upload({
            buffer: variant.buffer,
            originalName: `${variant.variant}-microsoft-avatar${MIME_EXTENSIONS[variant.mimeType] ?? '.webp'}`,
            mimeType: variant.mimeType,
            size: variant.buffer.length,
            uploadedBy: userId,
            entityType: AVATAR_ENTITY_TYPE,
            entityId: userId,
            parentId: original.id,
            variant: variant.variant,
          }),
        ),
      )
    }
    catch (error) {
      console.warn('[OAuth] Avatar import failed:', error)
    }
  }

  const handleCallback = async (provider: string, input: OAuthCallbackInput): Promise<AuthServiceResult> => {
    const providerConfig = await getMicrosoftConfig(provider)

    const { code, state, expectedState, verifier, anonymousUser } = input
    if (!code || !state || !expectedState || state !== expectedState || !verifier) {
      throw new OAuthFlowError('oauth_failed', 'State or PKCE verifier mismatch')
    }

    const accessToken = await exchangeCode(providerConfig, code, verifier)
    const { sub, email, name } = await fetchUserinfo(accessToken)

    const user = await resolveUser(sub, email, name, anonymousUser)

    await syncAvatarFromIdp(user.id, accessToken)

    const { session, token } = await authService.createSessionForUser(user.id)

    const { passwordHash: _, ...safeUser } = user
    return { user: safeUser, session, token }
  }

  return {
    buildAuthorizationRedirect,
    handleCallback,
  }
}

export type OauthService = ReturnType<typeof createOauthService>
