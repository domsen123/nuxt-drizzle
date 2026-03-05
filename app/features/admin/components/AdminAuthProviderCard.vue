<script setup lang="ts">
import type { AdminAuthProvider } from '../types/admin.types'

const props = defineProps<{
  provider: AdminAuthProvider
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [data: { enabled: boolean, config: Record<string, unknown> }]
}>()

const enabled = ref(props.provider.enabled)
const sessionDurationDays = ref(
  props.provider.provider === 'anonymous'
    ? (props.provider.config.sessionDurationDays as number) ?? 30
    : 0,
)

watch(() => props.provider, (p) => {
  enabled.value = p.enabled
  if (p.provider === 'anonymous') {
    sessionDurationDays.value = (p.config.sessionDurationDays as number) ?? 30
  }
}, { deep: true })

const isCredentials = computed(() => props.provider.provider === 'credentials')
const isAnonymous = computed(() => props.provider.provider === 'anonymous')

const isDirty = computed(() => {
  if (enabled.value !== props.provider.enabled)
    return true
  if (isAnonymous.value) {
    const original = (props.provider.config.sessionDurationDays as number) ?? 30
    if (sessionDurationDays.value !== original)
      return true
  }
  return false
})

const providerLabel = computed(() => {
  const labels: Record<string, string> = {
    credentials: 'Email & Password',
    anonymous: 'Anonymous',
  }
  return labels[props.provider.provider] ?? props.provider.provider
})

const providerDescription = computed(() => {
  const descriptions: Record<string, string> = {
    credentials: 'Standard email and password authentication. Users register and sign in with their credentials.',
    anonymous: 'Allow users to browse without creating an account. Anonymous sessions can be upgraded to full accounts later.',
  }
  return descriptions[props.provider.provider] ?? ''
})

const providerIcon = computed(() => {
  const icons: Record<string, string> = {
    credentials: 'i-lucide-key-round',
    anonymous: 'i-lucide-user-round',
  }
  return icons[props.provider.provider] ?? 'i-lucide-shield'
})

const onSave = () => {
  const config: Record<string, unknown> = { ...props.provider.config }
  if (isAnonymous.value) {
    config.sessionDurationDays = sessionDurationDays.value
  }
  emit('update', { enabled: enabled.value, config })
}
</script>

<template>
  <UPageCard>
    <div class="space-y-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex items-center gap-3">
          <UIcon :name="providerIcon" class="size-5 text-muted" />
          <div>
            <h3 class="text-sm font-medium">
              {{ providerLabel }}
            </h3>
            <p class="text-sm text-muted">
              {{ providerDescription }}
            </p>
          </div>
        </div>
        <USwitch
          v-model="enabled"
          :disabled="isCredentials"
        />
      </div>

      <template v-if="isAnonymous">
        <USeparator />
        <UFormField label="Session Duration (days)">
          <UInput
            v-model.number="sessionDurationDays"
            type="number"
            :min="1"
            :max="365"
            class="w-32"
          />
        </UFormField>
      </template>

      <div v-if="!isCredentials" class="flex justify-end">
        <UButton
          label="Save"
          :disabled="!isDirty"
          :loading="loading"
          @click="onSave"
        />
      </div>
    </div>
  </UPageCard>
</template>
