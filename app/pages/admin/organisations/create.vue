<script setup lang="ts">
import AdminOrganisationForm from '~/features/admin/components/AdminOrganisationForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Create Organisation - Admin',
})

const router = useRouter()
const toast = useToast()

const onSuccess = () => {
  toast.add({ title: 'Organisation created', color: 'success' })
  router.push(ROUTES.admin.organisations)
}

const onCancel = () => {
  router.push(ROUTES.admin.organisations)
}
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Create Organisation">
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
        <AdminOrganisationForm
          @success="onSuccess"
          @cancel="onCancel"
        />
      </div>
    </template>
  </UDashboardPanel>
</template>
