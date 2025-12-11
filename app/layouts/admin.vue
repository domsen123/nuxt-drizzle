<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const router = useRouter()
const toast = useToast()
const route = useRoute()

const { user } = useSession()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()

// Sidebar navigation items
const navItems: NavigationMenuItem[][] = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: ROUTES.admin.home,
    },
    {
      label: 'Organisations',
      icon: 'i-lucide-building-2',
      to: ROUTES.admin.organisations,
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

// User menu items
const userMenuItems = computed(() => [
  [{
    label: user.value?.email ?? '',
    slot: 'account',
    disabled: true,
  }],
  [{
    label: 'Back to App',
    icon: 'i-lucide-arrow-left',
    to: ROUTES.start,
  }],
  [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  }],
])

const isLoggingOut = computed(() => logoutStatus.value === 'loading')

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
    <UDashboardSidebar>
      <template #header>
        <NuxtLink :to="ROUTES.admin.home" class="flex items-center gap-2 px-2">
          <UIcon name="i-lucide-shield" class="text-primary size-5" />
          <span class="font-semibold">Admin</span>
        </NuxtLink>
      </template>

      <UNavigationMenu
        :items="navItemsWithActive"
        orientation="vertical"
      />

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
