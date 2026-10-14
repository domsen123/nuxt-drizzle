import { defineEventHandler } from 'nuxt/server'

export default defineEventHandler((event) => {
  return {
    user: event.context.user,
    impersonation: event.context.impersonation ?? null,
  }
})
