<script setup lang="ts">
const props = defineProps<{
  label: string
  icon: string
  value?: number | null
  loading?: boolean
}>()

const formattedValue = computed(() => {
  if (props.value === null || props.value === undefined)
    return '—'
  return new Intl.NumberFormat('en-US').format(props.value)
})
</script>

<template>
  <div class="flex flex-col gap-3 rounded-lg bg-elevated/50 ring ring-default p-5">
    <div class="flex items-center justify-between gap-2">
      <p class="truncate text-sm font-medium text-muted">
        {{ label }}
      </p>
      <span class="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring ring-inset ring-primary/20">
        <UIcon :name="icon" class="size-5" />
      </span>
    </div>

    <USkeleton v-if="loading" class="h-9 w-16" />
    <p v-else class="text-3xl font-semibold tabular-nums text-highlighted">
      {{ formattedValue }}
    </p>

    <div v-if="$slots.footer" class="mt-auto">
      <slot name="footer" />
    </div>
  </div>
</template>
