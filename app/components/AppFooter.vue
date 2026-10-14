<script setup lang="ts">
import type { FooterColumn } from '@nuxt/ui'

const REPO_URL = 'https://github.com/domsen123/nuxt-drizzle'

const columns: FooterColumn[] = []
</script>

<template>
  <USeparator
    icon="i-simple-icons-nuxtdotjs"
    class="h-px"
  />

  <UFooter :ui="{ top: 'border-b border-default' }">
    <template #top>
      <UContainer>
        <UFooterColumns :columns="columns">
          <template #right>
          </template>
        </UFooterColumns>
      </UContainer>
    </template>

    <template #left>
      <p class="text-muted text-sm">
        {{ $t('common.footer.builtWith', { year: new Date().getFullYear() }) }}
      </p>
    </template>

    <div class="flex items-center gap-4 text-sm">
      <ULink
        :to="ROUTES.legal.privacyPolicy"
        class="text-muted hover:text-default"
      >
        {{ $t('common.footer.privacy') }}
      </ULink>
      <ULink
        :to="ROUTES.legal.imprint"
        class="text-muted hover:text-default"
      >
        {{ $t('common.footer.imprint') }}
      </ULink>
    </div>

    <template #right>
      <UButton
        :to="REPO_URL"
        target="_blank"
        icon="i-simple-icons-github"
        aria-label="GitHub"
        color="neutral"
        variant="ghost"
      />
    </template>
  </UFooter>
</template>
