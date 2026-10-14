<script setup lang="ts">
import AdminRecentOrganisations from '~/features/admin/components/AdminRecentOrganisations.vue'
import AdminRecentUsers from '~/features/admin/components/AdminRecentUsers.vue'
import AdminStatCard from '~/features/admin/components/AdminStatCard.vue'
import { useAdminStats } from '~/features/admin/composables/useAdminStats'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Admin Dashboard',
})

const { stats, status } = useAdminStats()

const isLoading = computed(() => status.value === 'pending')

const verifiedPercentage = computed(() => {
  const total = stats.value?.totalUsers ?? 0
  if (total === 0)
    return 0
  return Math.round(((stats.value?.verifiedUsers ?? 0) / total) * 100)
})

const quickActions = [
  {
    label: 'New organisation',
    description: 'Create an organisation',
    icon: 'i-lucide-building-2',
    to: ROUTES.admin.organisationCreate,
  },
  {
    label: 'New blog post',
    description: 'Write and publish content',
    icon: 'i-lucide-pen-line',
    to: ROUTES.admin.blogPostCreate,
  },
  {
    label: 'Media library',
    description: 'Upload and manage files',
    icon: 'i-lucide-images',
    to: ROUTES.admin.media,
  },
  {
    label: 'Auth settings',
    description: 'Configure sign-in providers',
    icon: 'i-lucide-shield-check',
    to: ROUTES.admin.settingsAuthentication,
  },
]
</script>

<template>
  <DashboardAdminPage title="Dashboard">
    <!-- Stats -->
    <section class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <AdminStatCard
        label="Total Users"
        icon="i-lucide-users"
        :value="stats?.totalUsers"
        :loading="isLoading"
      >
        <template #footer>
          <div class="space-y-1.5">
            <div class="h-1.5 w-full overflow-hidden rounded-full bg-accented">
              <div
                class="h-full rounded-full bg-primary transition-all"
                :style="{ width: `${verifiedPercentage}%` }"
              />
            </div>
            <p class="text-xs text-muted">
              {{ stats?.verifiedUsers ?? 0 }} verified · {{ stats?.unverifiedUsers ?? 0 }} unverified
            </p>
          </div>
        </template>
      </AdminStatCard>

      <AdminStatCard
        label="Organisations"
        icon="i-lucide-building-2"
        :value="stats?.totalOrganisations"
        :loading="isLoading"
      />

      <AdminStatCard
        label="Teams"
        icon="i-lucide-users-round"
        :value="stats?.totalTeams"
        :loading="isLoading"
      />

      <AdminStatCard
        label="Active Sessions"
        icon="i-lucide-activity"
        :value="stats?.activeSessions"
        :loading="isLoading"
      >
        <template #footer>
          <p class="flex items-center gap-1.5 text-xs text-muted">
            <span class="relative flex size-2">
              <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-success" />
            </span>
            Live
          </p>
        </template>
      </AdminStatCard>
    </section>

    <!-- Quick actions -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-highlighted">
        Quick actions
      </h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="action in quickActions"
          :key="action.to"
          :to="action.to"
          class="group flex items-center gap-3 rounded-lg bg-elevated/50 p-4 ring ring-default transition hover:bg-elevated hover:ring-primary/50"
        >
          <span class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring ring-inset ring-primary/20">
            <UIcon :name="action.icon" class="size-5" />
          </span>
          <span class="min-w-0">
            <span class="block truncate text-sm font-medium text-highlighted">{{ action.label }}</span>
            <span class="block truncate text-xs text-muted">{{ action.description }}</span>
          </span>
          <UIcon
            name="i-lucide-arrow-right"
            class="ml-auto size-4 shrink-0 -translate-x-1 text-dimmed opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100"
          />
        </NuxtLink>
      </div>
    </section>

    <!-- Recent activity -->
    <section class="space-y-3">
      <h2 class="text-sm font-semibold text-highlighted">
        Recent activity
      </h2>
      <div class="grid grid-cols-1 items-stretch gap-4 lg:grid-cols-2">
        <AdminRecentUsers />
        <AdminRecentOrganisations />
      </div>
    </section>
  </DashboardAdminPage>
</template>
