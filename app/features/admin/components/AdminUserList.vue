<script setup lang="ts">
import type { DropdownMenuItem, TableColumn, TableRow } from '@nuxt/ui'
import type { AdminUser } from '../types/admin.types'
import { useStartImpersonation } from '../composables/useImpersonation'

defineProps<{
  users: AdminUser[]
  loading?: boolean
}>()

const router = useRouter()
const toast = useToast()
const { user } = useSession()
const { mutateAsync: startImpersonation, asyncStatus: impersonationStatus } = useStartImpersonation()

const impersonatingUserId = ref<string | null>(null)

const onSelect = (_e: Event, row: TableRow<AdminUser>) => {
  router.push(ROUTES.admin.userEdit(row.original.id))
}

const handleImpersonate = async (userId: string) => {
  impersonatingUserId.value = userId
  try {
    await startImpersonation(userId)
    toast.add({
      title: 'Impersonation started',
      description: 'You are now viewing the app as this user.',
      color: 'success',
    })
    router.push(ROUTES.start)
  }
  catch {
    toast.add({
      title: 'Failed to impersonate',
      description: 'Could not start impersonation. Please try again.',
      color: 'error',
    })
  }
  finally {
    impersonatingUserId.value = null
  }
}

const getActionsItems = (row: AdminUser): DropdownMenuItem[][] => {
  const isSelf = user.value?.id === row.id
  const isImpersonating = impersonatingUserId.value === row.id && impersonationStatus.value === 'loading'

  return [
    [
      {
        label: 'View Details',
        icon: 'i-lucide-eye',
        onSelect: () => router.push(ROUTES.admin.userEdit(row.id)),
      },
    ],
    [
      {
        label: isImpersonating ? 'Impersonating...' : 'Impersonate',
        icon: 'i-lucide-user-check',
        disabled: isSelf || isImpersonating,
        onSelect: () => handleImpersonate(row.id),
      },
    ],
  ]
}

const columns: TableColumn<AdminUser>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'emailVerified', header: 'Verified' },
  { accessorKey: 'createdAt', header: 'Created' },
  { accessorKey: 'actions', header: '' },
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

    <template #actions-cell="{ row }">
      <div class="flex justify-end" @click.stop>
        <UDropdownMenu :items="getActionsItems(row.original)">
          <UButton
            icon="i-lucide-more-horizontal"
            color="neutral"
            variant="ghost"
            size="sm"
          />
        </UDropdownMenu>
      </div>
    </template>

    <template #empty>
      <div class="text-center py-8 text-muted">
        No users found
      </div>
    </template>
  </UTable>
</template>
