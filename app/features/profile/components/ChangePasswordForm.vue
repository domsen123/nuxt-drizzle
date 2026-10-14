<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useChangePassword } from '../composables/useProfileMutations'

const emit = defineEmits<{
  success: []
}>()

const MIN_PASSWORD_LENGTH = 8

const { t } = useI18n()
const apiErrorMessage = useApiErrorMessage()

const schema = computed(() => z.object({
  currentPassword: z.string().min(1, t('profile.password.currentRequired')),
  newPassword: z.string().min(MIN_PASSWORD_LENGTH, t('profile.password.newMin', { min: MIN_PASSWORD_LENGTH })),
  confirmPassword: z.string().min(1, t('profile.password.confirmRequired')),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: t('profile.password.mismatch'),
  path: ['confirmPassword'],
}))

type Schema = z.output<typeof schema.value>

const state = reactive<Schema>({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
})

const { mutateAsync: changePassword, asyncStatus, error } = useChangePassword()

const isLoading = computed(() => asyncStatus.value === 'loading')

const apiError = computed(() => {
  if (!error.value)
    return null
  return apiErrorMessage(error.value)
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    await changePassword({
      currentPassword: event.data.currentPassword,
      newPassword: event.data.newPassword,
    })
    // Clear form on success
    state.currentPassword = ''
    state.newPassword = ''
    state.confirmPassword = ''
    emit('success')
  }
  catch {
    // Error is captured in refs
  }
}
</script>

<template>
  <UForm
    id="password-form"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <!-- Header Card -->
    <UPageCard
      :title="$t('profile.password.title')"
      :description="$t('profile.password.description')"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 lg:ms-auto">
        <UButton
          form="password-form"
          type="submit"
          :loading="isLoading"
        >
          {{ $t('profile.password.submit') }}
        </UButton>
      </div>
    </UPageCard>

    <!-- Error Alert -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <UAlert
        v-if="apiError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="apiError"
      />
    </Transition>

    <!-- Form Fields Card -->
    <UPageCard variant="subtle">
      <!-- Current Password Field -->
      <UFormField
        name="currentPassword"
        :label="$t('profile.password.currentLabel')"
        :description="$t('profile.password.currentDescription')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.currentPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="current-password"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- New Password Field -->
      <UFormField
        name="newPassword"
        :label="$t('profile.password.newLabel')"
        :description="$t('profile.password.newDescription', { min: MIN_PASSWORD_LENGTH })"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.newPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Confirm Password Field -->
      <UFormField
        name="confirmPassword"
        :label="$t('profile.password.confirmLabel')"
        :description="$t('profile.password.confirmDescription')"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.confirmPassword"
            type="password"
            placeholder="••••••••"
            autocomplete="new-password"
          />
        </div>
      </UFormField>
    </UPageCard>
  </UForm>
</template>
