<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Admin Dashboard',
})

const { total: organisationCount, status } = useAdminOrganisations()
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <h1 class="text-2xl font-bold mb-6">
          Platform Overview
        </h1>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Organisations"
            :value="organisationCount"
            icon="i-lucide-building-2"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
