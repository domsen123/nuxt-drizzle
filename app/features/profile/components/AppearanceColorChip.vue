<script setup lang="ts">
defineProps<{
  color: string
}>()
</script>

<template>
  <div class="inline-flex items-center justify-center shrink-0 size-5">
    <span
      class="rounded-full ring ring-bg bg-(--chip-light) dark:bg-(--chip-dark) size-2"
      :style="{
        '--chip-light': `var(--color-${color}-500)`,
        '--chip-dark': `var(--color-${color}-400)`,
      }"
    />
  </div>
</template>
