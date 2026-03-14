import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as typeof globalThis & { prisma?: PrismaClient };

function createPrismaClient(): PrismaClient {
  try {
    return new PrismaClient();
  } catch (err) {
    if (err instanceof Error && err.message.includes('@prisma/client did not initialize')) {
      const schemaHint = 'backend/prisma/schema.prisma';
      const installHint = 'npm install && npm run postinstall';
      throw new Error(
        `Prisma Client is not generated yet. Run \`npx prisma generate --schema=${schemaHint}\` (or ${installHint}) and ensure the generated client is available under node_modules/.prisma/client.`
      );
    }
    throw err;
  }
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;