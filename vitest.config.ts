import { resolve } from 'node:path'

import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

// Nuxt aliases for plain node tests. Vitest projects do not inherit the root
// `resolve` block, so the unit project carries its own copy. Vite matches
// aliases in order, so the longer prefix has to come first - otherwise
// `~~/shared/x` resolves against `~` and misses the file.
const alias = {
  '~~': resolve(import.meta.dirname, './'),
  '~': resolve(import.meta.dirname, './'),
}

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    projects: [
      {
        resolve: { alias },
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts', 'test/{e2e,unit}/*.{test,spec}.ts'],
          environment: 'node',
          setupFiles: ['./tests/setup.ts'],
          // Every file shares one database and truncates all tables after each
          // test. Run them one after another so no file wipes another's rows.
          fileParallelism: false,
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            // The Nuxt test environment runs without SSR, which nuxt-og-image
            // warns about on every run. It renders nothing here, so turn it off.
            nuxt: {
              overrides: {
                ogImage: { enabled: false },
              },
            },
          },
        },
      }),
    ],
  },
  resolve: { alias },
})
