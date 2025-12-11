<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AdminOrganisation } from '../types/admin.types'
import * as z from 'zod'

const props = defineProps<{
  organisation?: AdminOrganisation
}>()

const emit = defineEmits<{
  success: [organisation: AdminOrganisation]
  cancel: []
}>()

const NAME_MAX_LENGTH = 100
const SLUG_MAX_LENGTH = 50

const isEditMode = computed(() => !!props.organisation)
const slugManuallyEdited = ref(false)

const schema = z.object({
  name: z.string().trim().min(1, 'Organisation name is required').max(NAME_MAX_LENGTH, `Name must be ${NAME_MAX_LENGTH} characters or less`),
  slug: z.string().trim().min(1, 'URL slug is required').max(SLUG_MAX_LENGTH, `Slug must be ${SLUG_MAX_LENGTH} characters or less`).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  name: props.organisation?.name ?? '',
  slug: props.organisation?.slug ?? '',
})

// Character counts
const nameCharCount = computed(() => state.name.length)
const slugCharCount = computed(() => state.slug.length)
const nameCharRemaining = computed(() => NAME_MAX_LENGTH - nameCharCount.value)
const isNameNearLimit = computed(() => nameCharRemaining.value <= 20)

const generateSlug = (name: string): string =>
  name.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, SLUG_MAX_LENGTH)

watch(() => state.name, (newName) => {
  if (!isEditMode.value && !slugManuallyEdited.value) {
    state.slug = generateSlug(newName)
  }
})

const onSlugInput = () => {
  slugManuallyEdited.value = true
}

const resetSlugAutoGeneration = () => {
  slugManuallyEdited.value = false
  state.slug = generateSlug(state.name)
}

const { mutateAsync: createOrg, asyncStatus: createStatus, error: createError } = useCreateOrganisation()
const { mutateAsync: updateOrg, asyncStatus: updateStatus, error: updateError } = useUpdateOrganisation()

const isLoading = computed(() =>
  createStatus.value === 'loading' || updateStatus.value === 'loading',
)

const apiError = computed(() => {
  const err = (createError.value || updateError.value) as {
    statusCode?: number
    data?: { statusMessage?: string }
    message?: string
  } | null
  if (!err)
    return null
  if (err.statusCode === 409)
    return 'An organisation with this slug already exists. Please choose a different slug.'
  return err.data?.statusMessage || err.message || 'An unexpected error occurred. Please try again.'
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    const result = isEditMode.value
      ? await updateOrg({ id: props.organisation!.id, data: event.data })
      : await createOrg(event.data)
    emit('success', result.organisation)
  }
  catch {
    // Error is captured in refs
  }
}

// Preview URL
const previewUrl = computed(() => {
  if (!state.slug)
    return null
  return `app.example.com/${state.slug}`
})
</script>

<template>
  <div class="space-y-6">
    <!-- Header with context -->
    <div class="flex items-center gap-3 pb-2 border-b border-default">
      <div class="flex items-center justify-center size-10 rounded-lg bg-primary/10">
        <UIcon
          :name="isEditMode ? 'i-lucide-pencil' : 'i-lucide-building-2'"
          class="size-5 text-primary"
        />
      </div>
      <div>
        <h3 class="text-base font-semibold text-highlighted">
          {{ isEditMode ? 'Edit Organisation' : 'New Organisation' }}
        </h3>
        <p class="text-sm text-muted">
          {{ isEditMode ? 'Update the organisation details below' : 'Fill in the details to create a new organisation' }}
        </p>
      </div>
    </div>

    <!-- Error Alert with better styling -->
    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition duration-150 ease-in"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 -translate-y-1"
    >
      <UAlert
        v-if="apiError"
        color="error"
        variant="subtle"
        icon="i-lucide-alert-triangle"
        :title="apiError"
        :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
        class="animate-shake"
      />
    </Transition>

    <UForm
      :schema="schema"
      :state="state"
      class="space-y-5"
      @submit="onSubmit"
    >
      <!-- Name Field -->
      <UFormField
        label="Organisation Name"
        name="name"
        required
        :hint="isNameNearLimit ? `${nameCharRemaining} characters remaining` : undefined"
        :ui="{ hint: isNameNearLimit && nameCharRemaining <= 10 ? 'text-warning' : undefined }"
      >
        <template #description>
          <span class="text-dimmed">The display name for your organisation</span>
        </template>
        <UInput
          v-model="state.name"
          placeholder="Acme Corporation"
          icon="i-lucide-building"
          size="lg"
          :maxlength="NAME_MAX_LENGTH"
          autocomplete="organization"
        />
      </UFormField>

      <!-- Slug Field -->
      <UFormField
        label="URL Slug"
        name="slug"
        required
      >
        <template #description>
          <span class="text-dimmed">
            A unique identifier used in URLs
            <template v-if="!isEditMode && slugManuallyEdited">
              <span class="mx-1 text-muted">-</span>
              <button
                type="button"
                class="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1"
                @click="resetSlugAutoGeneration"
              >
                <UIcon name="i-lucide-refresh-cw" class="size-3" />
                Auto-generate
              </button>
            </template>
          </span>
        </template>
        <UInput
          v-model="state.slug"
          placeholder="acme-corp"
          icon="i-lucide-link"
          size="lg"
          :maxlength="SLUG_MAX_LENGTH"
          :disabled="isEditMode"
          @input="onSlugInput"
        >
          <template v-if="isEditMode" #trailing>
            <UTooltip text="Slug cannot be changed after creation">
              <UIcon name="i-lucide-lock" class="size-4 text-muted" />
            </UTooltip>
          </template>
        </UInput>
        <template #hint>
          <div class="flex items-center justify-between">
            <span class="text-xs text-dimmed">{{ slugCharCount }}/{{ SLUG_MAX_LENGTH }}</span>
          </div>
        </template>
      </UFormField>

      <!-- URL Preview -->
      <Transition
        enter-active-class="transition duration-200 ease-out"
        enter-from-class="opacity-0"
        enter-to-class="opacity-100"
        leave-active-class="transition duration-150 ease-in"
        leave-from-class="opacity-100"
        leave-to-class="opacity-0"
      >
        <div
          v-if="previewUrl"
          class="flex items-center gap-2 px-3 py-2 rounded-lg bg-elevated border border-muted"
        >
          <UIcon name="i-lucide-globe" class="size-4 text-muted shrink-0" />
          <span class="text-sm text-dimmed">Preview:</span>
          <code class="text-sm font-mono text-highlighted">{{ previewUrl }}</code>
        </div>
      </Transition>

      <!-- Divider -->
      <USeparator />

      <!-- Action Buttons -->
      <div class="flex items-center gap-3 justify-end pt-2">
        <UButton
          variant="ghost"
          color="neutral"
          size="lg"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          <template #leading>
            <UIcon name="i-lucide-x" class="size-4" />
          </template>
          Cancel
        </UButton>

        <UButton
          type="submit"
          size="lg"
          :loading="isLoading"
          :disabled="isLoading"
        >
          <template v-if="!isLoading" #leading>
            <UIcon :name="isEditMode ? 'i-lucide-save' : 'i-lucide-plus'" class="size-4" />
          </template>
          {{ isEditMode ? 'Save Changes' : 'Create Organisation' }}
        </UButton>
      </div>
    </UForm>
  </div>
</template>

<style scoped>
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
  20%, 40%, 60%, 80% { transform: translateX(2px); }
}

.animate-shake {
  animation: shake 0.5s ease-in-out;
}
</style>
