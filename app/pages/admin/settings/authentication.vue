<script setup lang="ts">
import AdminAuthProviderCard from '~/features/admin/components/AdminAuthProviderCard.vue'
import AdminRegistrationSettingsCard from '~/features/admin/components/AdminRegistrationSettingsCard.vue'
import { useAdminAuthProviders, useUpdateAuthProvider } from '~/features/admin/composables/useAdminAuthProviders'
import { useAdminRegistrationSettings, useUpdateRegistrationSettings } from '~/features/admin/composables/useAdminRegistrationSettings'
import { AUTH_PROVIDER_LABELS } from '~/features/admin/constants/auth-providers.constants'

const route = useRoute()
const toast = useToast()

const { providers, status, error } = useAdminAuthProviders()
const { mutateAsync: updateProvider, asyncStatus: updateStatus } = useUpdateAuthProvider()
const savingProvider = ref<string | null>(null)

const { mode: registrationMode } = useAdminRegistrationSettings()
const { mutateAsync: updateRegistration, asyncStatus: registrationStatus } = useUpdateRegistrationSettings()

const isLoading = computed(() => status.value === 'pending')

const providerLabel = (provider: string) => AUTH_PROVIDER_LABELS[provider] ?? provider

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

const onUpdateRegistration = async (mode: 'open' | 'invite_only') => {
  try {
    await updateRegistration({ mode })
    toast.add({ title: 'Registration settings updated', color: 'success' })
  }
  catch (err: unknown) {
    const error = err as { message?: string }
    toast.add({
      title: 'Failed to update registration settings',
      description: error.message || 'An error occurred',
      color: 'error',
    })
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
              {
                label: 'Registration',
                to: { hash: '#registration' },
                active: route.hash === '#registration' || !route.hash,
              },
              ...(providers ?? []).map((p) => ({
                label: providerLabel(p.provider),
                to: { hash: `#${p.provider}` },
                active: route.hash === `#${p.provider}`,
              })),
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

        <div v-else>
          <div id="registration">
            <AdminRegistrationSettingsCard
              :mode="registrationMode"
              :loading="registrationStatus === 'loading'"
              @update="onUpdateRegistration"
            />
          </div>

          <template v-for="provider in providers" :key="provider.id">
            <USeparator class="my-6" />
            <div :id="provider.provider">
              <AdminAuthProviderCard
                :provider="provider"
                :loading="savingProvider === provider.provider && updateStatus === 'loading'"
                @update="(data) => onUpdate(provider.provider, data)"
              />
            </div>
          </template>
        </div>
      </UPageBody>
    </UPage>
  </UContainer>
</template>
