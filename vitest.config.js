import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    include: ['test/unit/**/*.test.js'],
    environment: 'node',
    testTimeout: 20000
  }
})
