<script setup lang="ts">
import AdminAuthProviderCard from '~/features/admin/components/AdminAuthProviderCard.vue'
import { useAdminAuthProviders, useUpdateAuthProvider } from '~/features/admin/composables/useAdminAuthProviders'

const route = useRoute()
const toast = useToast()

const { providers, status, error } = useAdminAuthProviders()
const { mutateAsync: updateProvider, asyncStatus: updateStatus } = useUpdateAuthProvider()
const savingProvider = ref<string | null>(null)

const isLoading = computed(() => status.value === 'pending')

useSeoMeta({
  title: 'Authentication Settings - Admin',
})

const onUpdate = async (provider: string, data: { enabled: boolean, config: Record<string, unknown> }) => {
  savingProvider.value = provider
  try {
    await updateProvider({ provider, data })
    toast.add({ title: 'Provider updated', color: 'success' })
  }
  catch (err: unknown) {
    const error = err as { message?: string }
    toast.add({
      title: 'Failed to update provider',
      description: error.message || 'An error occurred',
      color: 'error',
    })
  }
  finally {
    savingProvider.value = null
  }
}
</script>

<template>
  <UContainer>
    <AppPageHeader title="Authentication" variant="dense" />
    <UPage>
      <template #left>
        <DashboardPageAside>
          <UNavigationMenu
            :items="[
              { label: 'Providers', to: { hash: '#providers' }, active: route.hash === '#providers' || !route.hash },
            ]"
            orientation="vertical"
          />
        </DashboardPageAside>
      </template>
      <UPageBody>
        <div v-if="isLoading" class="flex items-center justify-center py-12">
          <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
        </div>

        <UAlert
          v-else-if="error"
          color="error"
          title="Failed to load auth providers"
          :description="error.message"
          icon="i-lucide-alert-circle"
        />

        <div v-else id="providers" class="space-y-6">
          <AdminAuthProviderCard
            v-for="provider in providers"
            :key="provider.id"
            :provider="provider"
            :loading="savingProvider === provider.provider && updateStatus === 'loading'"
            @update="(data) => onUpdate(provider.provider, data)"
          />
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
