import type { UserPreferences } from '~~/shared/user-preferences.constants'
import { DEFAULT_COLOR_MODE, DEFAULT_NEUTRAL_COLOR, DEFAULT_PRIMARY_COLOR } from '~~/shared/user-preferences.constants'

/**
 * Applies preferences to the color-mode module and the app config.
 * Missing keys fall back to the app defaults.
 */
export const useApplyPreferences = () => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()

  return (preferences?: UserPreferences) => {
    colorMode.preference = preferences?.colorMode ?? DEFAULT_COLOR_MODE
    appConfig.ui.colors.primary = preferences?.primaryColor ?? DEFAULT_PRIMARY_COLOR
    appConfig.ui.colors.neutral = preferences?.neutralColor ?? DEFAULT_NEUTRAL_COLOR
  }
}
