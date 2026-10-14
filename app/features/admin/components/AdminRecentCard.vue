<script setup lang="ts">
defineProps<{
  title: string
  icon: string
  viewAllTo: string
  loading?: boolean
  empty?: boolean
  emptyIcon: string
  emptyText: string
}>()
</script>

<template>
  <div class="flex flex-col overflow-hidden rounded-lg bg-elevated/50 ring ring-default">
    <div class="flex items-center justify-between border-b border-default px-4 py-3 sm:px-5">
      <div class="flex items-center gap-2.5">
        <span class="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary ring ring-inset ring-primary/20">
          <UIcon :name="icon" class="size-4" />
        </span>
        <h3 class="text-sm font-semibold text-highlighted">
          {{ title }}
        </h3>
      </div>
      <UButton
        :to="viewAllTo"
        label="View all"
        color="neutral"
        variant="ghost"
        size="xs"
        trailing-icon="i-lucide-arrow-right"
      />
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="divide-y divide-default">
      <div v-for="i in 3" :key="i" class="flex items-center gap-3 px-4 py-3 sm:px-5">
        <USkeleton class="size-9 rounded-full" />
        <div class="flex-1 space-y-1.5">
          <USkeleton class="h-3.5 w-32" />
          <USkeleton class="h-3 w-44" />
        </div>
      </div>
    </div>

    <!-- Empty state -->
    <div v-else-if="empty" class="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-12 text-center">
      <span class="flex size-12 items-center justify-center rounded-full bg-elevated text-dimmed">
        <UIcon :name="emptyIcon" class="size-6" />
      </span>
      <p class="text-sm text-muted">
        {{ emptyText }}
      </p>
      <slot name="empty-action" />
    </div>

    <!-- Rows -->
    <ul v-else role="list" class="divide-y divide-default">
      <slot />
    </ul>
  </div>
</template>
