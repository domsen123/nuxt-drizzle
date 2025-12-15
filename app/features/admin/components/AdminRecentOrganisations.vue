<script setup lang="ts">
import { useAdminOrganisations } from '../composables/useAdminOrganisations'

const { organisations, status } = useAdminOrganisations({ limit: 5, sort: ['-createdAt'] })
</script>

<template>
  <UCard>
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="font-semibold">
          Recent Organisations
        </h3>
        <NuxtLink
          to="/admin/organisations"
          class="text-sm text-primary hover:underline"
        >
          View all
        </NuxtLink>
      </div>
    </template>

    <div v-if="status === 'pending'" class="space-y-3">
      <div v-for="i in 5" :key="i" class="flex items-center gap-3">
        <USkeleton class="size-10 rounded-lg" />
        <div class="flex-1 space-y-2">
          <USkeleton class="h-4 w-32" />
          <USkeleton class="h-3 w-24" />
        </div>
      </div>
    </div>

    <ul v-else-if="organisations.length" class="divide-y divide-default">
      <li v-for="org in organisations" :key="org.id">
        <NuxtLink
          :to="`/admin/organisations/${org.id}`"
          class="flex items-center gap-3 py-3 hover:bg-elevated transition-colors -mx-4 px-4"
        >
          <div class="p-2 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-building-2" class="size-5 text-primary" />
          </div>
          <div class="flex-1 min-w-0">
            <p class="font-medium truncate">
              {{ org.name }}
            </p>
            <p class="text-sm text-muted truncate">
              {{ org.slug }}
            </p>
          </div>
          <span class="text-xs text-muted">
            {{ new Date(org.createdAt).toLocaleDateString() }}
          </span>
        </NuxtLink>
      </li>
    </ul>

    <div v-else class="py-8 text-center text-muted">
      <UIcon name="i-lucide-building-2" class="size-8 mx-auto mb-2 opacity-50" />
      <p>No organisations yet</p>
    </div>
  </UCard>
</template>
