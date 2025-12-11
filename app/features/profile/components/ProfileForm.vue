<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserProfile } from '../types/profile.types'
import * as z from 'zod'
import { useUpdateProfile } from '../composables/useProfileMutations'

const props = defineProps<{
  profile: UserProfile
}>()

const emit = defineEmits<{
  success: []
}>()

const NAME_MAX_LENGTH = 100

const schema = z.object({
  name: z.string().trim().max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less`).optional(),
  email: z.string().trim().email('Valid email is required'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: props.profile.name ?? '',
  email: props.profile.email,
})

const { mutateAsync: updateProfile, asyncStatus, error } = useUpdateProfile()

const isLoading = computed(() => asyncStatus.value === 'loading')

const apiError = computed(() => {
  const err = error.value as {
    statusCode?: number
    data?: { statusMessage?: string }
    message?: string
  } | null
  if (!err)
    return null
  if (err.statusCode === 409)
    return 'This email is already in use by another account.'
  return err.data?.statusMessage || err.message || 'An unexpected error occurred. Please try again.'
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    await updateProfile(event.data)
    emit('success')
  }
  catch {
    // Error is captured in refs
  }
}
</script>

<template>
  <UForm
    id="profile-form"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <!-- Header Card -->
    <UPageCard
      title="Profile"
      description="Update your personal information."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 lg:ms-auto">
        <UButton
          form="profile-form"
          type="submit"
          :loading="isLoading"
        >
          Save Changes
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
      <!-- Name Field -->
      <UFormField
        name="name"
        label="Name"
        description="Your display name."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.name"
            placeholder="John Doe"
            autocomplete="name"
            :maxlength="NAME_MAX_LENGTH"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Email Field -->
      <UFormField
        name="email"
        label="Email"
        description="Your email address for login and notifications."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.email"
            type="email"
            placeholder="you@example.com"
            autocomplete="email"
          />
        </div>
      </UFormField>
    </UPageCard>
  </UForm>
</template>
