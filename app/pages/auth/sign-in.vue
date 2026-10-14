<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.signIn.seoTitle'),
  description: () => t('auth.signIn.seoDescription'),
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

// Redirect if already logged in (but allow anonymous users to sign in for upgrade)
const { isAuthenticated, isAnonymous } = useSession()
watch([isAuthenticated, isAnonymous], ([authenticated, anonymous]) => {
  if (authenticated && !anonymous) {
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || ROUTES.start)
  }
}, { immediate: true })

const { mutateAsync: login, asyncStatus, error: loginError } = useLogin()

const fields = computed(() => [{
  name: 'email',
  type: 'text' as const,
  label: t('auth.fields.email'),
  placeholder: t('auth.fields.emailPlaceholder'),
  required: true,
}, {
  name: 'password',
  label: t('auth.fields.password'),
  type: 'password' as const,
  placeholder: t('auth.fields.passwordPlaceholder'),
}, {
  name: 'remember',
  label: t('auth.fields.rememberMe'),
  type: 'checkbox' as const,
}])

const providers = computed(() => [{
  label: 'Google',
  icon: 'i-simple-icons-google',
  onClick: () => {
    toast.add({ title: 'Google', description: t('auth.signIn.providerSoon', { provider: 'Google' }) })
  },
}, {
  label: 'GitHub',
  icon: 'i-simple-icons-github',
  onClick: () => {
    toast.add({ title: 'GitHub', description: t('auth.signIn.providerSoon', { provider: 'GitHub' }) })
  },
}])

const schema = computed(() => z.object({
  email: z.email(t('auth.validation.invalidEmail')),
  password: z.string().min(8, t('auth.validation.passwordMin', { min: 8 })),
  remember: z.boolean().optional().default(false),
}))

// Computed error message from API
const apiError = computed(() => {
  if (!loginError.value)
    return null
  return apiErrorMessage(loginError.value)
})

const onSubmit = (payload: FormSubmitEvent<z.input<typeof schema.value>>) => {
  login({ email: payload.data.email, password: payload.data.password, remember: payload.data.remember ?? false })
    .then(() => {
      toast.add({ title: t('auth.signIn.successTitle'), color: 'success' })
      const redirect = route.query.redirect as string | undefined
      router.push(redirect || ROUTES.start)
    })
    .catch(() => {
      // Error is captured in loginError ref
    })
}

const isLoading = computed(() => asyncStatus.value === 'loading')
</script>

<template>
  <UAuthForm
    :fields="fields"
    :schema="schema"
    :providers="providers"
    :title="$t('auth.signIn.title')"
    icon="i-lucide-lock"
    :submit="{ label: $t('common.actions.signIn'), loading: isLoading }"
    @submit="onSubmit"
  >
    <template #description>
      <i18n-t keypath="auth.signIn.noAccount" scope="global">
        <template #signUp>
          <ULink
            :to="ROUTES.auth.signUp"
            class="text-primary font-medium"
          >
            {{ $t('common.actions.signUp') }}
          </ULink>
        </template>
      </i18n-t>
    </template>

    <template v-if="apiError" #validation>
      <UAlert
        color="error"
        :title="apiError"
        icon="i-lucide-alert-circle"
      />
    </template>

    <template #password-hint>
      <ULink
        :to="ROUTES.auth.forgotPassword"
        class="text-primary font-medium"
        tabindex="-1"
      >
        {{ $t('auth.signIn.forgotPassword') }}
      </ULink>
    </template>

    <template #footer>
      <i18n-t keypath="auth.signIn.agree" scope="global">
        <template #terms>
          <ULink
            :to="ROUTES.legal.termsOfService"
            class="text-primary font-medium"
          >
            {{ $t('legal.terms.title') }}
          </ULink>
        </template>
      </i18n-t>
    </template>
  </UAuthForm>
</template>
