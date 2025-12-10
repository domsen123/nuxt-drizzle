import type { AuthService } from '../features/auth/auth.service'
import { createAuthService } from '../features/auth/auth.service'
import { getDatabase } from '../infrastructure/database/client'

// Lazy initialization helper
const lazy = <T>(factory: () => T): (() => T) => {
  let instance: T | undefined
  return () => {
    if (!instance) {
      instance = factory()
    }
    return instance
  }
}

// Services
const getAuthService = lazy(() =>
  createAuthService({
    db: getDatabase('app'),
  }),
)

// Public exports
export const container = {
  get authService(): AuthService {
    return getAuthService()
  },
}
