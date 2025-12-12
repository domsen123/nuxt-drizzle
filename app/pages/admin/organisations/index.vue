<script setup lang="ts">
import AdminOrganisationList from '~/features/admin/components/AdminOrganisationList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Organisations - Admin',
})

const {
  search,
  page,
  perPage,
  offset,
  queryParams,
} = usePagination({
  defaultPerPage: 10,
  defaultSort: [{ key: 'createdAt', direction: 'desc' }],
})

const { organisations, total: apiTotal, status, error, refresh } = useAdminOrganisations(queryParams)

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
              {{ apiTotal }} organisation{{ apiTotal !== 1 ? 's' : '' }} total
            </p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by name or slug..."
          >
            <template #trailing>
              <UButton
                v-show="search !== ''"
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                :padded="false"
                @click="search = ''"
              />
            </template>
          </UInput>
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

        <!-- Pagination -->
        <div v-if="apiTotal > 0" class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted">
              Showing {{ offset + 1 }}-{{ Math.min(offset + perPage, apiTotal) }} of {{ apiTotal }}
            </span>
          </div>
          <UPagination
            v-model:page="page"
            :total="apiTotal"
            :items-per-page="perPage"
            show-edges
            @update:page="page = $event"
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
