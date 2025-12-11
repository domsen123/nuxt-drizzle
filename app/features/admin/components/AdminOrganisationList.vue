<script setup lang="ts">
import type { TableColumn } from '@nuxt/ui'
import type { AdminOrganisation } from '../types/admin.types'

defineProps<{
  organisations: AdminOrganisation[]
  loading?: boolean
}>()

const columns: TableColumn<AdminOrganisation>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'slug', header: 'Slug' },
  { accessorKey: 'createdAt', header: 'Created' },
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
</script>

<template>
  <UTable
    :columns="columns"
    :data="organisations"
    :loading="loading"
  >
    <template #name-cell="{ row }">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-building-2" class="text-muted" />
        <span class="font-medium">{{ row.original.name }}</span>
      </div>
    </template>

    <template #slug-cell="{ row }">
      <UBadge color="neutral" variant="subtle">
        {{ row.original.slug }}
      </UBadge>
    </template>

    <template #createdAt-cell="{ row }">
      {{ formatDate(row.original.createdAt) }}
    </template>

    <template #empty>
      <div class="text-center py-8 text-muted">
        No organisations found
      </div>
    </template>
  </UTable>
</template>
