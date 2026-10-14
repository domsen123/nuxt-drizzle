<script setup lang="ts">
import { useProfile } from '~/features/profile'
import ProfileForm from '~/features/profile/components/ProfileForm.vue'

const toast = useToast()
const { t } = useI18n()
const apiErrorMessage = useApiErrorMessage()

const { profile, status, error } = useProfile()

const isLoading = computed(() => status.value === 'pending')

useSeoMeta({
  title: () => t('settings.profileSeoTitle'),
})

const onSuccess = () => {
  toast.add({
    title: t('settings.profileUpdatedTitle'),
    description: t('settings.profileUpdatedDescription'),
    icon: 'i-lucide-check',
    color: 'success',
  })
}
</script>

<template>
  <div>
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      :title="$t('settings.loadProfileFailed')"
      :description="apiErrorMessage(error)"
      icon="i-lucide-alert-circle"
    />

    <ProfileForm
      v-else-if="profile"
      :profile="profile"
      @success="onSuccess"
    />
  </div>
</template>
