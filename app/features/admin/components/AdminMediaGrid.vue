<script setup lang="ts">
import type { AdminMediaFile } from '../types/admin.types'

defineProps<{
  files: AdminMediaFile[]
  selectedId?: string | null
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [file: AdminMediaFile]
}>()

const formatSize = (bytes: number) => {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
</script>

<template>
  <div>
    <div v-if="loading && files.length === 0" class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <div v-for="i in 12" :key="i" class="aspect-square rounded-lg bg-elevated animate-pulse" />
    </div>

    <div v-else-if="files.length === 0" class="flex flex-col items-center justify-center py-16 text-muted">
      <UIcon name="i-lucide-images" class="size-12 mb-3" />
      <p class="text-sm">
        No media files yet
      </p>
      <p class="text-xs mt-1">
        Upload images to get started
      </p>
    </div>

    <div v-else class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      <button
        v-for="file in files"
        :key="file.id"
        class="group relative aspect-square rounded-lg overflow-hidden border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        :class="selectedId === file.id ? 'border-primary ring-2 ring-primary' : 'border-default hover:border-primary/50'"
        @click="emit('select', file)"
      >
        <img
          :src="file.url"
          :alt="file.metadata?.alt || file.originalName"
          class="size-full object-cover"
          :style="file.metadata ? { objectPosition: `${file.metadata.focusX * 100}% ${file.metadata.focusY * 100}%` } : undefined"
          loading="lazy"
        >
        <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 translate-y-full group-hover:translate-y-0 transition-transform">
          <p class="text-white text-xs truncate">
            {{ file.originalName }}
          </p>
          <p class="text-white/70 text-xs">
            {{ formatSize(file.size) }}
          </p>
        </div>
      </button>
    </div>
  </div>
</template>
