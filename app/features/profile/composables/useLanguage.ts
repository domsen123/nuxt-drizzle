import type { Locale } from '~~/shared/user-preferences.constants'
import { useSession } from '~/features/auth'
import { useUpdatePreferences } from './useProfileMutations'

/**
 * Applies the selection immediately via the i18n cookie. Persists it only
 * for signed-in, non-anonymous users outside an active impersonation.
 */
export const useLanguage = () => {
  const { locale, setLocale } = useI18n()
  const { user, isAnonymous, isImpersonating } = useSession()
  const { mutate: updatePreferences } = useUpdatePreferences()

  const currentLocale = computed(() => locale.value as Locale)

  const setLanguage = (next: Locale) => {
    setLocale(next)

    if (user.value && !isAnonymous.value && !isImpersonating.value) {
      updatePreferences({ locale: next })
    }
  }

  return {
    currentLocale,
    setLanguage,
  }
}
