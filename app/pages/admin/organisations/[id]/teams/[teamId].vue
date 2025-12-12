<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import type { AdminOrganisation } from '~/features/admin'
import { useAdminTeam } from '~/features/teams'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const organisationId = computed(() => route.params.id as string)
const teamId = computed(() => route.params.teamId as string)

// Inject organisation data from parent layout
const { organisation } = inject<{
  organisation: Ref<AdminOrganisation | null>
}>('adminOrganisation')!

const { team, status, error, refresh } = useAdminTeam(organisationId, teamId)

// Provide team data to child pages
provide('adminTeam', {
  team,
  teamId,
  organisationId,
  status,
  error,
  refresh,
})

const links = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'General',
    icon: 'i-lucide-settings',
    to: ROUTES.admin.teamDetail(organisationId.value, teamId.value),
    exact: true,
  },
  {
    label: 'Members',
    icon: 'i-lucide-users',
    to: ROUTES.admin.teamMembers(organisationId.value, teamId.value),
  },
]])
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="team?.name ?? 'Team'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :to="ROUTES.admin.organisationTeams(organisationId)"
          />
        </template>
        <template #trailing>
          <span v-if="organisation" class="text-sm text-muted">
            {{ organisation.name }}
          </span>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <NuxtPage />
    </template>
  </UDashboardPanel>
</template>
