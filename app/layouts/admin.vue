<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useStopImpersonation } from '~/features/admin/composables/useImpersonation'

const router = useRouter()
const toast = useToast()
const route = useRoute()
const open = ref(false)

const { user, isImpersonating } = useSession()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()
const { mutateAsync: stopImpersonation, asyncStatus: stopImpersonationStatus } = useStopImpersonation()

// Sidebar navigation items
const navItems: NavigationMenuItem[][] = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: ROUTES.admin.home,
    },
    {
      label: 'Users',
      icon: 'i-lucide-users',
      to: ROUTES.admin.users,
    },
    {
      label: 'Organisations',
      icon: 'i-lucide-building-2',
      to: ROUTES.admin.organisations,
    },
    {
      label: 'Teams',
      icon: 'i-lucide-users-round',
      to: ROUTES.admin.teams,
    },
    {
      label: 'Blog',
      icon: 'i-lucide-newspaper',
      to: ROUTES.admin.blog,
    },
  ],
]

const handleLogout = () => {
  logout()
    .then(() => {
      toast.add({ title: 'Signed out', description: 'See you soon!' })
      router.push(ROUTES.start)
    })
    .catch(() => {
      // Handle error silently
    })
}

const handleStopImpersonation = () => {
  stopImpersonation()
    .then(() => {
      toast.add({
        title: 'Impersonation ended',
        description: 'You are now back to your admin account.',
        color: 'success',
      })
      router.push(ROUTES.admin.users)
    })
    .catch(() => {
      toast.add({
        title: 'Failed to stop impersonation',
        description: 'Please try again.',
        color: 'error',
      })
    })
}

const isLoggingOut = computed(() => logoutStatus.value === 'loading')
const isStoppingImpersonation = computed(() => stopImpersonationStatus.value === 'loading')

// User menu items
const userMenuItems = computed(() => {
  const accountItem = [{
    label: user.value?.email ?? '',
    slot: 'account',
    disabled: true,
  }]

  const stopImpersonationItem = [{
    label: isStoppingImpersonation.value ? 'Stopping...' : 'Stop Impersonating',
    icon: 'i-lucide-user-x',
    onSelect: handleStopImpersonation,
    disabled: isStoppingImpersonation.value,
  }]

  const backToAppItem = [{
    label: 'Back to App',
    icon: 'i-lucide-arrow-left',
    to: ROUTES.start,
  }]

  const signOutItem = [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  }]

  if (isImpersonating.value) {
    return [accountItem, stopImpersonationItem, backToAppItem, signOutItem]
  }

  return [accountItem, backToAppItem, signOutItem]
})

// Compute active state for nav items
const navItemsWithActive = computed(() =>
  navItems.map(group =>
    group.map(item => ({
      ...item,
      active: item.to === route.path || (item.to !== ROUTES.admin.home && route.path.startsWith(item.to as string)),
    })),
  ),
)
</script>

<template>
  <UDashboardGroup>
    <UDashboardSidebar
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/75"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <NuxtLink :to="ROUTES.admin.home" class="flex items-center gap-2 px-2">
          <UIcon name="i-lucide-shield" class="text-primary size-5" />
          <span v-if="!collapsed" class="font-semibold">Admin</span>
        </NuxtLink>
      </template>
      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="navItemsWithActive"
          orientation="vertical"
          tooltip
          popover
        />
      </template>

      <template #footer>
        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            class="w-full justify-start"
            :loading="isLoggingOut"
          >
            <UAvatar
              :alt="user?.name ?? user?.email"
              size="2xs"
            />
            <span class="truncate">{{ user?.name || user?.email }}</span>
            <UIcon name="i-lucide-chevron-down" class="ml-auto" />
          </UButton>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
