<script setup lang="ts">
import type { MaybeRefOrGetter } from 'vue'
import { useAdminUserRoles } from '../composables/useAdminUserRoles'

const props = defineProps<{
  userId: MaybeRefOrGetter<string>
}>()

const { roles, status, error } = useAdminUserRoles(() => toValue(props.userId))

const isLoading = computed(() => status.value === 'pending')

// Human-readable permission names for global scope
const permissionNames: Record<string, string> = {
  'platform:admin': 'Platform Administrator',
  'organisation:create': 'Create Organisation',
}

const getPermissionName = (code: string): string => {
  return permissionNames[code] ?? code
}
</script>

<template>
  <div class="space-y-4">
    <h3 class="text-lg font-semibold">
      Global Roles & Permissions
    </h3>

    <div v-if="isLoading" class="flex items-center gap-2 text-muted">
      <UIcon name="i-lucide-loader-2" class="animate-spin size-4" />
      <span>Loading roles...</span>
    </div>

    <UAlert
      v-else-if="error"
      color="error"
      title="Failed to load roles"
      :description="error.message"
      icon="i-lucide-alert-circle"
    />

    <div v-else-if="roles.length === 0" class="text-muted">
      <p>No global roles assigned to this user.</p>
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="role in roles"
        :key="role.id"
        class="border border-default rounded-lg p-4"
      >
        <div class="flex items-center gap-2 mb-2">
          <UIcon name="i-lucide-shield" class="size-5 text-primary" />
          <span class="font-medium">{{ role.name }}</span>
          <UBadge v-if="role.isSystem" color="neutral" variant="subtle" size="xs">
            System
          </UBadge>
          <UBadge v-if="role.isDefault" color="primary" variant="subtle" size="xs">
            Default
          </UBadge>
        </div>

        <p v-if="role.description" class="text-sm text-muted mb-3">
          {{ role.description }}
        </p>

        <div v-if="role.permissions.length > 0" class="space-y-2">
          <p class="text-sm font-medium text-muted">
            Permissions:
          </p>
          <div class="flex flex-wrap gap-2">
            <UBadge
              v-for="perm in role.permissions"
              :key="perm.permission"
              color="primary"
              variant="soft"
              size="sm"
            >
              {{ getPermissionName(perm.permission) }}
            </UBadge>
          </div>
        </div>

        <p v-else class="text-sm text-muted italic">
          No permissions assigned to this role.
        </p>
      </div>
    </div>
  </div>
</template>
