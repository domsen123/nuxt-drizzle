<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { Team, UpdateTeamInput } from '../types/teams.types'
import { z } from 'zod'

const props = defineProps<{
  team: Team
  isLoading?: boolean
}>()

const emit = defineEmits<{
  submit: [data: UpdateTeamInput]
  delete: []
}>()

const schema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: props.team.name,
})

// Reset form when team changes
watch(() => props.team, (newTeam) => {
  state.name = newTeam.name
}, { deep: true })

const handleSubmit = (event: FormSubmitEvent<Schema>) => {
  emit('submit', event.data)
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
</script>

<template>
  <div class="space-y-6">
    <UForm :schema="schema" :state="state" class="space-y-4" @submit="handleSubmit">
      <UFormField label="Team Name" name="name" required>
        <UInput v-model="state.name" placeholder="Enter team name" class="max-w-md" />
      </UFormField>

      <div class="flex gap-2">
        <UButton type="submit" label="Save Changes" :loading="isLoading" />
      </div>
    </UForm>

    <UDivider />

    <div class="space-y-4">
      <h3 class="text-sm font-medium text-muted">
        Team Information
      </h3>
      <dl class="grid grid-cols-1 gap-4 sm:grid-cols-2 text-sm">
        <div>
          <dt class="text-muted">
            Team ID
          </dt>
          <dd class="font-mono text-xs mt-1">
            {{ team.id }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Created
          </dt>
          <dd class="mt-1">
            {{ formatDate(team.createdAt) }}
          </dd>
        </div>
        <div>
          <dt class="text-muted">
            Last Updated
          </dt>
          <dd class="mt-1">
            {{ formatDate(team.updatedAt) }}
          </dd>
        </div>
      </dl>
    </div>

    <UDivider />

    <div class="space-y-4">
      <h3 class="text-sm font-medium text-error">
        Danger Zone
      </h3>
      <UAlert
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        title="Delete Team"
        description="Permanently delete this team. This action cannot be undone and will remove all team members."
      >
        <template #actions>
          <UButton
            color="error"
            variant="outline"
            label="Delete Team"
            icon="i-lucide-trash-2"
            @click="emit('delete')"
          />
        </template>
      </UAlert>
    </div>
  </div>
</template>
