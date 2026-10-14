<script setup lang="ts">
const { t, locale } = useI18n()

// Localized content with English fallback when the localized entry is missing.
const { data: page } = await useAsyncData('legal-terms', async () => {
  const localized = await queryCollection('legal').path(`/legal/${locale.value}/terms-of-service`).first()
  return localized ?? await queryCollection('legal').path('/legal/en/terms-of-service').first()
}, { watch: [locale] })

const title = computed(() => page.value?.title ?? t('legal.terms.title'))
const description = computed(() => page.value?.description ?? t('legal.terms.description'))

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
