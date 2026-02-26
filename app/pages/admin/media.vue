<script setup lang="ts">
import type { AdminMediaFile } from '~/features/admin/types/admin.types'
import AdminMediaDetail from '~/features/admin/components/AdminMediaDetail.vue'
import AdminMediaGrid from '~/features/admin/components/AdminMediaGrid.vue'
import AdminMediaUploadButton from '~/features/admin/components/AdminMediaUploadButton.vue'
import { useAdminMediaFiles } from '~/features/admin/composables/useAdminMediaFiles'

definePageMeta({
  layout: 'admin',
  middleware: ['admin'],
})

useSeoMeta({
  title: 'Media Library - Admin',
})

const {
  search,
  page,
  perPage,
  queryParams,
} = usePagination({
  defaultPerPage: 48,
  defaultSort: [{ key: 'createdAt', direction: 'desc' }],
})

const { files, total, isLoading } = useAdminMediaFiles(queryParams)

const selectedFile = ref<AdminMediaFile | null>(null)

const onSelectFile = (file: AdminMediaFile) => {
  selectedFile.value = selectedFile.value?.id === file.id ? null : file
}

const onDeleted = () => {
  selectedFile.value = null
}

const onCloseDetail = () => {
  selectedFile.value = null
}

// Keep selectedFile in sync if data refreshes
watch(files, (newFiles) => {
  if (selectedFile.value) {
    const updated = newFiles.find(f => f.id === selectedFile.value!.id)
    if (updated) {
      selectedFile.value = updated
    }
    else {
      selectedFile.value = null
    }
  }
})

const totalPages = computed(() => Math.ceil(total.value / perPage.value))
</script>

<template>
  <DashboardAdminPage title="Media Library">
    <div class="p-6">
      <div class="flex items-center gap-3 mb-6">
        <UInput
          v-model="search"
          icon="i-lucide-search"
          placeholder="Search files..."
          class="flex-1 max-w-sm"
        />
        <AdminMediaUploadButton />
      </div>

      <div class="flex gap-6">
        <div class="flex-1 min-w-0">
          <AdminMediaGrid
            :files="files"
            :selected-id="selectedFile?.id"
            :loading="isLoading"
            @select="onSelectFile"
          />

          <div v-if="totalPages > 1" class="mt-6 flex justify-center">
            <UPagination
              v-model="page"
              :total="total"
              :items-per-page="perPage"
            />
          </div>
        </div>

        <Transition
          enter-active-class="transition-all duration-200"
          enter-from-class="opacity-0 translate-x-4"
          enter-to-class="opacity-100 translate-x-0"
          leave-active-class="transition-all duration-150"
          leave-from-class="opacity-100 translate-x-0"
          leave-to-class="opacity-0 translate-x-4"
        >
          <div
            v-if="selectedFile"
            class="w-80 shrink-0 sticky top-6 self-start border border-default rounded-lg p-4 bg-default"
          >
            <AdminMediaDetail
              :file="selectedFile"
              @close="onCloseDetail"
              @deleted="onDeleted"
            />
          </div>
        </Transition>
      </div>
    </div>
  </DashboardAdminPage>
</template>
