import { describe, it, expect, vi } from 'vitest';
import { hashPassword, comparePassword } from '../../../src/lib/hash.js';

// Mock bcryptjs
vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn(),
  },
}));

import bcrypt from 'bcryptjs';

describe('hash', () => {
  const mockHash = vi.mocked(bcrypt.hash);
  const mockCompare = vi.mocked(bcrypt.compare);

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      mockHash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(plainPassword);

      expect(mockHash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle empty password', async () => {
      const plainPassword = '';
      const hashedPassword = 'hashedEmpty';
      mockHash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(plainPassword);

      expect(mockHash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should handle special characters in password', async () => {
      const plainPassword = 'P@ssw0rd!#$%^&*()';
      const hashedPassword = 'hashedSpecial';
      mockHash.mockResolvedValue(hashedPassword);

      const result = await hashPassword(plainPassword);

      expect(mockHash).toHaveBeenCalledWith(plainPassword, 10);
      expect(result).toBe(hashedPassword);
    });

    it('should throw if bcrypt.hash throws', async () => {
      const error = new Error('Hash failed');
      mockHash.mockRejectedValue(error);

      await expect(hashPassword('password')).rejects.toThrow('Hash failed');
    });
  });

  describe('comparePassword', () => {
    it('should return true for matching passwords', async () => {
      const plainPassword = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      mockCompare.mockResolvedValue(true);

      const result = await comparePassword(plainPassword, hashedPassword);

      expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const plainPassword = 'wrongPassword';
      const hashedPassword = 'hashedPassword';
      mockCompare.mockResolvedValue(false);

      const result = await comparePassword(plainPassword, hashedPassword);

      expect(mockCompare).toHaveBeenCalledWith(plainPassword, hashedPassword);
      expect(result).toBe(false);
    });

    it('should handle empty passwords', async () => {
      mockCompare.mockResolvedValue(true);

      const result = await comparePassword('', '');

      expect(mockCompare).toHaveBeenCalledWith('', '');
      expect(result).toBe(true);
    });

    it('should throw if bcrypt.compare throws', async () => {
      const error = new Error('Compare failed');
      mockCompare.mockRejectedValue(error);

      await expect(comparePassword('password', 'hash')).rejects.toThrow('Compare failed');
    });
  });
});