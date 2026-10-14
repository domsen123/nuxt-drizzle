<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.resetPassword.seoTitle'),
  description: () => t('auth.resetPassword.seoDescription'),
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

// Get token from URL
const token = computed(() => route.query.token as string | null)

// Redirect if already logged in
const { isAuthenticated } = useSession()
watch(isAuthenticated, (authenticated) => {
  if (authenticated) {
    router.push(ROUTES.start)
  }
}, { immediate: true })

// Redirect if no token
watch(token, (tokenValue) => {
  if (!tokenValue) {
    toast.add({
      title: t('auth.resetPassword.invalidLinkTitle'),
      description: t('auth.resetPassword.invalidLinkDescription'),
      color: 'error',
    })
    router.push(ROUTES.auth.forgotPassword)
  }
}, { immediate: true })

// Validate token
const { data: tokenValidation, status: validationStatus } = useValidateResetToken(token)

// Watch for invalid token
watch(tokenValidation, (validation) => {
  if (validation && !validation.valid) {
    toast.add({
      title: t('auth.resetPassword.expiredLinkTitle'),
      description: t('auth.resetPassword.expiredLinkDescription'),
      color: 'error',
    })
    router.push(ROUTES.auth.forgotPassword)
  }
})

const { mutateAsync: resetPassword, asyncStatus, error: resetPasswordError } = useResetPassword()

const fields = computed(() => [{
  name: 'password',
  type: 'password' as const,
  label: t('auth.resetPassword.newPassword'),
  placeholder: t('auth.resetPassword.newPasswordPlaceholder'),
  required: true,
}, {
  name: 'confirmPassword',
  type: 'password' as const,
  label: t('auth.resetPassword.confirmPassword'),
  placeholder: t('auth.resetPassword.confirmPasswordPlaceholder'),
  required: true,
}])

const schema = computed(() => z.object({
  password: z.string().min(8, t('auth.validation.passwordMin', { min: 8 })),
  confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
}).refine(data => data.password === data.confirmPassword, {
  message: t('auth.validation.passwordMismatch'),
  path: ['confirmPassword'],
}))

type Schema = z.output<typeof schema.value>

// Computed error message from API
const apiError = computed(() => {
  if (!resetPasswordError.value)
    return null
  return apiErrorMessage(resetPasswordError.value)
})

const onSubmit = (payload: FormSubmitEvent<Schema>) => {
  if (!token.value)
    return

  resetPassword({
    token: token.value,
    password: payload.data.password,
  })
    .then(() => {
      toast.add({
        title: t('auth.resetPassword.successTitle'),
        description: t('auth.resetPassword.successDescription'),
        color: 'success',
      })
      router.push(ROUTES.auth.signIn)
    })
    .catch(() => {
      // Error is captured in resetPasswordError ref
    })
}

const isLoading = computed(() => asyncStatus.value === 'loading')
const isValidating = computed(() => validationStatus.value === 'pending')
</script>

<template>
  <div v-if="isValidating" class="flex justify-center items-center min-h-[400px]">
    <UIcon name="i-lucide-loader-circle" class="w-8 h-8 animate-spin text-primary" />
  </div>

  <UAuthForm
    v-else-if="tokenValidation?.valid"
    :fields="fields"
    :schema="schema"
    :title="$t('auth.resetPassword.title')"
    icon="i-lucide-lock-keyhole"
    :submit="{ label: $t('auth.resetPassword.submit'), loading: isLoading }"
    @submit="onSubmit"
  >
    <template #description>
      {{ $t('auth.resetPassword.description') }}
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
</template>
