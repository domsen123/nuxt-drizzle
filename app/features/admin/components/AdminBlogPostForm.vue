<script setup lang="ts">
import type { FormSubmitEvent } from '@nuxt/ui'
import type { AdminBlogPost } from '../types/admin.types'
import * as z from 'zod'

const props = defineProps<{
  post?: AdminBlogPost
}>()

const emit = defineEmits<{
  success: []
  cancel: []
}>()

const TITLE_MAX_LENGTH = 200
const SLUG_MAX_LENGTH = 200
const TEASER_MAX_LENGTH = 500

const isEditMode = computed(() => !!props.post)
const slugManuallyEdited = ref(false)

const schema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(TITLE_MAX_LENGTH),
  slug: z.string().trim().min(1, 'Slug is required').max(SLUG_MAX_LENGTH).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only'),
  teaser: z.string().trim().max(TEASER_MAX_LENGTH).default(''),
  content: z.string().trim().min(1, 'Content is required'),
  published: z.boolean().default(false),
  tagIds: z.array(z.string()).default([]),
})

type Schema = z.output<typeof schema>

const state = reactive<Schema>({
  title: props.post?.title ?? '',
  slug: props.post?.slug ?? '',
  teaser: props.post?.teaser ?? '',
  content: props.post?.content ?? '',
  published: props.post?.published ?? false,
  tagIds: props.post?.tags.map(t => t.id) ?? [],
})

const generateSlug = (title: string): string =>
  title.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, SLUG_MAX_LENGTH)

watch(() => state.title, (newTitle) => {
  if (!isEditMode.value && !slugManuallyEdited.value) {
    state.slug = generateSlug(newTitle)
  }
})

const onSlugInput = () => {
  slugManuallyEdited.value = true
}

const resetSlugAutoGeneration = () => {
  slugManuallyEdited.value = false
  state.slug = generateSlug(state.title)
}

// Fetch all tags for selection
const { tags: allTags } = useAdminBlogTags(() => ({ limit: 200 }))

const tagOptions = computed(() =>
  allTags.value.map(tag => ({
    label: tag.name,
    value: tag.id,
  })),
)

const { mutateAsync: createPost, asyncStatus: createStatus, error: createError } = useCreateBlogPost()
const { mutateAsync: updatePost, asyncStatus: updateStatus, error: updateError } = useUpdateBlogPost()

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
    return 'A post with this slug already exists. Please choose a different slug.'
  return err.data?.statusMessage || err.message || 'An unexpected error occurred. Please try again.'
})

const onSubmit = async (event: FormSubmitEvent<Schema>) => {
  try {
    if (isEditMode.value) {
      await updatePost({ id: props.post!.id, data: event.data })
    }
    else {
      await createPost(event.data)
    }
    emit('success')
  }
  catch {
    // Error captured in refs
  }
}
</script>

<template>
  <UForm
    id="blog-post-form"
    :schema="schema"
    :state="state"
    class="space-y-4"
    @submit="onSubmit"
  >
    <!-- Header Card -->
    <UPageCard
      :title="isEditMode ? 'Edit Post' : 'New Post'"
      :description="isEditMode ? 'Update the post details below.' : 'Fill in the details to create a new blog post.'"
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <div class="flex gap-2 lg:ms-auto">
        <UButton
          variant="ghost"
          color="neutral"
          :disabled="isLoading"
          @click="emit('cancel')"
        >
          Cancel
        </UButton>
        <UButton
          form="blog-post-form"
          type="submit"
          :loading="isLoading"
        >
          {{ isEditMode ? 'Save Changes' : 'Create Post' }}
        </UButton>
      </div>
    </UPageCard>

    <!-- Error Alert -->
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
        class="animate-shake"
      />
    </Transition>

    <!-- Form Fields Card -->
    <UPageCard variant="subtle">
      <!-- Title Field -->
      <UFormField
        name="title"
        label="Title"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-lg">
          <UInput
            v-model="state.title"
            placeholder="My Awesome Blog Post"
            :maxlength="TITLE_MAX_LENGTH"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Slug Field -->
      <UFormField
        name="slug"
        label="URL Slug"
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <template #description>
          <span>
            A unique identifier used in URLs.
            <template v-if="!isEditMode && slugManuallyEdited">
              <button
                type="button"
                class="text-primary hover:text-primary/80 transition-colors font-medium inline-flex items-center gap-1 ms-1"
                @click="resetSlugAutoGeneration"
              >
                <UIcon name="i-lucide-refresh-cw" class="size-3" />
                Auto-generate
              </button>
            </template>
          </span>
        </template>
        <div class="w-full max-w-lg">
          <UInput
            v-model="state.slug"
            placeholder="my-awesome-blog-post"
            :maxlength="SLUG_MAX_LENGTH"
            @input="onSlugInput"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Teaser Field -->
      <UFormField
        name="teaser"
        label="Teaser"
        description="A short summary shown in post listings."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-lg">
          <UTextarea
            v-model="state.teaser"
            placeholder="A brief description of this post..."
            :maxlength="TEASER_MAX_LENGTH"
            :rows="2"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Content Field -->
      <UFormField
        name="content"
        label="Content"
        description="Markdown supported."
        required
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-lg">
          <UTextarea
            v-model="state.content"
            placeholder="Write your post content here..."
            :rows="12"
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Tags Field -->
      <UFormField
        name="tagIds"
        label="Tags"
        description="Select tags for this post."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <div class="w-full max-w-lg">
          <USelectMenu
            v-model="state.tagIds"
            :items="tagOptions"
            value-key="value"
            multiple
            placeholder="Select tags..."
          />
        </div>
      </UFormField>

      <USeparator />

      <!-- Published Toggle -->
      <UFormField
        name="published"
        label="Published"
        description="Make this post visible to the public."
        class="flex max-sm:flex-col justify-between items-start gap-4"
      >
        <USwitch v-model="state.published" />
      </UFormField>
    </UPageCard>
  </UForm>
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
