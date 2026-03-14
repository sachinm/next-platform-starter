import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['backend/tests/unit/**/*.test.ts', 'shared/**/*.test.ts', 'netlify/functions/**/*.test.ts'],
    exclude: ['node_modules', 'frontend', 'components', 'app'],
    env: {
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-for-unit-tests',
      OPENAI_API_KEY: 'test-openai-key-not-used-in-unit-tests',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ENCRYPTION_KEY: '12345678901234567890123456789012',
    },
    setupFiles: ['backend/tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './shared'),
    },
  },
});