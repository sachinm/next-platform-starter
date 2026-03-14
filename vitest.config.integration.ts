import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/integration/**/*.test.ts'],
    exclude: ['node_modules'],
    env: {
      JWT_SECRET: 'test-jwt-secret-at-least-32-characters-long-for-integration',
      OPENAI_API_KEY: 'test-openai-key-not-used-in-integration-tests',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      ENCRYPTION_KEY: '12345678901234567890123456789012',
    },
    setupFiles: ['tests/setup.integration.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './shared'),
    },
  },
});