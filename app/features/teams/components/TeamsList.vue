<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'
import type { Team } from '../types/teams.types'

const props = defineProps<{
  teams: Team[]
  organisationId: string
  isLoading?: boolean
}>()

const emit = defineEmits<{
  edit: [team: Team]
  delete: [team: Team]
}>()

const search = ref('')

const filteredTeams = computed(() => {
  if (!search.value.trim()) {
    return props.teams
  }
  const query = search.value.toLowerCase()
  return props.teams.filter(team =>
    team.name.toLowerCase().includes(query),
  )
})

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const getActionsMenu = (team: Team): DropdownMenuItem[] => [
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
      header: 'p-4 mb-0 border-b border-default',
    }"
  >
    <template #header>
      <UInput
        v-model="search"
        icon="i-lucide-search"
        placeholder="Search teams..."
        class="w-full"
      />
    </template>

    <ul v-if="filteredTeams.length > 0" role="list" class="divide-y divide-default">
      <li
        v-for="team in filteredTeams"
        :key="team.id"
        class="flex items-center justify-between gap-3 py-3 px-4 sm:px-6 hover:bg-elevated transition-colors"
      >
        <NuxtLink
          :to="ROUTES.admin.teamDetail(organisationId, team.id)"
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
      <p v-if="search">
        No teams found matching "{{ search }}"
      </p>
      <p v-else>
        No teams in this organisation
      </p>
    </div>
  </UPageCard>
</template>
