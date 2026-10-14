<script setup lang="ts">
import type { NuxtError } from '#app'

defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true,
  },
})

const { t, localeProperties } = useI18n()

useHead({
  htmlAttrs: {
    lang: computed(() => localeProperties.value.language ?? 'en-US'),
  },
})

useSeoMeta({
  title: () => t('errors.pageNotFound.title'),
  description: () => t('errors.pageNotFound.description'),
})
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <UContainer>
        <UPage>
          <UError :error="error" />
        </UPage>
      </UContainer>
    </UMain>

    <AppFooter />

    <UToaster />
  </div>
</template>
