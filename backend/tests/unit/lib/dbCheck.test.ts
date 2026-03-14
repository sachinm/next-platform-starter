import { describe, it, expect, vi } from 'vitest';
import { checkDatabaseConnection } from '../../../src/lib/dbCheck.js';

// Mock prisma
vi.mock('../../src/lib/prisma.js', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}));

import { prisma } from '../../../src/lib/prisma.js';

describe('dbCheck', () => {
  const mockQueryRaw = vi.mocked(prisma.$queryRaw);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.DATABASE_URL;
  });

  describe('checkDatabaseConnection', () => {
    it('should succeed when database connection works', async () => {
      mockQueryRaw.mockResolvedValue([]);

      await expect(checkDatabaseConnection()).resolves.not.toThrow();
      expect(mockQueryRaw).toHaveBeenCalledWith('SELECT 1');
    });

    it('should throw when DATABASE_URL is missing', async () => {
      mockQueryRaw.mockRejectedValue(new Error('Environment variable not found: DATABASE_URL'));

      await expect(checkDatabaseConnection()).rejects.toThrow(
        'DATABASE_URL is not set. Add it to .env (see .env.example). Cannot start without a database.'
      );
    });

    it('should throw with custom error message when database is unreachable', async () => {
      const dbError = new Error('Connection refused');
      mockQueryRaw.mockRejectedValue(dbError);

      await expect(checkDatabaseConnection()).rejects.toThrow(
        'Database connection failed: Connection refused'
      );
    });

    it('should throw when queryRaw throws a generic error', async () => {
      const dbError = new Error('Some database error');
      mockQueryRaw.mockRejectedValue(dbError);

      await expect(checkDatabaseConnection()).rejects.toThrow(
        'Database connection failed: Some database error'
      );
    });

    it('should handle non-Error objects thrown by queryRaw', async () => {
      mockQueryRaw.mockRejectedValue('String error');

      await expect(checkDatabaseConnection()).rejects.toThrow(
        'Database connection failed: String error'
      );
    });

    it('should handle null/undefined thrown by queryRaw', async () => {
      mockQueryRaw.mockRejectedValue(null);

      await expect(checkDatabaseConnection()).rejects.toThrow(
        'Database connection failed: null'
      );
    });
  });
});