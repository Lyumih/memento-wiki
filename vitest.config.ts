import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    passWithNoTests: false,
    projects: [
      {
        test: {
          name: 'memento',
          environment: 'node',
          include: ['src/memento/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'lib',
          environment: 'node',
          include: ['src/lib/**/*.test.ts'],
        },
      },
      {
        test: {
          name: 'widgets',
          environment: 'jsdom',
          include: ['src/widgets/**/*.test.{ts,tsx}'],
        },
      },
    ],
  },
})
