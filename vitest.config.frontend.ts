import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['frontend/tests/unit/**/*.test.tsx', 'components/**/*.test.tsx', 'app/**/*.test.tsx'],
    exclude: ['node_modules', 'shared', 'netlify'],
    setupFiles: ['tests/setup.frontend.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});