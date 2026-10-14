<script setup lang="ts">
definePageMeta({
  layout: 'auth',
})

const { t } = useI18n()

useSeoMeta({
  title: () => t('auth.verifyEmail.seoTitle'),
  description: () => t('auth.verifyEmail.seoDescription'),
})

const router = useRouter()
const route = useRoute()
const toast = useToast()
const apiErrorMessage = useApiErrorMessage()

// Get token from URL
const token = computed(() => route.query.token as string | null)

// States
const isVerifying = ref(true)
const verificationSuccess = ref(false)
const alreadyVerified = ref(false)
const verificationError = ref<string | null>(null)

// Verify email on mount
onMounted(async () => {
  if (!token.value) {
    verificationError.value = t('auth.verifyEmail.missingToken')
    isVerifying.value = false
    return
  }

  try {
    const response = await $fetch('/api/auth/verify-email', {
      query: { token: token.value },
    })

    verificationSuccess.value = response.success
    alreadyVerified.value = response.alreadyVerified

    if (response.success) {
      toast.add({
        title: response.alreadyVerified
          ? t('auth.verifyEmail.alreadyVerifiedToastTitle')
          : t('auth.verifyEmail.verifiedToastTitle'),
        description: response.alreadyVerified
          ? t('auth.verifyEmail.alreadyVerifiedToastDescription')
          : t('auth.verifyEmail.verifiedToastDescription'),
        color: 'success',
      })
    }
  }
  catch (error) {
    verificationError.value = apiErrorMessage(error)
  }
  finally {
    isVerifying.value = false
  }
})

const goToSignIn = () => {
  router.push(ROUTES.auth.signIn)
}

const goToHome = () => {
  router.push(ROUTES.start)
}
</script>

<template>
  <div class="flex flex-col items-center justify-center min-h-[400px] p-6">
    <!-- Loading state -->
    <div v-if="isVerifying" class="text-center">
      <UIcon name="i-lucide-loader-circle" class="w-12 h-12 animate-spin text-primary mb-4" />
      <h2 class="text-xl font-semibold">
        {{ $t('auth.verifyEmail.verifyingTitle') }}
      </h2>
      <p class="text-muted mt-2">
        {{ $t('auth.verifyEmail.verifyingDescription') }}
      </p>
    </div>

    <!-- Success state -->
    <div v-else-if="verificationSuccess" class="text-center max-w-md">
      <div class="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-check-circle" class="w-8 h-8 text-success" />
      </div>
      <h2 class="text-2xl font-semibold mb-2">
        {{ alreadyVerified ? $t('auth.verifyEmail.alreadyVerifiedTitle') : $t('auth.verifyEmail.verifiedTitle') }}
      </h2>
      <p class="text-muted mb-6">
        {{ alreadyVerified
          ? $t('auth.verifyEmail.alreadyVerifiedDescription')
          : $t('auth.verifyEmail.verifiedDescription')
        }}
      </p>
      <div class="flex gap-3 justify-center">
        <UButton
          color="primary"
          size="lg"
          @click="goToHome"
        >
          {{ $t('common.actions.goToDashboard') }}
        </UButton>
      </div>
    </div>

    <!-- Error state -->
    <div v-else class="text-center max-w-md">
      <div class="w-16 h-16 rounded-full bg-error/10 flex items-center justify-center mx-auto mb-4">
        <UIcon name="i-lucide-x-circle" class="w-8 h-8 text-error" />
      </div>
      <h2 class="text-2xl font-semibold mb-2">
        {{ $t('auth.verifyEmail.failedTitle') }}
      </h2>
      <p class="text-muted mb-6">
        {{ verificationError || $t('auth.verifyEmail.failedFallback') }}
      </p>
      <div class="flex gap-3 justify-center">
        <UButton
          color="neutral"
          variant="outline"
          size="lg"
          @click="goToSignIn"
        >
          {{ $t('common.actions.signIn') }}
        </UButton>
      </div>
      <p class="text-sm text-muted mt-4">
        {{ $t('auth.verifyEmail.newLinkHint') }}
      </p>
    </div>
  </div>
</template>
