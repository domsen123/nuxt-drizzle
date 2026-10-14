<script setup lang="ts">
import type { AdminRegistrationSettings } from '../types/admin.types'

const props = defineProps<{
  mode: AdminRegistrationSettings['mode']
  loading?: boolean
}>()

const emit = defineEmits<{
  update: [mode: AdminRegistrationSettings['mode']]
}>()

const selectedMode = ref<AdminRegistrationSettings['mode']>(props.mode)

watch(() => props.mode, (mode) => {
  selectedMode.value = mode
})

const isDirty = computed(() => selectedMode.value !== props.mode)

const options = [
  {
    label: 'Everyone can sign up',
    value: 'open',
    description: 'Anyone can create an account via the sign-up form or an enabled OAuth provider.',
  },
  {
    label: 'Invite only',
    value: 'invite_only',
    description: 'Only people with an open organisation invitation can create an account. Existing accounts keep signing in.',
  },
]

const onSave = () => {
  emit('update', selectedMode.value)
}
</script>

<template>
  <div>
    <!-- Header Card -->
    <UPageCard
      title="Registration"
      description="Controls who can create a new account. Applies to the sign-up form and to first-time OAuth sign-ins."
      variant="naked"
      orientation="horizontal"
    >
      <div class="flex gap-2 lg:ms-auto">
        <UButton
          label="Save"
          :disabled="!isDirty"
          :loading="loading"
          @click="onSave"
        />
      </div>
    </UPageCard>

    <!-- Form Fields Card -->
    <UPageCard variant="subtle">
      <UFormField label="Who can sign up?">
        <URadioGroup
          v-model="selectedMode"
          :items="options"
        />
      </UFormField>
    </UPageCard>
  </div>
</template>
