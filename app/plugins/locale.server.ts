/**
 * Applies the stored user locale during SSR, before the page renders.
 * The DB wins over the i18n cookie for signed-in, non-anonymous users;
 * `app/plugins/api.ts` has filled `payload.auth` at this point. Client-side
 * switches (login, impersonation) run through the watch in `app/app.vue`.
 */
export default defineNuxtPlugin({
  // Runs after api.ts: plugins load in file order and api.ts is awaited.
  name: 'locale',
  async setup(nuxtApp) {
    const user = nuxtApp.payload.auth?.user
    if (!user || user.authProvider === 'anonymous')
      return

    const locale = user.preferences?.locale
    const i18n = nuxtApp.$i18n

    if (locale && i18n.locale.value !== locale) {
      await i18n.setLocale(locale)
    }
  },
})
