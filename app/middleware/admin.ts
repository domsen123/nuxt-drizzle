export default defineNuxtRouteMiddleware(async () => {
  const { isAuthenticated, status, refresh } = useSession()
  const toast = useToast()

  // Wait for session if pending
  if (status.value === 'pending') {
    await refresh()
  }

  // Must be authenticated first
  if (!isAuthenticated.value) {
    return navigateTo({
      path: ROUTES.auth.signIn,
      query: { redirect: ROUTES.admin.home },
    })
  }

  // Check admin permissions
  const { isGlobalAdmin, status: permStatus, refresh: refreshPerms } = usePermissions()

  // Wait for permissions if pending
  if (permStatus.value === 'pending') {
    await refreshPerms()
  }

  if (!isGlobalAdmin.value) {
    toast.add({
      title: 'Access Denied',
      description: 'You do not have permission to access the admin area.',
      color: 'error',
      icon: 'i-lucide-shield-x',
    })
    return navigateTo(ROUTES.start)
  }
})
