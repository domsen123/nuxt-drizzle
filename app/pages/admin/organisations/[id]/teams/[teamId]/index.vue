<script setup lang="ts">
import type { Team, UpdateTeamInput } from '~/features/teams'
import { useDeleteTeam, useUpdateTeam } from '~/features/teams'
import TeamGeneralForm from '~/features/teams/components/TeamGeneralForm.vue'

const router = useRouter()
const toast = useToast()

// Inject team data from parent layout
const { team, organisationId, refresh } = inject<{
  team: Ref<Team | null>
  teamId: ComputedRef<string>
  organisationId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
}>('adminTeam')!

// Mutations
const { mutateAsync: updateTeam, asyncStatus: updateStatus } = useUpdateTeam()
const { mutateAsync: deleteTeam } = useDeleteTeam()

const isUpdating = computed(() => updateStatus.value === 'loading')

useSeoMeta({
  title: () => team.value
    ? `${team.value.name} - Team Settings - Admin`
    : 'Team Settings - Admin',
})

const handleSubmit = async (data: UpdateTeamInput) => {
  if (!team.value)
    return

  try {
    await updateTeam({
      organisationId: organisationId.value,
      teamId: team.value.id,
      data,
    })
    toast.add({
      title: 'Team updated',
      description: 'The team has been updated successfully.',
      icon: 'i-lucide-check',
      color: 'success',
    })
    refresh()
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to update team'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}

const handleDelete = async () => {
  if (!team.value)
    return

  try {
    await deleteTeam({
      organisationId: organisationId.value,
      teamId: team.value.id,
    })
    toast.add({
      title: 'Team deleted',
      description: 'The team has been deleted successfully.',
      icon: 'i-lucide-check',
      color: 'success',
    })
    router.push(ROUTES.admin.organisationTeams(organisationId.value))
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to delete team'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}
</script>

<template>
  <div class="py-6 px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold">
        General
      </h1>
      <p class="text-muted">
        Manage team settings and information
      </p>
    </div>

    <div v-if="!team" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
    </div>

    <TeamGeneralForm
      v-else
      :team="team"
      :is-loading="isUpdating"
      @submit="handleSubmit"
      @delete="handleDelete"
    />
  </div>
</template>
