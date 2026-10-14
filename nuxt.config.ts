// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxtjs/seo',
    '@nuxt/image',
    '@nuxt/ui',
    // '@nuxt/content',
    '@vueuse/nuxt',
    '@pinia/nuxt',
    '@pinia/colada-nuxt',
    'nuxt-mcp-dev',
    '@nuxt/test-utils/module',
  ],

  devtools: {
    enabled: true,
  },

  // @nuxtjs/seo 6 bundles nuxt-ai-ready and nuxt-skew-protection and installs
  // both by default. AI Ready would publish /llms.txt plus a Markdown copy of
  // every page, and Skew Protection would keep assets from earlier builds and
  // poll the app manifest. Neither is wanted here, so keep them off. Set either
  // key to an options object to turn that module on.
  aiReady: false,
  skewProtection: false,

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

  // Nuxt 4.6 types the auto-imported `$fetch` through its own TypedFetch. With
  // this flag off, nitropack's global `$fetch` declaration wins in type
  // position, and resolving a path against 89 routes blows the instantiation
  // limit (TS2321) in .ts composables. See nuxt/nuxt#36474. Turning the flag on
  // routes everything through fetchdts, which type-checks cleanly and matches
  // the Nuxt 5 default. It also drops the `params` option from `useFetch` at
  // runtime, which this app does not use.
  experimental: {
    routeTypedFetch: true,
  },

  // Prerendering is off. Every route is server rendered, so no page ships with
  // a statically baked auth payload.
  prerender: {
    routes: [],
    crawlLinks: false,
    ignore: ['/'],
  },

  nitro: {
    // Rollup warns about code we do not own on every run: @vueuse/shared 14.4.0
    // puts `@__NO_SIDE_EFFECTS__` inside a JSDoc block, where Rollup cannot read
    // it (INVALID_ANNOTATION), @nuxt/nitro-server 4.6.1 imports h3's unused
    // `parseCookies` (UNUSED_EXTERNAL_IMPORT, dev server only), and Nitro plus
    // its modules pull in dozens of import cycles. Drop those for third-party
    // files, keep Nitro's remaining defaults, and let cycles inside server/
    // through so our own code stays visible.
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
  },
})
