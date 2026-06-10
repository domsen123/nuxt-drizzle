<script setup lang="ts">
const title = 'Privacy Policy'
const description = 'How we collect, use, and protect your personal data.'

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
      <p>
        This page is a placeholder for the Privacy Policy. Replace this content
        with your actual privacy policy before going to production.
      </p>
    </div>
  </UContainer>
</template>
