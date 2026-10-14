<script setup lang="ts">
import { useAppearance } from '~/features/profile'

const colorMode = useColorMode()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')

const { localeProperties } = useI18n()
const htmlLang = computed(() => localeProperties.value.language ?? 'en-US')

const { user } = useSession()
const { applyPreferences } = useAppearance()

// DB wins for signed-in, non-anonymous users: runs on SSR render, login,
// logout, and impersonation switches.
watch(user, (value) => {
  if (value && value.authProvider !== 'anonymous') {
    applyPreferences(value.preferences)
  }
}, { immediate: true })

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color },
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
  ],
  htmlAttrs: {
    lang: htmlLang,
  },
})

useSeoMeta({
  titleTemplate: '%s - Nuxt SaaS template',
  ogImage: 'https://ui.nuxt.com/assets/templates/nuxt/saas-light.png',
  twitterImage: 'https://ui.nuxt.com/assets/templates/nuxt/saas-light.png',
  twitterCard: 'summary_large_image',
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
