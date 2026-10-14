<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { useAdminUsers } from '../composables/useAdminUsers'
import AdminRecentCard from './AdminRecentCard.vue'

const { users, status } = useAdminUsers({ limit: 5, sort: ['-createdAt'] })

const relativeDate = (dateString: string) =>
  formatDistanceToNowStrict(new Date(dateString), { addSuffix: true })
</script>

<template>
  <AdminRecentCard
    title="Recent Users"
    icon="i-lucide-users"
    :view-all-to="ROUTES.admin.users"
    :loading="status === 'pending'"
    :empty="!users.length"
    empty-icon="i-lucide-users"
    empty-text="No users yet"
  >
    <li v-for="user in users" :key="user.id">
      <NuxtLink
        :to="ROUTES.admin.userEdit(user.id)"
        class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated sm:px-5"
      >
        <UAvatar :alt="user.name || user.email || undefined" size="md" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ user.name || 'No name' }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ user.email }}
          </p>
        </div>
        <UBadge
          :color="user.emailVerified ? 'success' : 'warning'"
          variant="subtle"
          size="sm"
        >
          {{ user.emailVerified ? 'Verified' : 'Unverified' }}
        </UBadge>
        <span class="hidden whitespace-nowrap text-xs text-muted sm:block">
          {{ relativeDate(user.createdAt) }}
        </span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
        />
      </NuxtLink>
    </li>
  </AdminRecentCard>
</template>
