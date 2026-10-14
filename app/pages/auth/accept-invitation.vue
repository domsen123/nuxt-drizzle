<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import * as z from 'zod'
import { useAcceptInvitation, useValidateInvitation } from '~/features/organisation-invitations'

definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.acceptInvitation.seoTitle'),
  description: () => t('auth.acceptInvitation.seoDescription'),
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

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
      title: t('auth.acceptInvitation.invalidLinkTitle'),
      description: t('auth.acceptInvitation.invalidLinkDescription'),
      color: 'error',
    })
    router.push(ROUTES.auth.signIn)
  }
}, { immediate: true })

// Validate token
const { data: validation, status: validationStatus } = useValidateInvitation(token)

// Watch for invalid token
watch(validation, (val) => {
  if (val && !val.valid) {
    toast.add({
      title: t('auth.acceptInvitation.invalidTitle'),
      description: t('auth.acceptInvitation.invalidDescription'),
      color: 'error',
    })
    router.push(ROUTES.auth.signIn)
  }
})

const { mutateAsync: acceptInvitation, asyncStatus, error: acceptError } = useAcceptInvitation()

const fields = computed(() => [{
  name: 'name',
  type: 'text' as const,
  label: t('auth.acceptInvitation.fullName'),
  placeholder: t('auth.acceptInvitation.fullNamePlaceholder'),
}, {
  name: 'password',
  type: 'password' as const,
  label: t('auth.fields.password'),
  placeholder: t('auth.acceptInvitation.createPasswordPlaceholder'),
  required: true,
}, {
  name: 'confirmPassword',
  type: 'password' as const,
  label: t('auth.acceptInvitation.confirmPassword'),
  placeholder: t('auth.acceptInvitation.confirmPasswordPlaceholder'),
  required: true,
}])

const schema = computed(() => z.object({
  name: z.string().trim().optional(),
  password: z.string().min(8, t('auth.validation.passwordMin', { min: 8 })),
  confirmPassword: z.string().min(1, t('auth.validation.confirmPasswordRequired')),
}).refine(data => data.password === data.confirmPassword, {
  message: t('auth.validation.passwordMismatch'),
  path: ['confirmPassword'],
}))

type Schema = z.output<typeof schema.value>

const apiError = computed(() => {
  if (!acceptError.value)
    return null
  return apiErrorMessage(acceptError.value)
})

const onSubmit = (payload: FormSubmitEvent<Schema>) => {
  if (!token.value)
    return

  acceptInvitation({
    token: token.value,
    data: {
      password: payload.data.password,
      name: payload.data.name || undefined,
    },
  })
    .then((response) => {
      toast.add({
        title: t('auth.acceptInvitation.welcomeTitle'),
        description: t('auth.acceptInvitation.welcomeDescription', { organisation: response.organisationName }),
        color: 'success',
      })
      router.push(ROUTES.start)
    })
    .catch(() => {
      // Error is captured in acceptError ref
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
    v-else-if="validation?.valid"
    :fields="fields"
    :schema="schema"
    :title="$t('auth.acceptInvitation.title')"
    icon="i-lucide-user-plus"
    :submit="{ label: $t('auth.acceptInvitation.submit'), loading: isLoading }"
    @submit="onSubmit"
  >
    <template #description>
      <div class="space-y-1">
        <p>
          <i18n-t keypath="auth.acceptInvitation.invitedTo" scope="global">
            <template #organisation>
              <strong>{{ validation.organisationName }}</strong>
            </template>
          </i18n-t>
        </p>
        <p class="text-sm text-muted">
          <i18n-t keypath="auth.acceptInvitation.createUsing" scope="global">
            <template #email>
              <strong>{{ validation.email }}</strong>
            </template>
          </i18n-t>
        </p>
      </div>
    </template>

    <template v-if="apiError" #validation>
      <UAlert
        color="error"
        :title="apiError"
        icon="i-lucide-alert-circle"
      />
    </template>

    <template #footer>
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
  </UAuthForm>
</template>
