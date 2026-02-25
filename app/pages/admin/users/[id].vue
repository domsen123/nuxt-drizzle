<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const userId = computed(() => route.params.id as string)

const { user, status, error, refresh } = useAdminUser(userId)

// Provide user data to child pages
provide('adminUser', {
  user,
  userId,
  status,
  error,
  refresh,
})
</script>

<template>
  <DashboardAdminPage :title="user?.name || user?.email || 'User'">
    <NuxtPage />
  </DashboardAdminPage>
</template>
