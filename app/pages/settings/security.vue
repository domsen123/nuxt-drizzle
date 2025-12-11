<script setup lang="ts">
import ChangePasswordForm from '~/features/profile/components/ChangePasswordForm.vue'

const toast = useToast()

useSeoMeta({
  title: 'Security - Settings',
})

const onSuccess = () => {
  toast.add({
    title: 'Password updated',
    description: 'Your password has been changed successfully.',
    icon: 'i-lucide-check',
    color: 'success',
  })
}
</script>

<template>
  <ChangePasswordForm @success="onSuccess" />
</template>
