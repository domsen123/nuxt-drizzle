<script setup lang="ts">
import AdminOrganisationForm from '~/features/admin/components/AdminOrganisationForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const router = useRouter()
const toast = useToast()

const id = computed(() => route.params.id as string)

const { organisation, status, error } = useAdminOrganisation(id)

const isLoading = computed(() => status.value === 'pending')

useSeoMeta({
  title: () => organisation.value
    ? `Edit ${organisation.value.name} - Admin`
    : 'Edit Organisation - Admin',
})

const onSuccess = () => {
  toast.add({ title: 'Organisation updated', color: 'success' })
  router.push(ROUTES.admin.organisations)
}

const onCancel = () => {
  router.push(ROUTES.admin.organisations)
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="organisation?.name ? `Edit ${organisation.name}` : 'Edit Organisation'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :to="ROUTES.admin.organisations"
          />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6 max-w-xl">
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          title="Failed to load organisation"
          :description="error.message"
          icon="i-lucide-alert-circle"
        />

        <AdminOrganisationForm
          v-else-if="organisation"
          :organisation="organisation"
          @success="onSuccess"
          @cancel="onCancel"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
