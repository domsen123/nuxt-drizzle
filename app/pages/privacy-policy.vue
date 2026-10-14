<script setup lang="ts">
const { t, locale } = useI18n()

// Localized content with English fallback when the localized entry is missing.
const { data: page } = await useAsyncData('legal-privacy', async () => {
  const localized = await queryCollection('legal').path(`/legal/${locale.value}/privacy-policy`).first()
  return localized ?? await queryCollection('legal').path('/legal/en/privacy-policy').first()
}, { watch: [locale] })

const title = computed(() => page.value?.title ?? t('legal.privacy.title'))
const description = computed(() => page.value?.description ?? t('legal.privacy.description'))

useSeoMeta({
  title,
  description,
})
</script>

<template>
  <UContainer class="py-16">
    <UPageHeader
      :title="title"
      :description="description"
    />

    <div class="prose dark:prose-invert mt-8 max-w-none">
      <ContentRenderer v-if="page" :value="page" />
    </div>
  </UContainer>
</template>
