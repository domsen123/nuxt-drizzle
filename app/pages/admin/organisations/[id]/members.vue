<script setup lang="ts">
import type { AdminOrganisation } from '~/features/admin'
import type { OrganisationMember } from '~/features/organisation-members'
import {
  useAdminOrganisationMembers,
  useInviteOrganisationMember,
  useOrganisationRoles,
  useRemoveOrganisationMember,
  useUpdateOrganisationMemberRole,
} from '~/features/organisation-members'
import OrganisationMemberInviteModal from '~/features/organisation-members/components/OrganisationMemberInviteModal.vue'
import OrganisationMembersList from '~/features/organisation-members/components/OrganisationMembersList.vue'

const route = useRoute()
const toast = useToast()

// Try to inject organisation data from parent layout, with fallback for SSR
const injected = inject<{
  organisation: Ref<AdminOrganisation | null>
  organisationId: ComputedRef<string>
  status: Ref<string>
  error: Ref<Error | null>
  refresh: () => void
} | null>('adminOrganisation', null)

// Fallback: compute organisationId from route if inject fails during SSR
const organisationId = computed(() => injected?.organisationId.value ?? (route.params.id as string))

// Use injected organisation if available
const organisation = computed(() => injected?.organisation.value ?? null)

// Fetch members
const { members, total, status: membersStatus, error: membersError, refresh } = useAdminOrganisationMembers(organisationId)

// Fetch roles
const { roles } = useOrganisationRoles(organisationId)

// Mutations
const { mutateAsync: updateRole, asyncStatus: updateStatus } = useUpdateOrganisationMemberRole()
const { mutateAsync: removeMember } = useRemoveOrganisationMember()
const { mutateAsync: inviteMember, asyncStatus: inviteStatus } = useInviteOrganisationMember()

const isLoading = computed(() => membersStatus.value === 'pending')
const isUpdating = computed(() => updateStatus.value === 'loading')
const isInviting = computed(() => inviteStatus.value === 'loading')

// Invite modal state
const isInviteModalOpen = ref(false)

useSeoMeta({
  title: () => organisation.value
    ? `Members - ${organisation.value.name} - Admin`
    : 'Members - Admin',
})

// Handlers
const handleUpdateRole = async (member: OrganisationMember, roleId: string) => {
  try {
    await updateRole({
      organisationId: organisationId.value,
      userId: member.userId,
      data: { roleId },
    })
    toast.add({
      title: 'Role updated',
      description: `${member.user.name || member.user.email}'s role has been updated.`,
      icon: 'i-lucide-check',
      color: 'success',
    })
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to update role'
    toast.add({
      title: 'Error',
      description: message,
      icon: 'i-lucide-alert-circle',
      color: 'error',
    })
  }
}

const handleRemoveMember = async (member: OrganisationMember) => {
  try {
    await removeMember({
      organisationId: organisationId.value,
      userId: member.userId,
    })
    toast.add({
      title: 'Member removed',
      description: `${member.user.name || member.user.email} has been removed from the organisation.`,
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

const handleInvite = async (data: { email: string, roleId: string }) => {
  try {
    const result = await inviteMember({
      organisationId: organisationId.value,
      data,
    })
    isInviteModalOpen.value = false

    if (result.invited) {
      toast.add({
        title: 'Invitation sent',
        description: `An invitation has been sent to ${data.email}.`,
        icon: 'i-lucide-mail',
        color: 'success',
      })
    }
    else {
      toast.add({
        title: 'Member added',
        description: `${result.member?.user.name || data.email} has been added to the organisation.`,
        icon: 'i-lucide-check',
        color: 'success',
      })
    }
  }
  catch (err) {
    const message = (err as Error).message || 'Failed to invite member'
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
          {{ total }} member{{ total !== 1 ? 's' : '' }} in this organisation
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
          label="Invite"
          @click="isInviteModalOpen = true"
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

    <div v-if="isLoading" class="flex justify-center py-12">
      <UIcon name="i-lucide-loader-2" class="size-8 animate-spin text-muted" />
    </div>

    <OrganisationMembersList
      v-else
      :members="members"
      :roles="roles"
      :is-updating="isUpdating"
      @update:role="handleUpdateRole"
      @remove="handleRemoveMember"
    />
  </div>

  <OrganisationMemberInviteModal
    v-model:open="isInviteModalOpen"
    :roles="roles"
    :is-loading="isInviting"
    @submit="handleInvite"
  />
</template>
