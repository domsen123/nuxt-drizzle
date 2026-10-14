<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'
import { useStopImpersonation } from '~/features/admin/composables/useImpersonation'
import { useAppearanceMenuItem, useLanguageMenuItem } from '~/features/profile'

const router = useRouter()
const toast = useToast()
const route = useRoute()
const open = ref(false)

const { user, isImpersonating } = useSession()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()
const { mutateAsync: stopImpersonation, asyncStatus: stopImpersonationStatus } = useStopImpersonation()
const { t } = useI18n()
const { appearanceMenuItems } = useAppearanceMenuItem()
const { languageMenuItem } = useLanguageMenuItem()

// Sidebar navigation items
const navItems: NavigationMenuItem[][] = [
  [
    {
      label: 'Dashboard',
      icon: 'i-lucide-layout-dashboard',
      to: ROUTES.admin.home,
    },
  ],
  [
    {
      label: 'Authentication',
      icon: 'i-lucide-shield',
      children: [
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
      ],
    },
  ],
  [
    {
      label: 'Content',
      icon: 'i-lucide-file-text',
      children: [
        {
          label: 'Blog',
          icon: 'i-lucide-newspaper',
          to: ROUTES.admin.blog,
        },
        {
          label: 'Media',
          icon: 'i-lucide-images',
          to: ROUTES.admin.media,
        },
      ],
    },
  ],
  [
    {
      label: 'Settings',
      icon: 'i-lucide-settings',
      children: [
        {
          label: 'Authentication',
          icon: 'i-lucide-shield-check',
          to: ROUTES.admin.settingsAuthentication,
        },
      ],
    },
  ],
]

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

const handleStopImpersonation = () => {
  stopImpersonation()
    .then(() => {
      toast.add({
        title: t('nav.impersonationEndedTitle'),
        description: t('nav.impersonationEndedDescription'),
        color: 'success',
      })
      router.push(ROUTES.admin.users)
    })
    .catch(() => {
      toast.add({
        title: t('nav.impersonationStopFailedTitle'),
        description: t('nav.impersonationStopFailedDescription'),
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
    label: isStoppingImpersonation.value ? t('nav.stoppingImpersonation') : t('nav.stopImpersonating'),
    icon: 'i-lucide-user-x',
    onSelect: handleStopImpersonation,
    disabled: isStoppingImpersonation.value,
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
    return [accountItem, stopImpersonationItem, backToAppItem, appearanceItem, signOutItem]
  }

  return [accountItem, backToAppItem, appearanceItem, signOutItem]
})

// Compute active state for nav items (including children)
const isActive = (item: NavigationMenuItem) =>
  typeof item.to === 'string' && (item.to === route.path || (item.to !== ROUTES.admin.home && route.path.startsWith(item.to)))

const navItemsWithActive = computed(() =>
  navItems.map(group =>
    group.map(item => ({
      ...item,
      active: isActive(item),
      defaultOpen: item.children?.some(child => isActive(child)),
      children: item.children?.map(child => ({
        ...child,
        active: isActive(child),
      })),
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
            <AppUserAvatar
              v-if="user"
              :user-id="user.id"
              :name="user.name"
              :email="user.email"
              size="2xs"
            />
            <UAvatar v-else size="2xs" />
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
