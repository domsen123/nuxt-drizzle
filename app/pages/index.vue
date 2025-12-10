<script setup lang="ts">
const title = 'Welcome to our application'
const description = 'Discover the features and benefits of using our app.'

useSeoMeta({
  titleTemplate: '',
  title,
  ogTitle: title,
  description,
  ogDescription: description,
})
</script>

<template>
  <div>
    <UPageHero
      :title="title"
      :description="description"
    >
      <template #top>
        <HeroBackground />
      </template>
    </UPageHero>
  </div>
</template>
