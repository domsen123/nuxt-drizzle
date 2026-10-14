<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.forgotPassword.seoTitle'),
  description: () => t('auth.forgotPassword.seoDescription'),
})

const router = useRouter()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

// Redirect if already logged in
const { isAuthenticated } = useSession()
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    router.push(ROUTES.start)
  }
}, { immediate: true })

const { mutateAsync: forgotPassword, asyncStatus, error: forgotPasswordError } = useForgotPassword()

const fields = computed(() => [{
  name: 'email',
  type: 'text' as const,
  label: t('auth.fields.email'),
  placeholder: t('auth.forgotPassword.emailPlaceholder'),
  required: true,
}])

const schema = computed(() => z.object({
  email: z.email(t('auth.validation.invalidEmail')),
}))

type Schema = z.output<typeof schema.value>

const submitted = ref(false)

// Computed error message from API
const apiError = computed(() => {
  if (!forgotPasswordError.value)
    return null
  return apiErrorMessage(forgotPasswordError.value)
})

const onSubmit = (payload: FormSubmitEvent<Schema>) => {
  forgotPassword({ email: payload.data.email })
    .then(() => {
      submitted.value = true
      toast.add({
        title: t('auth.forgotPassword.checkEmailTitle'),
        description: t('auth.forgotPassword.checkEmailDescription'),
        color: 'success',
      })
    })
    .catch(() => {
      // Error is captured in forgotPasswordError ref
    })
}

const isLoading = computed(() => asyncStatus.value === 'loading')
</script>

<template>
  <div v-if="!submitted">
    <UAuthForm
      :fields="fields"
      :schema="schema"
      :title="$t('auth.forgotPassword.title')"
      icon="i-lucide-key-round"
      :submit="{ label: $t('auth.forgotPassword.submit'), loading: isLoading }"
      @submit="onSubmit"
    >
      <template #description>
        {{ $t('auth.forgotPassword.description') }}
      </template>

      <template v-if="apiError" #validation>
        <UAlert
          color="error"
          :title="apiError"
          icon="i-lucide-alert-circle"
        />
      </template>

      <template #footer>
        <i18n-t keypath="auth.rememberPassword" scope="global">
          <template #signIn>
            <ULink
              :to="ROUTES.auth.signIn"
              class="text-primary font-medium"
            >
              {{ $t('common.actions.signIn') }}
            </ULink>
          </template>
        </i18n-t>
      </template>
    </UAuthForm>
  </div>

  <UCard v-else class="max-w-md mx-auto">
    <div class="text-center space-y-4">
      <div class="flex justify-center">
        <UIcon name="i-lucide-mail-check" class="w-16 h-16 text-primary" />
      </div>
      <div>
        <h2 class="text-2xl font-bold mb-2">
          {{ $t('auth.forgotPassword.checkEmailTitle') }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400">
          {{ $t('auth.forgotPassword.checkEmailDescription') }}
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-500 mt-4">
          <i18n-t keypath="auth.forgotPassword.noEmailHint" scope="global">
            <template #tryAgain>
              <button
                class="text-primary font-medium hover:underline"
                @click="submitted = false"
              >
                {{ $t('auth.forgotPassword.tryAgain') }}
              </button>
            </template>
          </i18n-t>
        </p>
      </div>
      <UButton
        :to="ROUTES.auth.signIn"
        variant="soft"
        block
      >
        {{ $t('auth.forgotPassword.backToSignIn') }}
      </UButton>
    </div>
  </UCard>
</template>
