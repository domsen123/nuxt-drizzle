import type { Session, User } from '../database/schema'

declare module 'h3' {
  interface H3EventContext {
    session: Session | null
    user: Omit<User, 'passwordHash'> | null
  }
}
