export default defineNuxtRouteMiddleware(async (to) => {
  // Skip middleware for auth pages
  if (to.path.startsWith('/auth/')) {
    return
  }

  // Check if route requires auth (defined in page meta)
  const requiresAuth = to.meta.auth === true

  if (!requiresAuth) {
    return
  }

  // Get session - this will use cached data if available
  const { isAuthenticated, status, refresh } = useSession()

  // If query hasn't loaded yet, wait for it
  if (status.value === 'pending') {
    await refresh()
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated.value) {
    return navigateTo({
      path: ROUTES.auth.signIn,
      query: { redirect: to.fullPath },
    })
  }
})
