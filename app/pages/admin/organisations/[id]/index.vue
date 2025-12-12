<script setup lang="ts">
import type { AdminOrganisation } from '~/features/admin'
import AdminOrganisationForm from '~/features/admin/components/AdminOrganisationForm.vue'

const route = useRoute()
const router = useRouter()
const toast = useToast()

// Try to inject organisation data from parent layout, with fallback for SSR
const injected = inject<{
  organisation: Ref<AdminOrganisation | null>
  organisationId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
} | null>('adminOrganisation', null)

// Fallback: fetch data directly if inject fails during SSR
const organisationId = computed(() => route.params.id as string)
const fallbackQuery = injected ? null : useAdminOrganisation(organisationId)

// Use injected data if available, otherwise use fallback
const organisation = computed(() => injected?.organisation.value ?? fallbackQuery?.organisation.value ?? null)
const status = computed(() => injected?.status.value ?? fallbackQuery?.status.value ?? 'pending')
const error = computed(() => injected?.error.value ?? fallbackQuery?.error.value ?? null)

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
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto py-6 px-6 lg:py-12">
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
