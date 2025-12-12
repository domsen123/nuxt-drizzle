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
  { accessorKey: 'emailVerified', header: 'Verified' },
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
      :data="users"
      :loading="loading"
      :ui="{
        tr: 'hover:bg-elevated transition-colors cursor-pointer',
      }"
      @select="onSelect"
    >
      <template #name-cell="{ row }">
        <div class="flex items-center gap-3">
          <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-user" class="size-5 text-primary" />
          </div>
          <div class="text-sm">
            <p class="text-highlighted font-medium">
              {{ row.original.name || 'No name' }}
            </p>
            <p class="text-muted text-xs">
              {{ row.original.email }}
            </p>
          </div>
        </div>
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
        <div class="flex justify-end">
          <UDropdownMenu :items="getActionsItems(row.original)" :content="{ align: 'end' }">
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
          <UIcon name="i-lucide-user" class="size-8 mx-auto mb-2 opacity-50" />
          <p>No users found</p>
        </div>
      </template>
    </UTable>
  </UPageCard>
</template>
