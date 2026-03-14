import { beforeAll, afterAll } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Setup test database
let prisma: PrismaClient;

beforeAll(async () => {
  // Use a test database URL
  process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';

  prisma = new PrismaClient();
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});