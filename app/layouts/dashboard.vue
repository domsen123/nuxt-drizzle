<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useAppearanceMenuItem, useLanguageMenuItem } from '~/features/profile'

const router = useRouter()
const toast = useToast()
const route = useRoute()
const open = ref(false)

const { t } = useI18n()
const { user, isImpersonating } = useSession()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()
const { appearanceMenuItems } = useAppearanceMenuItem()
const { languageMenuItem } = useLanguageMenuItem()

// Sidebar navigation items
const navItems = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: t('nav.dashboard'),
      icon: 'i-lucide-layout-dashboard',
      to: ROUTES.dashboard.home,
    },
  ],
])

const handleLogout = () => {
  logout()
    .then(() => {
      toast.add({ title: t('nav.signedOutTitle'), description: t('nav.signedOutDescription') })
      router.push(ROUTES.start)
    })
    .catch(() => {
      // Handle error silently
    })
}

const isLoggingOut = computed(() => logoutStatus.value === 'loading')

// User menu items
const userMenuItems = computed(() => {
  const accountItem = [{
    label: user.value?.email ?? '',
    slot: 'account',
    disabled: true,
  }]

  const backToAppItem = [{
    label: t('nav.backToApp'),
    icon: 'i-lucide-arrow-left',
    to: ROUTES.start,
  }]

  const appearanceItem = [...appearanceMenuItems.value, languageMenuItem.value]

  const signOutItem = [{
    label: t('common.actions.signOut'),
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  }]

  if (isImpersonating.value) {
    return [accountItem, backToAppItem, appearanceItem, signOutItem]
  }

  return [accountItem, backToAppItem, appearanceItem, signOutItem]
})

// Compute active state for nav items
const navItemsWithActive = computed(() =>
  navItems.value.map(group =>
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
          <AppLogo :collapsed="collapsed" />
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
              :alt="user?.name ?? user?.email ?? undefined"
              size="2xs"
            />
            <span class="truncate">{{ user?.name || user?.email || $t('common.guest') }}</span>
            <UIcon name="i-lucide-chevron-down" class="ml-auto" />
          </UButton>

          <template #chip-leading="{ item }">
            <AppearanceColorChip :color="item.chip" />
          </template>
        </UDropdownMenu>
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
