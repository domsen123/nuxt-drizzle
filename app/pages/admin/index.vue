<script setup lang="ts">
import AdminRecentOrganisations from '~/features/admin/components/AdminRecentOrganisations.vue'
import AdminRecentUsers from '~/features/admin/components/AdminRecentUsers.vue'
import AdminStatsCard from '~/features/admin/components/AdminStatsCard.vue'
import { useAdminStats } from '~/features/admin/composables/useAdminStats'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Admin Dashboard',
})

const { stats, status } = useAdminStats()
</script>

<template>
  <DashboardAdminPage title="Dashboard">
    <div class="p-6 space-y-8">
      <div>
        <h1 class="text-2xl font-bold mb-6">
          Platform Overview
        </h1>

        <!-- Stats Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AdminStatsCard
            title="Total Users"
            :value="stats?.totalUsers ?? '—'"
            icon="i-lucide-users"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
          <AdminStatsCard
            title="Verified Users"
            :value="stats?.verifiedUsers ?? '—'"
            icon="i-lucide-user-check"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
          <AdminStatsCard
            title="Unverified Users"
            :value="stats?.unverifiedUsers ?? '—'"
            icon="i-lucide-user-x"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
          <AdminStatsCard
            title="Organisations"
            :value="stats?.totalOrganisations ?? '—'"
            icon="i-lucide-building-2"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
          <AdminStatsCard
            title="Teams"
            :value="stats?.totalTeams ?? '—'"
            icon="i-lucide-users-round"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
          <AdminStatsCard
            title="Active Sessions"
            :value="stats?.activeSessions ?? '—'"
            icon="i-lucide-activity"
            :description="status === 'pending' ? 'Loading...' : undefined"
          />
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <h2 class="text-lg font-semibold mb-4">
          Recent Activity
        </h2>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AdminRecentUsers />
          <AdminRecentOrganisations />
        </div>
      </div>
    </div>
  </DashboardAdminPage>
</template>
