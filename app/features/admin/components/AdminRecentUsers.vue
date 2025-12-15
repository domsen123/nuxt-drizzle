<script setup lang="ts">
import { useAdminUsers } from '../composables/useAdminUsers'

const { users, status } = useAdminUsers({ limit: 5, sort: ['-createdAt'] })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">
          Recent Users
        </h3>
        <NuxtLink
          to="/admin/users"
          class="text-sm text-primary hover:underline"
        >
          View all
        </NuxtLink>
      </div>
    </template>

    <div v-if="status === 'pending'" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3">
        <USkeleton class="size-10 rounded-full" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-3 w-48" />
        </div>
      </div>
    </div>

    <ul v-else-if="users.length" class="divide-y divide-default">
      <li v-for="user in users" :key="user.id">
        <NuxtLink
          :to="`/admin/users/${user.id}`"
          class="flex items-center gap-3 py-3 hover:bg-elevated transition-colors -mx-4 px-4"
        >
          <UAvatar
            :alt="user.name || user.email"
            :ui="{ fallback: 'bg-primary/10 text-primary' }"
            size="md"
          />
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              {{ user.name || 'Unnamed' }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ user.email }}
            </p>
          </div>
          <UBadge
            :color="user.emailVerified ? 'success' : 'neutral'"
            variant="subtle"
            size="xs"
          >
            {{ user.emailVerified ? 'Verified' : 'Unverified' }}
          </UBadge>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="py-8 text-center text-muted">
      <UIcon name="i-lucide-users" class="size-8 mx-auto mb-2 opacity-50" />
      <p>No users yet</p>
    </div>
  </UCard>
</template>
