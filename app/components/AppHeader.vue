<script setup lang="ts">
const router = useRouter()
const toast = useToast()

const { user, isAuthenticated, isLoading } = useSession()
const { isGlobalAdmin } = usePermissions()
const { mutateAsync: logout, asyncStatus: logoutStatus } = useLogout()

const items = computed(() => [])

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

const isLoggingOut = computed(() => logoutStatus.value === 'loading')

// User dropdown items
const userMenuItems = computed(() => {
  const accountItem = [{
    label: user.value?.email ?? '',
    slot: 'account',
    disabled: true,
  }]

  const settingsItem = [{
    label: 'Settings',
    icon: 'i-lucide-settings',
    to: ROUTES.settings.profile,
  }]

  const adminItem = [{
    label: 'Admin Dashboard',
    icon: 'i-lucide-shield',
    to: ROUTES.admin.home,
  }]

  const signOutItem = [{
    label: 'Sign out',
    icon: 'i-lucide-log-out',
    onSelect: handleLogout,
  }]

  if (isGlobalAdmin.value) {
    return [accountItem, settingsItem, adminItem, signOutItem]
  }

  return [accountItem, settingsItem, signOutItem]
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
      <UColorModeButton />

      <!-- Loading state -->
      <template v-if="isLoading">
        <USkeleton class="h-8 w-20 rounded-md" />
      </template>

      <!-- Authenticated state -->
      <template v-else-if="isAuthenticated && user">
        <UDropdownMenu :items="userMenuItems">
          <UButton
            color="neutral"
            variant="ghost"
            :loading="isLoggingOut"
          >
            <UAvatar
              :alt="user.name ?? user.email"
              size="2xs"
            />
            <span class="hidden lg:inline truncate max-w-32">
              {{ user.name || user.email }}
            </span>
            <UIcon name="i-lucide-chevron-down" class="hidden lg:inline" />
          </UButton>
        </UDropdownMenu>
      </template>

      <!-- Unauthenticated state -->
      <template v-else>
        <UButton
          icon="i-lucide-log-in"
          color="neutral"
          variant="ghost"
          :to="ROUTES.auth.signIn"
          class="lg:hidden"
        />

        <UButton
          label="Sign in"
          color="neutral"
          variant="outline"
          :to="ROUTES.auth.signIn"
          class="hidden lg:inline-flex"
        />

        <UButton
          label="Sign up"
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
      <template v-if="isAuthenticated && user">
        <div class="px-2.5 py-2 text-sm text-muted">
          Signed in as {{ user.email }}
        </div>
        <UButton
          label="Settings"
          color="neutral"
          variant="subtle"
          icon="i-lucide-settings"
          :to="ROUTES.settings.profile"
          block
          class="mb-3"
        />
        <UButton
          v-if="isGlobalAdmin"
          label="Admin Dashboard"
          color="neutral"
          variant="subtle"
          icon="i-lucide-shield"
          :to="ROUTES.admin.home"
          block
          class="mb-3"
        />
        <UButton
          label="Sign out"
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
          label="Sign in"
          color="neutral"
          variant="subtle"
          :to="ROUTES.auth.signIn"
          block
          class="mb-3"
        />
        <UButton
          label="Sign up"
          color="neutral"
          :to="ROUTES.auth.signUp"
          block
        />
      </template>
    </template>
  </UHeader>
</template>
