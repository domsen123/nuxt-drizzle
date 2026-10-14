<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { OAUTH_PROVIDER_BUTTONS, oauthAuthorizeUrl } from '~/features/auth'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.signUp.seoTitle'),
  description: () => t('auth.signUp.seoDescription'),
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

// Redirect if already logged in (but allow anonymous users to sign up for upgrade)
const { isAuthenticated, isAnonymous } = useSession()
watch([isAuthenticated, isAnonymous], ([authenticated, anonymous]) => {
  if (authenticated && !anonymous) {
    const redirect = route.query.redirect as string | undefined
    router.push(redirect || ROUTES.start)
  }
}, { immediate: true })

const { mutateAsync: register, asyncStatus, error: registerError } = useRegister()

const fields = computed(() => [{
  name: 'name',
  type: 'text' as const,
  label: t('auth.fields.name'),
  placeholder: t('auth.fields.namePlaceholder'),
}, {
  name: 'email',
  type: 'text' as const,
  label: t('auth.fields.email'),
  placeholder: t('auth.fields.emailPlaceholder'),
}, {
  name: 'password',
  label: t('auth.fields.password'),
  type: 'password' as const,
  placeholder: t('auth.fields.passwordPlaceholder'),
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

const isInviteOnly = computed(() => registrationMode.value === 'invite_only')

const schema = computed(() => z.object({
  name: z.string().min(1, t('auth.validation.nameRequired')),
  email: z.email(t('auth.validation.invalidEmail')),
  password: z.string().min(8, t('auth.validation.passwordMin', { min: 8 })),
}))

type Schema = z.output<typeof schema.value>

// Computed error message from API
const apiError = computed(() => {
  if (!registerError.value)
    return null
  return apiErrorMessage(registerError.value)
})

const onSubmit = (payload: FormSubmitEvent<Schema>) => {
  register({
    email: payload.data.email,
    password: payload.data.password,
    name: payload.data.name,
  })
    .then(() => {
      toast.add({ title: t('auth.signUp.successTitle'), description: t('auth.signUp.successDescription'), color: 'success' })
      const redirect = route.query.redirect as string | undefined
      router.push(redirect || ROUTES.start)
    })
    .catch(() => {
      // Error is captured in registerError ref
    })
}

const isLoading = computed(() => asyncStatus.value === 'loading')
</script>

<template>
  <div v-if="isInviteOnly" class="space-y-6">
    <UAlert
      color="info"
      :title="$t('auth.signUp.inviteOnly')"
      icon="i-lucide-info"
    />
    <div class="text-center text-sm text-muted">
      <i18n-t keypath="auth.haveAccount" scope="global">
        <template #signIn>
          <ULink
            :to="ROUTES.auth.signIn"
            class="text-primary font-medium"
          >
            {{ $t('common.actions.signIn') }}
          </ULink>
        </template>
      </i18n-t>
    </div>
  </div>

  <UAuthForm
    v-else
    :fields="fields"
    :schema="schema"
    :providers="providers"
    :title="$t('auth.signUp.title')"
    :submit="{ label: $t('auth.signUp.submit'), loading: isLoading }"
    @submit="onSubmit"
  >
    <template #description>
      <i18n-t keypath="auth.haveAccount" scope="global">
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

    <template v-if="apiError" #validation>
      <UAlert
        color="error"
        :title="apiError"
        icon="i-lucide-alert-circle"
      />
    </template>

    <template #footer>
      <i18n-t keypath="auth.signUp.agree" scope="global">
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
