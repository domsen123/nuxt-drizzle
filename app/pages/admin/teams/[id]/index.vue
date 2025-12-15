<script setup lang="ts">
import type { AdminTeam } from '~/features/admin'
import { useAdminTeam } from '~/features/admin'
import AdminTeamForm from '~/features/admin/components/AdminTeamForm.vue'

const route = useRoute()
const router = useRouter()

// Try to inject team data from parent layout, with fallback for SSR
const injected = inject<{
  team: Ref<AdminTeam | null>
  teamId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
} | null>('adminTeam', null)

// Fallback: fetch data directly if inject fails during SSR
const teamId = computed(() => route.params.id as string)
const fallbackQuery = injected ? null : useAdminTeam(teamId)

// Use injected data if available, otherwise use fallback
const team = computed(() => injected?.team.value ?? fallbackQuery?.team.value ?? null)
const status = computed(() => injected?.status.value ?? fallbackQuery?.status.value ?? 'pending')
const error = computed(() => injected?.error.value ?? fallbackQuery?.error.value ?? null)
const refresh = () => injected?.refresh() ?? fallbackQuery?.refresh()

const isLoading = computed(() => status.value === 'pending')

useSeoMeta({
  title: () => team.value
    ? `Edit ${team.value.name} - Admin`
    : 'Edit Team - Admin',
})

const onSuccess = () => {
  refresh()
}

const onCancel = () => {
  router.push(ROUTES.admin.teams)
}
</script>

<template>
  <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-3xl mx-auto py-6 px-6 lg:py-12">
    <div v-if="isLoading" class="flex items-center justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-8 text-muted" />
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Failed to load team"
      :description="error.message"
      icon="i-lucide-alert-circle"
    />

    <AdminTeamForm
      v-else-if="team"
      :team="team"
      @success="onSuccess"
      @cancel="onCancel"
    />
  </div>
</template>
