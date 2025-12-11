import mitt from 'mitt'

export interface CrudEventPayload<T = unknown> {
  tableName: string
  operation: 'created' | 'updated' | 'deleted'
  timestamp: Date
  data: T | T[]
  metadata?: {
    count?: number
    ids?: string[]
  }
}

export type CrudEventKey = `${string}:${'created' | 'updated' | 'deleted'}`

export type EventBusEvents = {
  [K in CrudEventKey]: CrudEventPayload
}

export type EventBus = ReturnType<typeof mitt<EventBusEvents>>

export const createEventBus = (): EventBus => mitt<EventBusEvents>()

export const buildEventKey = (
  tableName: string,
  operation: 'created' | 'updated' | 'deleted',
): CrudEventKey => `${tableName}:${operation}`
