<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { OAUTH_PROVIDER_BUTTONS, oauthAuthorizeUrl } from '~/features/auth'

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

const { providers: oauthProviders, registrationMode } = useAuthProviders()

const providers = computed(() => oauthProviders.value.flatMap((entry) => {
  const button = OAUTH_PROVIDER_BUTTONS[entry.provider]
  if (!button)
    return []
  return [{
    ...button,
    onClick: () => {
      navigateTo(oauthAuthorizeUrl(entry.provider, route.query.redirect as string | undefined), { external: true })
    },
  }]
}))

const schema = computed(() => z.object({
  email: z.email(t('auth.validation.invalidEmail')),
  password: z.string().min(8, t('auth.validation.passwordMin', { min: 8 })),
  remember: z.boolean().optional().default(false),
}))

// OAuth callback failures land here as `?error=<code>`.
const OAUTH_ERROR_CODES = ['oauth_failed', 'oauth_no_email', 'provider_disabled', 'registration_disabled']

const oauthError = computed(() => {
  const code = route.query.error
  if (typeof code !== 'string' || !OAUTH_ERROR_CODES.includes(code))
    return null
  return t(`errors.auth.${code}`)
})

// Computed error message from API
const apiError = computed(() => {
  if (!loginError.value)
    return null
  return apiErrorMessage(loginError.value)
})

const displayError = computed(() => apiError.value || oauthError.value)

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
    <template v-if="registrationMode === 'open'" #description>
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

    <template v-if="displayError" #validation>
      <UAlert
        color="error"
        :title="displayError"
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
