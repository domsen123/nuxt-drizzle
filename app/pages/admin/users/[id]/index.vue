<script setup lang="ts">
import type { AdminUser } from '~/features/admin'
import AdminUserForm from '~/features/admin/components/AdminUserForm.vue'
import AdminUserRoles from '~/features/admin/components/AdminUserRoles.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Try to inject user data from parent layout, with fallback for SSR
const injected = inject<{
  user: Ref<AdminUser | null>
  userId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
} | null>('adminUser', null)

// Fallback: fetch data directly if inject fails during SSR
const userId = computed(() => route.params.id as string)
const fallbackQuery = injected ? null : useAdminUser(userId)

// Use injected data if available, otherwise use fallback
const user = computed(() => injected?.user.value ?? fallbackQuery?.user.value ?? null)
const status = computed(() => injected?.status.value ?? fallbackQuery?.status.value ?? 'pending')
const error = computed(() => injected?.error.value ?? fallbackQuery?.error.value ?? null)

const isLoading = computed(() => status.value === 'pending')

useSeoMeta({
  title: () => user.value
    ? `Edit ${user.value.name || user.value.email} - Admin`
    : 'Edit User - Admin',
})

const onSuccess = () => {
  toast.add({ title: 'User updated', color: 'success' })
  router.push(ROUTES.admin.users)
}

const onCancel = () => {
  router.push(ROUTES.admin.users)
}

const { mutateAsync: deleteUser, asyncStatus: deleteStatus } = useDeleteUser()
const isDeleting = computed(() => deleteStatus.value === 'loading')

const onDelete = async () => {
  if (!user.value)
    return

  try {
    await deleteUser(user.value.id)
    toast.add({ title: 'User deleted', color: 'success' })
    router.push(ROUTES.admin.users)
  }
  catch (err: unknown) {
    const error = err as { message?: string }
    toast.add({
      title: 'Failed to delete user',
      description: error.message || 'An error occurred',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto py-6 px-6 lg:py-12">
    <div v-if="isLoading || isDeleting" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Failed to load user"
      :description="error.message"
      icon="i-lucide-alert-circle"
    />

    <template v-else-if="user">
      <AdminUserForm
        :user="user"
        @success="onSuccess"
        @cancel="onCancel"
        @delete="onDelete"
      />

      <USeparator class="my-6" />

      <AdminUserRoles :user-id="userId" />
    </template>
  </div>
</template>
