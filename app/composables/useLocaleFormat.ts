import type { Locale as DateFnsLocale } from 'date-fns'
import type { Locale } from '~~/shared/user-preferences.constants'
import { format as formatDateFns } from 'date-fns'
import { de, enUS } from 'date-fns/locale'

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = {
  en: enUS,
  de,
}

/**
 * Locale-aware date and number formatting for non-admin surfaces.
 * Admin pages keep their hardcoded formats.
 */
export const useLocaleFormat = () => {
  const { locale } = useI18n()

  const formatDate = (date: Date | string | number, pattern = 'PPp') =>
    formatDateFns(new Date(date), pattern, { locale: DATE_FNS_LOCALES[locale.value as Locale] })

  const formatNumber = (value: number, options?: Intl.NumberFormatOptions) =>
    new Intl.NumberFormat(locale.value, options).format(value)

  return { formatDate, formatNumber }
}
