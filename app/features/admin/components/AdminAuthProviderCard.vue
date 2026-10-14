<script setup lang="ts">
import type { AdminAuthProvider } from '../types/admin.types'
import { AUTH_PROVIDER_DESCRIPTIONS, AUTH_PROVIDER_LABELS } from '../constants/auth-providers.constants'

const props = defineProps<{
  provider: AdminAuthProvider
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [data: { enabled: boolean, config: Record<string, unknown> }]
}>()

const TENANT_OPTIONS = [
  { label: 'Common (all account types)', value: 'common' },
  { label: 'Organizations (work or school accounts)', value: 'organizations' },
  { label: 'Consumers (personal accounts)', value: 'consumers' },
  { label: 'Custom tenant ID', value: 'custom' },
]
const STANDARD_TENANTS = ['common', 'organizations', 'consumers']
const TENANT_GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const enabled = ref(props.provider.enabled)
const sessionDurationDays = ref(
  props.provider.provider === 'anonymous'
    ? (props.provider.config.sessionDurationDays as number) ?? 30
    : 0,
)

// Microsoft fields. The secret is write-only: the input stays empty and a
// non-empty value replaces the stored secret on save.
const clientId = ref('')
const clientSecret = ref('')
const tenantChoice = ref('common')
const customTenantId = ref('')

const originalTenant = computed(() => (props.provider.config.tenant as string) ?? 'common')

const resetMicrosoftFields = () => {
  clientId.value = (props.provider.config.clientId as string) ?? ''
  clientSecret.value = ''
  if (STANDARD_TENANTS.includes(originalTenant.value)) {
    tenantChoice.value = originalTenant.value
    customTenantId.value = ''
  }
  else {
    tenantChoice.value = 'custom'
    customTenantId.value = originalTenant.value
  }
}

if (props.provider.provider === 'microsoft') {
  resetMicrosoftFields()
}

watch(() => props.provider, (p) => {
  enabled.value = p.enabled
  if (p.provider === 'anonymous') {
    sessionDurationDays.value = (p.config.sessionDurationDays as number) ?? 30
  }
  if (p.provider === 'microsoft') {
    resetMicrosoftFields()
  }
}, { deep: true })

const isCredentials = computed(() => props.provider.provider === 'credentials')
const isAnonymous = computed(() => props.provider.provider === 'anonymous')
const isMicrosoft = computed(() => props.provider.provider === 'microsoft')

const clientSecretSet = computed(() => Boolean(props.provider.config.clientSecretSet))

const resolvedTenant = computed(() =>
  tenantChoice.value === 'custom' ? customTenantId.value.trim() : tenantChoice.value,
)

const redirectUri = computed(() => `${useRuntimeConfig().public.siteUrl}/api/auth/oauth/microsoft/callback`)
const { copy: copyRedirectUri, copied: redirectUriCopied } = useClipboard({ source: redirectUri })

const isDirty = computed(() => {
  if (enabled.value !== props.provider.enabled)
    return true
  if (isAnonymous.value) {
    const original = (props.provider.config.sessionDurationDays as number) ?? 30
    if (sessionDurationDays.value !== original)
      return true
  }
  if (isMicrosoft.value) {
    const originalClientId = (props.provider.config.clientId as string) ?? ''
    if (clientId.value.trim() !== originalClientId)
      return true
    if (resolvedTenant.value !== originalTenant.value)
      return true
    if (clientSecret.value.trim().length > 0)
      return true
  }
  return false
})

// The PUT endpoint rejects a Microsoft config without client ID and valid
// tenant, so block the save client-side as well.
const isValid = computed(() => {
  if (!isMicrosoft.value)
    return true
  if (clientId.value.trim().length === 0)
    return false
  if (tenantChoice.value === 'custom')
    return TENANT_GUID_PATTERN.test(customTenantId.value.trim())
  return true
})

const providerLabel = computed(() => AUTH_PROVIDER_LABELS[props.provider.provider] ?? props.provider.provider)

const providerDescription = computed(() => AUTH_PROVIDER_DESCRIPTIONS[props.provider.provider] ?? '')

const onSave = () => {
  if (isMicrosoft.value) {
    const config: Record<string, unknown> = {
      clientId: clientId.value.trim(),
      tenant: resolvedTenant.value,
    }
    const secret = clientSecret.value.trim()
    if (secret.length > 0) {
      config.clientSecret = secret
    }
    emit('update', { enabled: enabled.value, config })
    return
  }

  const config: Record<string, unknown> = { ...props.provider.config }
  if (isAnonymous.value) {
    config.sessionDurationDays = sessionDurationDays.value
  }
  emit('update', { enabled: enabled.value, config })
}
</script>

<template>
  <div>
    <!-- Header Card -->
    <UPageCard
      :title="providerLabel"
      :description="providerDescription"
      variant="naked"
      orientation="horizontal"
    >
      <div v-if="!isCredentials" class="flex gap-2 lg:ms-auto">
        <UButton
          label="Save"
          :disabled="!isDirty || !isValid"
          :loading="loading"
          @click="onSave"
        />
      </div>
    </UPageCard>

    <!-- Form Fields Card -->
    <UPageCard variant="subtle">
      <UFormField
        label="Enabled"
        :description="isCredentials ? 'Credentials authentication is always enabled.' : 'Enable or disable this authentication provider.'"
        class="flex max-sm:flex-col justify-between items-center gap-4"
      >
        <USwitch
          v-model="enabled"
          :disabled="isCredentials"
        />
      </UFormField>

      <UFormField
        v-if="isAnonymous"
        label="Session Duration (days)"
        description="How long anonymous sessions remain active before expiring."
      >
        <UInput
          v-model.number="sessionDurationDays"
          type="number"
          :min="1"
          :max="365"
          class="w-32"
        />
      </UFormField>

      <template v-if="isMicrosoft">
        <UFormField
          label="Client ID"
          description="Application (client) ID of the Azure app registration."
        >
          <UInput
            v-model="clientId"
            placeholder="00000000-0000-0000-0000-000000000000"
            class="w-full max-w-md"
          />
        </UFormField>

        <UFormField
          label="Client Secret"
          :description="clientSecretSet
            ? 'A secret is stored. Enter a new value to replace it.'
            : 'Client secret of the Azure app registration.'"
        >
          <UInput
            v-model="clientSecret"
            type="password"
            autocomplete="new-password"
            :placeholder="clientSecretSet ? 'Secret is set — leave blank to keep' : 'Enter client secret'"
            class="w-full max-w-md"
          />
        </UFormField>

        <UFormField
          label="Tenant"
          description="Which Microsoft accounts may sign in."
        >
          <div class="flex flex-col gap-2 w-full max-w-md">
            <USelectMenu
              v-model="tenantChoice"
              :items="TENANT_OPTIONS"
              value-key="value"
            />
            <UInput
              v-if="tenantChoice === 'custom'"
              v-model="customTenantId"
              placeholder="Tenant GUID, e.g. 00000000-0000-0000-0000-000000000000"
            />
          </div>
        </UFormField>

        <UFormField
          label="Redirect URI"
          description="Register this URI in the Azure app registration."
        >
          <UButtonGroup class="w-full max-w-md">
            <UInput
              :model-value="redirectUri"
              readonly
              class="grow"
            />
            <UButton
              color="neutral"
              variant="subtle"
              :icon="redirectUriCopied ? 'i-lucide-check' : 'i-lucide-copy'"
              aria-label="Copy redirect URI"
              @click="copyRedirectUri()"
            />
          </UButtonGroup>
        </UFormField>
      </template>
    </UPageCard>
  </div>
</template>
