// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/ui',
    // '@nuxt/content',
    '@vueuse/nuxt',
    'nuxt-og-image',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    'nuxt-mcp-dev',
    '@nuxt/test-utils/module',
  ],

  devtools: {
    enabled: true,
  },

  css: ['~/assets/css/main.css'],

  imports: {
    dirs: [
      'features/**/composables',
    ],
  },

  components: {
    dirs: ['~/components', {
      path: '~/features',
      pattern: '**/components/**/*.vue',
      pathPrefix: false,
    }],
  },

  // vite: {
  //   ssr: {
  //     external: ['sharp'],
  //   },
  // },

  vite: {
    build: {
      rollupOptions: {
        // Rolldown reports how much of the build ran inside plugin hooks. Since
        // prerendering is off the build is short enough that @nuxt/fonts alone
        // trips the threshold on every run. It says nothing about the code, so
        // turn the check off. Profile with `node --cpu-prof` when build time
        // actually matters.
        checks: { pluginTimings: false },
      },
    },
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    // Rollup warns about code we do not own on every build: @vueuse/shared
    // 14.4.0 puts `@__NO_SIDE_EFFECTS__` in a position Rollup cannot read
    // (INVALID_ANNOTATION), @nuxt/nitro-server 4.5.2 imports the unused type
    // `H3Event` as a value (UNUSED_EXTERNAL_IMPORT), and Nitro plus its modules
    // pull in dozens of import cycles. Drop those for third-party files, keep
    // Nitro's remaining defaults, and let cycles inside server/ through so our
    // own code stays visible.
    rollupConfig: {
      onwarn(warning, rollupWarn) {
        const source = `${warning.id ?? ''}${warning.exporter ?? ''}${warning.message}`
        const fromDependency = source.includes('node_modules') || source.includes('virtual:')

        if (warning.code === 'EVAL' || warning.message.includes('Unsupported source map comment'))
          return
        if (fromDependency && ['CIRCULAR_DEPENDENCY', 'INVALID_ANNOTATION', 'UNUSED_EXTERNAL_IMPORT'].includes(warning.code ?? ''))
          return

        rollupWarn(warning)
      },
    },

    experimental: {
      tasks: true,
    },
    scheduledTasks: {
      // Run cleanup daily at 3:00 AM
      '0 3 * * *': ['cleanup:tokens'],
      // Run content creator queue processing daily at 9:00 AM
      '0 9 * * *': ['content-creator:generate'],
    },
    prerender: {
      // Prerendering is off. Every route is server rendered, so no page ships
      // with a statically baked auth payload.
      routes: [],
      crawlLinks: false,
      ignore: ['/'],
    },
  },
})
