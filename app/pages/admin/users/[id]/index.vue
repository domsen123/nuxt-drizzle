<script setup lang="ts">
import AdminUserForm from '~/features/admin/components/AdminUserForm.vue'
import AdminUserRoles from '~/features/admin/components/AdminUserRoles.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

const userId = computed(() => route.params.id as string)

const { user, status, error } = useAdminUser(userId)

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
  <UContainer>
    <AppPageHeader title="Edit User" variant="dense" />
    <UPage>
      <template #left>
        <DashboardPageAside>
          <UNavigationMenu
            :items="[
              { label: 'General', to: { hash: '#general' }, active: route.hash === '#general' || !route.hash },
              { label: 'Roles', to: { hash: '#roles' }, active: route.hash === '#roles' },
            ]"
            orientation="vertical"
          />
        </DashboardPageAside>
      </template>
      <UPageBody>
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
          <div id="general">
            <AdminUserForm
              :user="user"
              @success="onSuccess"
              @cancel="onCancel"
              @delete="onDelete"
            />
          </div>

          <USeparator class="my-6" />

          <AdminUserRoles id="roles" :user-id="userId" />
        </template>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
