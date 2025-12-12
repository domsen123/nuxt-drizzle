<script setup lang="ts">
import type { AdminOrganisation } from '~/features/admin'
import type { Team } from '~/features/teams'
import {
  useAdminOrganisationTeams,
  useCreateTeam,
  useDeleteTeam,
  useUpdateTeam,
} from '~/features/teams'
import TeamFormModal from '~/features/teams/components/TeamFormModal.vue'
import TeamsList from '~/features/teams/components/TeamsList.vue'

const toast = useToast()

// Inject organisation data from parent layout
const { organisation, organisationId } = inject<{
  organisation: Ref<AdminOrganisation | null>
  organisationId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
}>('adminOrganisation')!

// Fetch teams
const { teams, total, status: teamsStatus, error: teamsError } = useAdminOrganisationTeams(organisationId)

// Mutations
const { mutateAsync: createTeam, asyncStatus: createStatus } = useCreateTeam()
const { mutateAsync: updateTeam, asyncStatus: updateStatus } = useUpdateTeam()
const { mutateAsync: deleteTeam } = useDeleteTeam()

const isLoading = computed(() => teamsStatus.value === 'pending')
const isMutating = computed(() => createStatus.value === 'loading' || updateStatus.value === 'loading')

// Modal state
const isFormModalOpen = ref(false)
const editingTeam = ref<Team | null>(null)

useSeoMeta({
  title: () => organisation.value
    ? `Teams - ${organisation.value.name} - Admin`
    : 'Teams - Admin',
})

// Handlers
const handleCreate = () => {
  editingTeam.value = null
  isFormModalOpen.value = true
}

const handleEdit = (team: Team) => {
  editingTeam.value = team
  isFormModalOpen.value = true
}

const handleSubmit = async (data: { name: string }) => {
  try {
    if (editingTeam.value) {
      await updateTeam({
        organisationId: organisationId.value,
        teamId: editingTeam.value.id,
        data,
      })
      toast.add({
        title: 'Team updated',
        description: `${data.name} has been updated.`,
        icon: 'i-lucide-check',
        color: 'success',
      })
    }
    else {
      await createTeam({
        organisationId: organisationId.value,
        data,
      })
      toast.add({
        title: 'Team created',
        description: `${data.name} has been created.`,
        icon: 'i-lucide-check',
        color: 'success',
      })
    }
    isFormModalOpen.value = false
    editingTeam.value = null
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to save team'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}

const handleDelete = async (team: Team) => {
  try {
    await deleteTeam({
      organisationId: organisationId.value,
      teamId: team.id,
    })
    toast.add({
      title: 'Team deleted',
      description: `${team.name} has been deleted.`,
      icon: 'i-lucide-check',
      color: 'success',
    })
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
    <div class="flex items-center justify-between mb-6">
      <div>
        <h1 class="text-2xl font-bold">
          Teams
        </h1>
        <p class="text-muted">
          {{ total }} team{{ total !== 1 ? 's' : '' }} in this organisation
        </p>
      </div>
      <UButton
        icon="i-lucide-plus"
        label="Create Team"
        @click="handleCreate"
      />
    </div>

    <UAlert
      v-if="teamsError"
      color="error"
      title="Failed to load data"
      :description="teamsError.message"
      icon="i-lucide-alert-circle"
      class="mb-4"
    />

    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
    </div>

    <TeamsList
      v-else
      :teams="teams"
      :organisation-id="organisationId"
      :is-loading="isLoading"
      @edit="handleEdit"
      @delete="handleDelete"
    />
  </div>

  <TeamFormModal
    v-model:open="isFormModalOpen"
    :team="editingTeam"
    :is-loading="isMutating"
    @submit="handleSubmit"
  />
</template>
