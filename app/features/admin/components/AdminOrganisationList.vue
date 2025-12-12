<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui'
import type { AdminOrganisation } from '../types/admin.types'

defineProps<{
  organisations: AdminOrganisation[]
  loading?: boolean
}>()

const router = useRouter()

const onSelect = (_e: Event, row: TableRow<AdminOrganisation>) => {
  router.push(ROUTES.admin.organisationEdit(row.original.id))
}

const columns: TableColumn<AdminOrganisation>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'createdAt', header: 'Created' },
  { id: 'actions' },
]

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getActionsMenu = (_org: AdminOrganisation): DropdownMenuItem[] => [
  {
    label: 'Edit organisation',
    icon: 'i-lucide-pencil',
  },
  {
    label: 'Delete organisation',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
  },
]
</script>

<template>
  <UPageCard
    variant="subtle"
    :ui="{
      container: 'p-0 sm:p-0 gap-y-0',
      wrapper: 'items-stretch',
    }"
  >
    <UTable
      :columns="columns"
      :data="organisations"
      :loading="loading"
      :ui="{
        tr: 'hover:bg-elevated transition-colors cursor-pointer',
      }"
      @select="onSelect"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-building-2" class="size-5 text-primary" />
          </div>
          <div class="text-sm">
            <p class="text-highlighted font-medium">
              {{ row.original.name }}
            </p>
            <p class="text-muted text-xs">
              {{ row.original.slug }}
            </p>
          </div>
        </div>
      </template>

      <template #createdAt-cell="{ row }">
        {{ formatDate(row.original.createdAt) }}
      </template>

      <template #actions-cell="{ row }">
        <div class="flex justify-end">
          <UDropdownMenu :items="getActionsMenu(row.original)" :content="{ align: 'end' }">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
              @click.stop
            />
          </UDropdownMenu>
        </div>
      </template>

      <template #empty>
        <div class="py-12 text-center text-muted">
          <UIcon name="i-lucide-building-2" class="size-8 mx-auto mb-2 opacity-50" />
          <p>No organisations found</p>
        </div>
      </template>
    </UTable>
  </UPageCard>
</template>
