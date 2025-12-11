<script setup lang="ts">
defineProps<{
  title: string
  value: string | number
  icon: string
  description?: string
}>()
</script>

<template>
  <UCard>
    <div class="flex items-center gap-4">
      <div class="p-3 rounded-lg bg-primary/10">
        <UIcon :name="icon" class="text-primary size-6" />
      </div>
      <div>
        <p class="text-sm text-muted">
          {{ title }}
        </p>
        <p class="text-2xl font-bold">
          {{ value }}
        </p>
        <p v-if="description" class="text-xs text-muted mt-1">
          {{ description }}
        </p>
      </div>
    </div>
  </UCard>
</template>
