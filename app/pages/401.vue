<script setup lang="ts">
definePageMeta({
  layout: 'default',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('errors.accessDenied.title'),
})
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
    <UIcon name="i-lucide-shield-x" class="w-16 h-16 text-error mb-4" />
    <h1 class="text-3xl font-bold mb-2">
      {{ $t('errors.accessDenied.title') }}
    </h1>
    <p class="text-muted mb-6 max-w-md">
      {{ $t('errors.accessDenied.description') }}
    </p>
    <UButton :to="ROUTES.start" color="primary">
      {{ $t('common.actions.goToHome') }}
    </UButton>
  </div>
</template>
