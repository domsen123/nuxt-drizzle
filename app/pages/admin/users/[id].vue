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
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="user?.name || user?.email || 'User'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :to="ROUTES.admin.users"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
