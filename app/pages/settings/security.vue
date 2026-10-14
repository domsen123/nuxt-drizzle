<script setup lang="ts">
import SessionsList from '~/features/auth/components/SessionsList.vue'
import ChangePasswordForm from '~/features/profile/components/ChangePasswordForm.vue'

const toast = useToast()
const { t } = useI18n()

useSeoMeta({
  title: () => t('settings.securitySeoTitle'),
})

const onPasswordSuccess = () => {
  toast.add({
    title: t('settings.passwordUpdatedTitle'),
    description: t('settings.passwordUpdatedDescription'),
    icon: 'i-lucide-check',
    color: 'success',
  })
}
</script>

<template>
  <div class="space-y-6">
    <ChangePasswordForm @success="onPasswordSuccess" />
    <SessionsList />
  </div>
</template>
