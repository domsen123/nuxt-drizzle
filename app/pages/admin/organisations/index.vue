<script setup lang="ts">
import AdminOrganisationList from '~/features/admin/components/AdminOrganisationList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Organisations - Admin',
})

const { organisations, total, status, error, refresh } = useAdminOrganisations()

const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Organisations">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              :loading="isLoading"
              @click="refresh()"
            />
            <UButton
              icon="i-lucide-plus"
              label="Create"
              :to="ROUTES.admin.organisationCreate"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold">
              Organisations
            </h1>
            <p class="text-muted">
              {{ total }} organisation{{ total !== 1 ? 's' : '' }} total
            </p>
          </div>
        </div>

        <UAlert
          v-if="error"
          color="error"
          title="Failed to load organisations"
          :description="error.message"
          icon="i-lucide-alert-circle"
          class="mb-4"
        />

        <AdminOrganisationList
          :organisations="organisations"
          :loading="isLoading"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
