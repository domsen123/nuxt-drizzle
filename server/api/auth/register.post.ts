import { z } from 'zod'
import { setSessionCookie } from '../../features/auth/session.utils'
import { container } from '../../utils/container'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().optional(),
})

export default defineEventHandler(async (event) => {
  const result = await readValidatedBody(event, body => registerSchema.parse(body))

  const { email, password, name } = result

  const authResult = await container.authService.register(email, password, name)

  setSessionCookie(event, authResult.token, authResult.session.expiresAt)

  return {
    user: authResult.user,
  }
})
