import { container } from '../utils/container'

export default defineNitroPlugin(() => {
  const eventBus = container.eventBus

  // Dev logging
  if (import.meta.dev) {
    eventBus.on('*', (type, payload) => {
      console.log(`[EventBus] ${String(type)}`, payload)
    })
  }
})
