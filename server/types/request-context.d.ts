import type { Session, User } from '../database/schema'
import type { UserPermissionContext } from '../features/rbac/rbac.types'

export interface ImpersonationContext {
  originalUserId: string
  originalSessionId: string | null
}

/** What `01.auth.ts` and `02.anon-auth.ts` put on the request context. */
interface AppRequestContext {
  session: Session | null
  user: Omit<User, 'passwordHash'> | null
  impersonation: ImpersonationContext | null
  /** Cached by `getPermissionContext()` for the rest of the request. */
  permissions?: UserPermissionContext
}

declare module 'nuxt/schema' {
  interface RequestEventContext extends AppRequestContext {}
}
