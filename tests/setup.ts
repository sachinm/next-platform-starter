import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Global test setup
let prisma: PrismaClient;

beforeAll(async () => {
  // Setup test environment variables
  process.env.JWT_SECRET = 'test-jwt-secret-at-least-32-characters-long';
  process.env.OPENAI_API_KEY = 'test-openai-key-not-used-in-tests';
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
  process.env.ENCRYPTION_KEY = '12345678901234567890123456789012';

  // Initialize Prisma for tests that need it
  prisma = new PrismaClient();
});

afterAll(async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
});