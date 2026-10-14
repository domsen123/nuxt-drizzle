// API
export { useProfileApi } from './api/profile.api'

export { profileKeys } from './api/profile.keys'
// Composables
export { useAppearance } from './composables/useAppearance'
export { useAppearanceMenuItem } from './composables/useAppearanceMenuItem'
export { useProfile } from './composables/useProfile'

export { useChangePassword, useUpdatePreferences, useUpdateProfile } from './composables/useProfileMutations'
// Types
export type {
  ChangePasswordInput,
  ProfileResponse,
  UpdateProfileInput,
  UserProfile,
} from './types/profile.types'
export type { UserPreferences } from '~~/shared/user-preferences.constants'
