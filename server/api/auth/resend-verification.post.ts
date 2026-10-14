import { createError, defineEventHandler } from 'nuxt/server'
import { requireAuth } from '../../features/auth/auth.guard'
import { container } from '../../utils/container'

export default defineEventHandler(async (event) => {
  const user = requireAuth(event)

  if (user.emailVerified) {
    return {
      success: true,
      message: 'Email is already verified.',
    }
  }

  const result = await container.authService.resendVerificationEmail(user.id)

  if (!result.success) {
    throw createError({
      status: 500,
      statusText: 'Failed to send verification email. Please try again later.',
    })
  }

  return {
    success: true,
    message: 'Verification email sent. Please check your inbox.',
  }
})
