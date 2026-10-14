/**
 * Maps a $fetch error to a translated message. Servers send stable error
 * codes in `data.code`; the client resolves them to `errors.<code>` keys.
 * Falls back to the English `statusMessage` and a generic message.
 */
export const useApiErrorMessage = () => {
  const { t, te } = useI18n()

  return (error: unknown): string => {
    const err = error as {
      data?: { statusMessage?: string, data?: { code?: string } }
      message?: string
    } | null

    const code = err?.data?.data?.code
    if (code && te(`errors.${code}`))
      return t(`errors.${code}`)

    return err?.data?.statusMessage || err?.message || t('errors.unexpected')
  }
}
