<script setup lang="ts">
import AdminUserList from '~/features/admin/components/AdminUserList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Users - Admin',
})

const search = ref('')
const searchDebounced = refDebounced(search, 300)

const queryParams = computed(() => ({
  search: searchDebounced.value || undefined,
}))

const { users, total, status, error, refresh } = useAdminUsers(queryParams)

const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Users">
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
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold">
              Users
            </h1>
            <p class="text-muted">
              {{ total }} user{{ total !== 1 ? 's' : '' }} total
            </p>
          </div>
        </div>

        <!-- Search Bar -->
        <div class="mb-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by name or email..."
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
          title="Failed to load users"
          :description="error.message"
          icon="i-lucide-alert-circle"
          class="mb-4"
        />

        <AdminUserList
          :users="users"
          :loading="isLoading"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
