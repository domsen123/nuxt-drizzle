<script setup lang="ts">
import type { AdminMediaFile } from '../types/admin.types'
import AdminMediaFocusPicker from './AdminMediaFocusPicker.vue'

const props = defineProps<{
  file: AdminMediaFile
}>()

const emit = defineEmits<{
  close: []
  deleted: [id: string]
}>()

const toast = useToast()
const { mutateAsync: updateMetadata, asyncStatus: saveStatus } = useUpdateMediaMetadata()
const { mutateAsync: deleteFile, asyncStatus: deleteStatus } = useDeleteMediaFile()

const form = reactive({
  alt: props.file.metadata?.alt ?? '',
  title: props.file.metadata?.title ?? '',
  description: props.file.metadata?.description ?? '',
  focusX: props.file.metadata?.focusX ?? 0.5,
  focusY: props.file.metadata?.focusY ?? 0.5,
})

watch(() => props.file, (newFile) => {
  form.alt = newFile.metadata?.alt ?? ''
  form.title = newFile.metadata?.title ?? ''
  form.description = newFile.metadata?.description ?? ''
  form.focusX = newFile.metadata?.focusX ?? 0.5
  form.focusY = newFile.metadata?.focusY ?? 0.5
})

const isSaving = computed(() => saveStatus.value === 'loading')
const isDeleting = computed(() => deleteStatus.value === 'loading')

const formatSize = (bytes: number) => {
  if (bytes < 1024)
    return `${bytes} B`
  if (bytes < 1024 * 1024)
    return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

const onFocusUpdate = (coords: { focusX: number, focusY: number }) => {
  form.focusX = coords.focusX
  form.focusY = coords.focusY
}

const onSave = async () => {
  try {
    await updateMetadata({
      id: props.file.id,
      data: {
        alt: form.alt || null,
        title: form.title || null,
        description: form.description || null,
        focusX: form.focusX,
        focusY: form.focusY,
      },
    })
    toast.add({ title: 'Metadata saved', color: 'success' })
  }
  catch {
    toast.add({ title: 'Failed to save metadata', color: 'error' })
  }
}

const onDelete = async () => {
  try {
    await deleteFile(props.file.id)
    toast.add({ title: 'File deleted', color: 'success' })
    emit('deleted', props.file.id)
  }
  catch {
    toast.add({ title: 'Failed to delete file', color: 'error' })
  }
}
</script>

<template>
  <div class="space-y-5">
    <div class="flex items-center justify-between">
      <h3 class="text-sm font-semibold truncate">
        {{ file.originalName }}
      </h3>
      <UButton
        icon="i-lucide-x"
        color="neutral"
        variant="ghost"
        size="xs"
        @click="emit('close')"
      />
    </div>

    <AdminMediaFocusPicker
      :src="file.url"
      :focus-x="form.focusX"
      :focus-y="form.focusY"
      @update="onFocusUpdate"
    />

    <div class="text-xs text-muted space-y-1">
      <p>{{ file.mimeType }} &middot; {{ formatSize(file.size) }}</p>
      <p>Uploaded {{ formatDate(file.createdAt) }}</p>
      <p>Focus: {{ form.focusX.toFixed(2) }}, {{ form.focusY.toFixed(2) }}</p>
    </div>

    <div class="space-y-3">
      <UFormField label="Alt text">
        <UInput v-model="form.alt" placeholder="Describe the image..." />
      </UFormField>

      <UFormField label="Title">
        <UInput v-model="form.title" placeholder="Image title..." />
      </UFormField>

      <UFormField label="Description">
        <UTextarea v-model="form.description" placeholder="Additional details..." :rows="3" />
      </UFormField>
    </div>

    <div class="flex gap-2">
      <UButton
        label="Save"
        icon="i-lucide-save"
        :loading="isSaving"
        class="flex-1"
        @click="onSave"
      />
      <UButton
        icon="i-lucide-trash-2"
        color="error"
        variant="soft"
        :loading="isDeleting"
        @click="onDelete"
      />
    </div>
  </div>
</template>
