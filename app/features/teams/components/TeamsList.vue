<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Team, TeamWithOrganisation } from '../types/teams.types'

defineProps<{
  teams: Team[] | TeamWithOrganisation[]
  organisationId?: string
  isLoading?: boolean
  showOrganisation?: boolean
}>()

const emit = defineEmits<{
  edit: [team: Team | TeamWithOrganisation]
  delete: [team: Team | TeamWithOrganisation]
}>()

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// Helper to get team link - use standalone route
const getTeamLink = (team: Team | TeamWithOrganisation) => {
  return ROUTES.admin.team(team.id)
}

// Helper to check if team has organisation data
const hasOrganisation = (team: Team | TeamWithOrganisation): team is TeamWithOrganisation => {
  return 'organisation' in team && !!team.organisation
}

const getActionsMenu = (team: Team | TeamWithOrganisation): DropdownMenuItem[] => [
  {
    label: 'Edit team',
    icon: 'i-lucide-pencil',
    onSelect: () => emit('edit', team),
  },
  {
    label: 'Delete team',
    icon: 'i-lucide-trash-2',
    color: 'error' as const,
    onSelect: () => emit('delete', team),
  },
]
</script>

<template>
  <UPageCard
    variant="subtle"
    :ui="{
      container: 'p-0 sm:p-0 gap-y-0',
      wrapper: 'items-stretch',
    }"
  >
    <ul v-if="teams.length > 0" role="list" class="divide-y divide-default">
      <li
        v-for="team in teams"
        :key="team.id"
        class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6 hover:bg-elevated transition-colors"
      >
        <NuxtLink
          :to="getTeamLink(team)"
          class="flex items-center gap-3 min-w-0 flex-1"
        >
          <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10">
            <UIcon name="i-lucide-users-round" class="size-5 text-primary" />
          </div>
          <div class="text-sm min-w-0">
            <p class="text-highlighted font-medium truncate">
              {{ team.name }}
            </p>
            <p class="text-muted text-xs truncate">
              <template v-if="showOrganisation && hasOrganisation(team)">
                {{ team.organisation.name }} &middot;
              </template>
              Created {{ formatDate(team.createdAt) }}
            </p>
          </div>
        </NuxtLink>

        <div class="flex items-center gap-3">
          <UDropdownMenu :items="getActionsMenu(team)" :content="{ align: 'end' }">
            <UButton
              icon="i-lucide-ellipsis-vertical"
              color="neutral"
              variant="ghost"
            />
          </UDropdownMenu>
        </div>
      </li>
    </ul>

    <div v-else class="py-12 text-center text-muted">
      <UIcon name="i-lucide-users-round" class="size-8 mx-auto mb-2 opacity-50" />
      <p>No teams found</p>
    </div>
  </UPageCard>
</template>
