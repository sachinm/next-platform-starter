import { describe, expect, it, vi } from 'vitest';

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: class {
      constructor() {
        throw new Error(
          '@prisma/client did not initialize yet. Please run "prisma generate" and try to import it again.'
        );
      }
    },
  };
});

describe('Prisma runtime guard', () => {
  it('throws a clear error when @prisma/client is not generated', async () => {
    vi.resetModules();

    await expect(import('./prisma')).rejects.toThrow(/Prisma Client is not generated yet/);
  });
});
