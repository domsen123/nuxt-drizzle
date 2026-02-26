<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAdminTeam } from '~/features/admin'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const teamId = computed(() => route.params.id as string)

const { team } = useAdminTeam(teamId)

const links = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'General',
    icon: 'i-lucide-settings',
    to: ROUTES.admin.team(teamId.value),
    exact: true,
  },
  {
    label: 'Members',
    icon: 'i-lucide-users',
    to: ROUTES.admin.teamMembers(teamId.value),
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
            :to="ROUTES.admin.teams"
          />
        </template>
        <template #trailing>
          <UButton
            v-if="team?.organisation"
            :to="ROUTES.admin.organisationEdit(team.organisation.id)"
            color="neutral"
            variant="link"
            size="sm"
            class="text-muted hover:text-default"
          >
            <UIcon name="i-lucide-building-2" class="size-4 mr-1" />
            {{ team.organisation.name }}
          </UButton>
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
