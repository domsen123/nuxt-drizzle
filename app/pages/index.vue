<script setup lang="ts">
const { t } = useI18n()

useSeoMeta({
  titleTemplate: '',
  title: () => t('common.landing.title'),
  ogTitle: () => t('common.landing.title'),
  description: () => t('common.landing.description'),
  ogDescription: () => t('common.landing.description'),
})
</script>

<template>
  <div>
  </div>
</template>
