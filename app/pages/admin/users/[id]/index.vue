<script setup lang="ts">
import type { AdminUser } from '~/features/admin'
import AdminUserForm from '~/features/admin/components/AdminUserForm.vue'

const router = useRouter()
const toast = useToast()

// Inject user data from parent layout
const { user, status, error } = inject<{
  user: Ref<AdminUser | null>
  userId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
}>('adminUser')!

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

    <AdminUserForm
      v-else-if="user"
      :user="user"
      @success="onSuccess"
      @cancel="onCancel"
      @delete="onDelete"
    />
  </div>
</template>
