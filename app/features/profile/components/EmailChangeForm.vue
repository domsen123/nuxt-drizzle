<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useRequestEmailChange } from '../composables/useProfileMutations'

const props = defineProps<{
  currentEmail: string
}>()

const open = defineModel<boolean>('open', { default: false })

const { t } = useI18n()
const apiErrorMessage = useApiErrorMessage()

const schema = computed(() => z.object({
  email: z.string().trim().email(t('profile.emailChange.validEmailRequired')),
}))

type Schema = z.output<typeof schema.value>

const state = reactive<Schema>({
  email: '',
})

const { mutateAsync: requestEmailChange, asyncStatus, error, reset } = useRequestEmailChange()

const isLoading = computed(() => asyncStatus.value === 'loading')
const isSuccess = ref(false)

const apiError = computed(() => {
  if (!error.value)
    return null
  return apiErrorMessage(error.value)
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    await requestEmailChange(event.data)
    isSuccess.value = true
  }
  catch {
    // Error is captured in refs
  }
}

const onClose = () => {
  open.value = false
  // Reset state after modal closes
  setTimeout(() => {
    state.email = ''
    isSuccess.value = false
    reset()
  }, 300)
}

// Validate that new email is different from current
const isDifferentEmail = computed(() => {
  return state.email.toLowerCase().trim() !== props.currentEmail.toLowerCase()
})
</script>

<template>
  <UModal
    v-model:open="open"
    :title="$t('profile.emailChange.title')"
    :close="{
      onClick: onClose,
    }"
  >
    <template #body>
      <!-- Success State -->
      <div v-if="isSuccess" class="text-center py-4">
        <div class="mx-auto w-12 h-12 rounded-full bg-(--ui-color-success-50) flex items-center justify-center mb-4">
          <UIcon name="i-lucide-mail-check" class="w-6 h-6 text-(--ui-color-success-500)" />
        </div>
        <h3 class="text-lg font-medium text-(--ui-text-highlighted) mb-2">
          {{ $t('profile.emailChange.checkEmailTitle') }}
        </h3>
        <p class="text-sm text-(--ui-text-muted)">
          <i18n-t keypath="profile.emailChange.sentDescription" scope="global">
            <template #email>
              <strong>{{ state.email }}</strong>
            </template>
          </i18n-t>
        </p>
        <UButton
          class="mt-6"
          @click="onClose"
        >
          {{ $t('common.actions.done') }}
        </UButton>
      </div>

      <!-- Form State -->
      <UForm
        v-else
        :schema="schema"
        :state="state"
        class="space-y-4"
        @submit="onSubmit"
      >
        <p class="text-sm text-(--ui-text-muted)">
          {{ $t('profile.emailChange.intro') }}
        </p>

        <!-- Error Alert -->
        <UAlert
          v-if="apiError"
          color="error"
          variant="subtle"
          icon="i-lucide-alert-triangle"
          :title="apiError"
        />

        <UFormField
          name="email"
          :label="$t('profile.emailChange.newEmailLabel')"
          required
        >
          <UInput
            v-model="state.email"
            type="email"
            :placeholder="$t('profile.emailChange.newEmailPlaceholder')"
            autocomplete="email"
          />
        </UFormField>

        <p v-if="state.email && !isDifferentEmail" class="text-sm text-(--ui-color-warning-500)">
          {{ $t('profile.emailChange.mustDiffer') }}
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            variant="ghost"
            @click="onClose"
          >
            {{ $t('common.actions.cancel') }}
          </UButton>
          <UButton
            type="submit"
            :loading="isLoading"
            :disabled="!isDifferentEmail"
          >
            {{ $t('profile.emailChange.submit') }}
          </UButton>
        </div>
      </UForm>
    </template>
  </UModal>
</template>
