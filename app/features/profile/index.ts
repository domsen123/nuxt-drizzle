// API
export { useProfileApi } from './api/profile.api'

export { profileKeys } from './api/profile.keys'
// Composables
export { useAppearance } from './composables/useAppearance'
export { useAppearanceMenuItem } from './composables/useAppearanceMenuItem'
export { useLanguage } from './composables/useLanguage'
export { useLanguageMenuItem } from './composables/useLanguageMenuItem'
export { useProfile } from './composables/useProfile'

export { useChangePassword, useUpdatePreferences, useUpdateProfile } from './composables/useProfileMutations'
// Types
export type {
  ChangePasswordInput,
  ProfileResponse,
  UpdateProfileInput,
  UserProfile,
} from './types/profile.types'
export type { Locale, UserPreferences } from '~~/shared/user-preferences.constants'
export { LOCALES } from '~~/shared/user-preferences.constants'
