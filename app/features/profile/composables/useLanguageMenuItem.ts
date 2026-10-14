import type { DropdownMenuItem } from '@nuxt/ui'
import type { Locale } from '~~/shared/user-preferences.constants'
import { LOCALE_NAMES, LOCALES } from '~~/shared/user-preferences.constants'
import { useLanguage } from './useLanguage'

// Flag icons are a client concern and stay out of shared/.
const LOCALE_ICONS: Record<Locale, string> = {
  en: 'i-flag-us-4x3',
  de: 'i-flag-de-4x3',
}

/**
 * Shared menu definitions for the Language submenu, modeled after
 * `useAppearanceMenuItem`. Labels show the endonym and are never translated.
 */
export const useLanguageMenuItem = () => {
  const { t } = useI18n()
  const { currentLocale, setLanguage } = useLanguage()

  const localeMenuItems = computed<DropdownMenuItem[]>(() =>
    LOCALES.map(code => ({
      label: LOCALE_NAMES[code],
      icon: LOCALE_ICONS[code],
      type: 'checkbox' as const,
      checked: currentLocale.value === code,
      onSelect: (e: Event) => {
        e.preventDefault()
        setLanguage(code)
      },
    })),
  )

  const languageMenuItem = computed<DropdownMenuItem>(() => ({
    label: t('common.language'),
    icon: 'i-lucide-languages',
    children: localeMenuItems.value,
  }))

  const guestLanguageMenuItems = localeMenuItems

  const currentLocaleIcon = computed(() => LOCALE_ICONS[currentLocale.value])

  return {
    languageMenuItem,
    guestLanguageMenuItems,
    currentLocaleIcon,
  }
}
