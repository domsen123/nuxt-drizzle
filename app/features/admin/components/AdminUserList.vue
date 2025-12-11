<script setup lang="ts">
import type { TableColumn, TableRow } from '@nuxt/ui'
import type { AdminUser } from '../types/admin.types'

defineProps<{
  users: AdminUser[]
  loading?: boolean
}>()

const router = useRouter()

const onSelect = (_e: Event, row: TableRow<AdminUser>) => {
  router.push(ROUTES.admin.userEdit(row.original.id))
}

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'emailVerified', header: 'Verified' },
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
    :data="users"
    :loading="loading"
    class="cursor-pointer"
    @select="onSelect"
  >
    <template #name-cell="{ row }">
      <div class="flex items-center gap-2">
        <UIcon name="i-lucide-user" class="text-muted" />
        <span class="font-medium">{{ row.original.name || 'No name' }}</span>
      </div>
    </template>

    <template #email-cell="{ row }">
      <span class="text-muted">{{ row.original.email }}</span>
    </template>

    <template #emailVerified-cell="{ row }">
      <UBadge
        :color="row.original.emailVerified ? 'success' : 'neutral'"
        variant="subtle"
      >
        {{ row.original.emailVerified ? 'Verified' : 'Unverified' }}
      </UBadge>
    </template>

    <template #createdAt-cell="{ row }">
      {{ formatDate(row.original.createdAt) }}
    </template>

    <template #empty>
      <div class="text-center py-8 text-muted">
        No users found
      </div>
    </template>
  </UTable>
</template>
