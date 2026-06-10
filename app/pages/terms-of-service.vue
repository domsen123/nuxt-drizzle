<script setup lang="ts">
const title = 'Terms of Service'
const description = 'The terms and conditions for using our service.'

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
        This page is a placeholder for the Terms of Service. Replace this content
        with your actual terms before going to production.
      </p>
    </div>
  </UContainer>
</template>
