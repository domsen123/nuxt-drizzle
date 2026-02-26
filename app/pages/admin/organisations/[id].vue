<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

const route = useRoute()
const organisationId = computed(() => route.params.id as string)

const { organisation } = useAdminOrganisation(organisationId)

const links = computed<NavigationMenuItem[][]>(() => [[
  {
    label: 'General',
    icon: 'i-lucide-settings',
    to: ROUTES.admin.organisationEdit(organisationId.value),
    exact: true,
  },
  {
    label: 'Members',
    icon: 'i-lucide-users',
    to: ROUTES.admin.organisationMembers(organisationId.value),
  },
  {
    label: 'Teams',
    icon: 'i-lucide-users-round',
    to: ROUTES.admin.organisationTeams(organisationId.value),
  },
]])
</script>

<template>
  <UDashboardPanel>
    <template #header>
      <UDashboardNavbar :title="organisation?.name ?? 'Organisation'">
        <template #leading>
          <UButton
            icon="i-lucide-arrow-left"
            color="neutral"
            variant="ghost"
            :to="ROUTES.admin.organisations"
          />
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
