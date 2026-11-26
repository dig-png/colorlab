import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

// База нужна для GitHub Pages: сайт живёт по адресу /colorlab/.
export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/colorlab/' : '/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts'],
      thresholds: { statements: 80, branches: 80, functions: 80, lines: 80 },
    },
  },
})
