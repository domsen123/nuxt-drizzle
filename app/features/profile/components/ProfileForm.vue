<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { UserProfile } from '../types/profile.types'
import * as z from 'zod'
import { usePendingEmailChange } from '../composables/usePendingEmailChange'
import { useCancelEmailChange, useUpdateProfile } from '../composables/useProfileMutations'
import EmailChangeForm from './EmailChangeForm.vue'

const props = defineProps<{
  profile: UserProfile
}>()

const emit = defineEmits<{
  success: []
}>()

const NAME_MAX_LENGTH = 100

const { t } = useI18n()
const apiErrorMessage = useApiErrorMessage()
const { formatDate } = useLocaleFormat()

const schema = computed(() => z.object({
  name: z.string().trim().max(NAME_MAX_LENGTH, t('profile.form.nameMax', { max: NAME_MAX_LENGTH })).optional(),
}))

type Schema = z.output<typeof schema.value>

const state = reactive<Schema>({
  name: props.profile.name ?? '',
})

const { mutateAsync: updateProfile, asyncStatus, error } = useUpdateProfile()
const { pending: pendingEmailChange } = usePendingEmailChange()
const { mutateAsync: cancelEmailChange, asyncStatus: cancelStatus } = useCancelEmailChange()

const isLoading = computed(() => asyncStatus.value === 'loading')
const isCancelling = computed(() => cancelStatus.value === 'loading')

// Modal state for email change
const isEmailChangeModalOpen = ref(false)

const apiError = computed(() => {
  if (!error.value)
    return null
  return apiErrorMessage(error.value)
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

const onCancelEmailChange = async () => {
  try {
    await cancelEmailChange()
  }
  catch {
    // Error handling
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
      :title="$t('profile.form.title')"
      :description="$t('profile.form.description')"
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
          {{ $t('common.actions.save') }}
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
        :label="$t('profile.form.nameLabel')"
        :description="$t('profile.form.nameDescription')"
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-sm">
          <UInput
            v-model="state.name"
            :placeholder="$t('profile.form.namePlaceholder')"
            autocomplete="name"
            :maxlength="NAME_MAX_LENGTH"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Email Field (Read-only with change button) -->
      <div class="flex max-sm:flex-col justify-between items-start gap-4">
        <div class="flex-1">
          <div class="flex items-center gap-2">
            <label class="text-sm font-medium text-(--ui-text-highlighted)">{{ $t('profile.form.emailLabel') }}</label>
          </div>
          <p class="text-sm text-(--ui-text-muted) mt-0.5">
            {{ $t('profile.form.emailDescription') }}
          </p>
        </div>
        <div class="w-full max-w-sm space-y-2">
          <div class="flex items-center gap-2">
            <UInput
              :model-value="profile.email"
              type="email"
              disabled
              class="flex-1"
            />
            <UButton
              variant="soft"
              @click="isEmailChangeModalOpen = true"
            >
              {{ $t('common.actions.change') }}
            </UButton>
          </div>

          <!-- Pending Email Change Alert -->
          <UAlert
            v-if="pendingEmailChange"
            color="info"
            variant="subtle"
            icon="i-lucide-mail"
            class="mt-2"
          >
            <template #title>
              {{ $t('profile.form.pendingTitle') }}
            </template>
            <template #description>
              <p class="text-sm">
                <i18n-t keypath="profile.form.pendingDescription" scope="global">
                  <template #email>
                    <strong>{{ pendingEmailChange.newEmail }}</strong>
                  </template>
                </i18n-t>
              </p>
              <p class="text-xs text-(--ui-text-muted) mt-1">
                {{ $t('profile.form.expires', { date: formatDate(pendingEmailChange.expiresAt) }) }}
              </p>
              <UButton
                variant="link"
                size="xs"
                color="neutral"
                :loading="isCancelling"
                class="mt-2 -ml-2"
                @click="onCancelEmailChange"
              >
                {{ $t('profile.form.cancelEmailChange') }}
              </UButton>
            </template>
          </UAlert>
        </div>
      </div>
    </UPageCard>

    <!-- Email Change Modal -->
    <EmailChangeForm
      v-model:open="isEmailChangeModalOpen"
      :current-email="profile.email"
    />
  </UForm>
</template>
