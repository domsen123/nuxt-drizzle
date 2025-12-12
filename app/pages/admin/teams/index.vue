<script setup lang="ts">
import type { Team, TeamWithOrganisation } from '~/features/teams'
import { useAllTeams, useDeleteTeamById } from '~/features/teams'
import TeamsList from '~/features/teams/components/TeamsList.vue'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const toast = useToast()

// Filter state
const selectedOrganisationId = ref<string>()

// Pagination and search
const {
  search,
  page,
  perPage,
  offset,
  queryParams,
} = usePagination({
  defaultPerPage: 10,
  defaultSort: [{ key: 'createdAt', direction: 'desc' }],
  resetOnChange: [selectedOrganisationId],
})

// Combined query params with organisation filter
const allTeamsParams = computed(() => ({
  ...queryParams.value,
  organisationId: selectedOrganisationId.value,
}))

// Fetch all teams (optionally filtered by organisation)
const { teams, total, status: teamsStatus, error: teamsError, refresh } = useAllTeams(allTeamsParams)

// Mutations
const { mutateAsync: deleteTeam } = useDeleteTeamById()

const isLoading = computed(() => teamsStatus.value === 'pending')

// Get unique organisations for filter (fetched separately to avoid circular dependency)
const organisationFilterOptions = computed(() => {
  const orgs = new Map<string, { id: string, name: string }>()
  teams.value.forEach((team) => {
    if (!orgs.has(team.organisation.id)) {
      orgs.set(team.organisation.id, team.organisation)
    }
  })
  const sortedOrgs = Array.from(orgs.values()).sort((a, b) => a.name.localeCompare(b.name))
  return [
    { label: 'All Organisations', value: undefined },
    ...sortedOrgs.map(org => ({ label: org.name, value: org.id })),
  ]
})

useSeoMeta({
  title: 'Teams - Admin',
})

const handleDelete = async (team: Team | TeamWithOrganisation) => {
  try {
    await deleteTeam({ teamId: team.id })
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
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar title="Teams">
        <template #leading>
          <UDashboardSidebarToggle />
        </template>

        <template #right>
          <div class="flex items-center gap-2">
            <UButton
              icon="i-lucide-refresh-cw"
              color="neutral"
              variant="ghost"
              :loading="isLoading"
              @click="refresh()"
            />
          </div>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="p-6">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold">
              Teams
            </h1>
            <p class="text-muted">
              {{ total }} team{{ total !== 1 ? 's' : '' }} total
            </p>
          </div>
        </div>

        <!-- Search and Filters -->
        <div class="flex items-center gap-3 mb-4">
          <UInput
            v-model="search"
            icon="i-lucide-search"
            placeholder="Search by name..."
            class="flex-1"
          >
            <template #trailing>
              <UButton
                v-show="search !== ''"
                color="neutral"
                variant="link"
                icon="i-lucide-x"
                :padded="false"
                @click="search = ''"
              />
            </template>
          </UInput>
          <USelectMenu
            v-model="selectedOrganisationId"
            :items="organisationFilterOptions"
            value-key="value"
            placeholder="Filter by organisation"
            class="w-64"
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

        <TeamsList
          :teams="teams"
          :is-loading="isLoading"
          show-organisation
          @delete="handleDelete"
        />

        <!-- Pagination -->
        <div v-if="total > 0" class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <span class="text-sm text-muted">
              Showing {{ offset + 1 }}-{{ Math.min(offset + perPage, total) }} of {{ total }}
            </span>
          </div>
          <UPagination
            v-model:page="page"
            :total="total"
            :items-per-page="perPage"
            show-edges
          />
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
