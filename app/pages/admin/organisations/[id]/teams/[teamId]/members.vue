<script setup lang="ts">
import type { Team, TeamMember } from '~/features/teams'
import {
  useAddTeamMember,
  useAdminTeamMembers,
  useEligibleTeamMembers,
  useRemoveTeamMember,
} from '~/features/teams'
import TeamMemberAddModal from '~/features/teams/components/TeamMemberAddModal.vue'
import TeamMembersList from '~/features/teams/components/TeamMembersList.vue'

const toast = useToast()

// Inject team data from parent layout
const { team, teamId, organisationId } = inject<{
  team: Ref<Team | null>
  teamId: ComputedRef<string>
  organisationId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
}>('adminTeam')!

// Fetch team members
const { members, total, status: membersStatus, error: membersError, refresh } = useAdminTeamMembers(organisationId, teamId)

// Fetch eligible members
const { eligibleMembers } = useEligibleTeamMembers(organisationId, teamId)

// Mutations
const { mutateAsync: addMember, asyncStatus: addStatus } = useAddTeamMember()
const { mutateAsync: removeMember } = useRemoveTeamMember()

const isLoading = computed(() => membersStatus.value === 'pending')
const isAdding = computed(() => addStatus.value === 'loading')

// Modal state
const isAddModalOpen = ref(false)

useSeoMeta({
  title: () => team.value
    ? `Members - ${team.value.name} - Admin`
    : 'Team Members - Admin',
})

const handleAddMember = async (data: { userId: string }) => {
  try {
    await addMember({
      organisationId: organisationId.value,
      teamId: teamId.value,
      data,
    })
    isAddModalOpen.value = false
    toast.add({
      title: 'Member added',
      description: 'The member has been added to the team.',
      icon: 'i-lucide-check',
      color: 'success',
    })
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to add member'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}

const handleRemoveMember = async (member: TeamMember) => {
  try {
    await removeMember({
      organisationId: organisationId.value,
      teamId: teamId.value,
      userId: member.userId,
    })
    toast.add({
      title: 'Member removed',
      description: `${member.user.name || member.user.email} has been removed from the team.`,
      icon: 'i-lucide-check',
      color: 'success',
    })
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to remove member'
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
          Members
        </h1>
        <p class="text-muted">
          {{ total }} member{{ total !== 1 ? 's' : '' }} in this team
        </p>
      </div>
      <div class="flex items-center gap-2">
        <UButton
          icon="i-lucide-refresh-cw"
          color="neutral"
          variant="ghost"
          :loading="isLoading"
          @click="refresh()"
        />
        <UButton
          icon="i-lucide-user-plus"
          label="Add Member"
          :disabled="eligibleMembers.length === 0"
          @click="isAddModalOpen = true"
        />
      </div>
    </div>

    <UAlert
      v-if="membersError"
      color="error"
      title="Failed to load data"
      :description="membersError.message"
      icon="i-lucide-alert-circle"
      class="mb-4"
    />

    <TeamMembersList
      :members="members"
      :is-loading="isLoading"
      @remove="handleRemoveMember"
    />
  </div>

  <TeamMemberAddModal
    v-model:open="isAddModalOpen"
    :eligible-members="eligibleMembers"
    :is-loading="isAdding"
    @submit="handleAddMember"
  />
</template>
