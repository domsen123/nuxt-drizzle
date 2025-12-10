import { resolve } from 'node:path'

import { defineVitestProject } from '@nuxt/test-utils/config'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    testTimeout: 30000,
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tests/**/*.test.ts', 'test/{e2e,unit}/*.{test,spec}.ts'],
          environment: 'node',
          setupFiles: ['./tests/setup.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['test/nuxt/*.{test,spec}.ts'],
          environment: 'nuxt',
        },
      }),
    ],
  },
  resolve: {
    alias: {
      '~': resolve(__dirname, './'),
      '~~': resolve(__dirname, './'),
    },
  },
})
