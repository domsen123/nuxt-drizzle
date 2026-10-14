<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  auth: true,
})

const { t } = useI18n()

const links = computed<NavigationMenuItem[][]>(() => [[
  {
    label: t('nav.profile'),
    icon: 'i-lucide-user',
    to: '/settings',
    exact: true,
  },
  {
    label: t('nav.security'),
    icon: 'i-lucide-shield',
    to: '/settings/security',
  },
]])
</script>

<template>
  <UContainer>
    <UPage>
      <template #left>
        <UPageAside>
          <UNavigationMenu :items="links" orientation="vertical" highlight />
        </UPageAside>
      </template>
      <UPageHeader :title="$t('settings.title')" />

      <UPageBody>
        <div class="max-w-3xl">
          <NuxtPage />
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
