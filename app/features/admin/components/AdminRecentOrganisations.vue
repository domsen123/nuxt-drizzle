<script setup lang="ts">
import { formatDistanceToNowStrict } from 'date-fns'
import { useAdminOrganisations } from '../composables/useAdminOrganisations'
import AdminRecentCard from './AdminRecentCard.vue'

const { organisations, status } = useAdminOrganisations({ limit: 5, sort: ['-createdAt'] })

const relativeDate = (dateString: string) =>
  formatDistanceToNowStrict(new Date(dateString), { addSuffix: true })
</script>

<template>
  <AdminRecentCard
    title="Recent Organisations"
    icon="i-lucide-building-2"
    :view-all-to="ROUTES.admin.organisations"
    :loading="status === 'pending'"
    :empty="!organisations.length"
    empty-icon="i-lucide-building-2"
    empty-text="No organisations yet"
  >
    <template #empty-action>
      <UButton
        :to="ROUTES.admin.organisationCreate"
        label="New organisation"
        icon="i-lucide-plus"
        variant="soft"
        size="xs"
      />
    </template>

    <li v-for="org in organisations" :key="org.id">
      <NuxtLink
        :to="ROUTES.admin.organisationEdit(org.id)"
        class="group flex items-center gap-3 px-4 py-3 transition-colors hover:bg-elevated sm:px-5"
      >
        <UAvatar icon="i-lucide-building-2" size="md" />
        <div class="min-w-0 flex-1">
          <p class="truncate text-sm font-medium text-highlighted">
            {{ org.name }}
          </p>
          <p class="truncate text-xs text-muted">
            {{ org.slug }}
          </p>
        </div>
        <span class="hidden whitespace-nowrap text-xs text-muted sm:block">
          {{ relativeDate(org.createdAt) }}
        </span>
        <UIcon
          name="i-lucide-chevron-right"
          class="size-4 shrink-0 text-dimmed transition-transform group-hover:translate-x-0.5"
        />
      </NuxtLink>
    </li>
  </AdminRecentCard>
</template>
