<script setup lang="ts">
import { useStopImpersonation } from '~/features/admin/composables/useImpersonation'
import { useAppearanceMenuItem, useLanguageMenuItem } from '~/features/profile'

const router = useRouter()
const toast = useToast()
const { t } = useI18n()

const { user, isAuthenticated, isAnonymous, isLoading, isImpersonating } = useSession()
const { isGlobalAdmin } = usePermissions()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()
const { mutateAsync: stopImpersonation, asyncStatus: stopImpersonationStatus } = useStopImpersonation()
const { appearanceMenuItems, colorModeMenuItems } = useAppearanceMenuItem()
const { languageMenuItem, guestLanguageMenuItems, currentLocaleIcon } = useLanguageMenuItem()

const items = computed(() => [])

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

// User dropdown items
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

  const settingsItem = [{
    label: t('nav.settings'),
    icon: 'i-lucide-settings',
    to: ROUTES.settings.profile,
  }]

  const adminItem = [{
    label: t('nav.adminDashboard'),
    icon: 'i-lucide-shield',
    to: ROUTES.admin.home,
  }]

  const appearanceItem = [...appearanceMenuItems.value, languageMenuItem.value]

  const signOutItem = [{
    label: t('common.actions.signOut'),
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  }]

  // When impersonating, show stop impersonation option prominently
  if (isImpersonating.value) {
    return [accountItem, stopImpersonationItem, settingsItem, appearanceItem, signOutItem]
  }

  if (isGlobalAdmin.value) {
    return [accountItem, settingsItem, adminItem, appearanceItem, signOutItem]
  }

  return [accountItem, settingsItem, appearanceItem, signOutItem]
})
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink :to="{ path: ROUTES.start, force: true }">
        <AppLogo class="w-auto h-6 shrink-0" />
      </NuxtLink>
    </template>

    <UNavigationMenu
      :items="items"
      variant="link"
    />

    <template #right>
      <!-- Loading state -->
      <template v-if="isLoading">
        <USkeleton class="h-8 w-20 rounded-md" />
      </template>

      <!-- Authenticated state -->
      <template v-else-if="isAuthenticated && user && !isAnonymous">
        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            :loading="isLoggingOut"
          >
            <UAvatar
              :alt="user.name ?? user.email ?? undefined"
              size="2xs"
            />
            <span class="hidden lg:inline truncate max-w-32">
              {{ user.name || user.email || $t('common.guest') }}
            </span>
            <UIcon name="i-lucide-chevron-down" class="hidden lg:inline" />
          </UButton>

          <template #chip-leading="{ item }">
            <AppearanceColorChip :color="item.chip" />
          </template>
        </UDropdownMenu>
      </template>

      <!-- Unauthenticated state -->
      <template v-else>
        <UDropdownMenu :items="colorModeMenuItems">
          <UButton
            icon="i-lucide-sun-moon"
            color="neutral"
            variant="ghost"
            :aria-label="$t('common.colorMode')"
          />
        </UDropdownMenu>

        <UDropdownMenu :items="guestLanguageMenuItems">
          <UButton
            :icon="currentLocaleIcon"
            color="neutral"
            variant="ghost"
            :aria-label="$t('common.language')"
          />
        </UDropdownMenu>

        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          :to="ROUTES.auth.signIn"
          :aria-label="$t('common.actions.signIn')"
          class="lg:hidden"
        />

        <UButton
          :label="$t('common.actions.signIn')"
          color="neutral"
          variant="outline"
          :to="ROUTES.auth.signIn"
          class="hidden lg:inline-flex"
        />

        <UButton
          :label="$t('common.actions.signUp')"
          color="neutral"
          trailing-icon="i-lucide-arrow-right"
          class="hidden lg:inline-flex"
          :to="ROUTES.auth.signUp"
        />
      </template>
    </template>

    <template #body>
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="-mx-2.5"
      />

      <USeparator class="my-6" />

      <!-- Mobile menu auth section -->
      <template v-if="isAuthenticated && user && !isAnonymous">
        <div class="px-2.5 py-2 text-sm text-muted">
          {{ $t('nav.signedInAs', { email: user.email ?? $t('common.guest') }) }}
        </div>
        <UButton
          v-if="isImpersonating"
          :label="$t('nav.stopImpersonating')"
          color="warning"
          variant="subtle"
          icon="i-lucide-user-x"
          :loading="isStoppingImpersonation"
          block
          class="mb-3"
          @click="handleStopImpersonation"
        />
        <UButton
          :label="$t('nav.settings')"
          color="neutral"
          variant="subtle"
          icon="i-lucide-settings"
          :to="ROUTES.settings.profile"
          block
          class="mb-3"
        />
        <UButton
          v-if="isGlobalAdmin && !isImpersonating"
          :label="$t('nav.adminDashboard')"
          color="neutral"
          variant="subtle"
          icon="i-lucide-shield"
          :to="ROUTES.admin.home"
          block
          class="mb-3"
        />
        <UButton
          :label="$t('common.actions.signOut')"
          color="neutral"
          variant="subtle"
          icon="i-lucide-log-out"
          :loading="isLoggingOut"
          block
          @click="handleLogout"
        />
      </template>
      <template v-else>
        <UButton
          :label="$t('common.actions.signIn')"
          color="neutral"
          variant="subtle"
          :to="ROUTES.auth.signIn"
          block
          class="mb-3"
        />
        <UButton
          :label="$t('common.actions.signUp')"
          color="neutral"
          :to="ROUTES.auth.signUp"
          block
        />
      </template>
    </template>
  </UHeader>
</template>
