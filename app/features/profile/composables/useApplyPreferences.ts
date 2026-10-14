import type { UserPreferences } from '~~/shared/user-preferences.constants'
import { DEFAULT_COLOR_MODE, DEFAULT_NEUTRAL_COLOR, DEFAULT_PRIMARY_COLOR } from '~~/shared/user-preferences.constants'

/**
 * Applies preferences to the color-mode module, the app config, and the
 * active locale. Missing appearance keys fall back to the app defaults.
 * A missing locale keeps the cookie/detection language active; a stored
 * locale wins over the cookie (DB wins on load).
 */
export const useApplyPreferences = () => {
  const colorMode = useColorMode()
  const appConfig = useAppConfig()
  const { locale, setLocale } = useI18n()

  return (preferences?: UserPreferences) => {
    colorMode.preference = preferences?.colorMode ?? DEFAULT_COLOR_MODE
    appConfig.ui.colors.primary = preferences?.primaryColor ?? DEFAULT_PRIMARY_COLOR
    appConfig.ui.colors.neutral = preferences?.neutralColor ?? DEFAULT_NEUTRAL_COLOR

    if (preferences?.locale && preferences.locale !== locale.value) {
      setLocale(preferences.locale)
    }
  }
}
