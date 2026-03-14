import { describe, it, expect, vi, beforeEach } from 'vitest';
import { encrypt, decrypt } from '../../../src/lib/encrypt.js';

// Mock crypto
vi.mock('crypto', () => ({
  default: {
    randomBytes: vi.fn(),
    createCipheriv: vi.fn(),
    createDecipheriv: vi.fn(),
  },
}));

import crypto from 'crypto';

describe('encrypt', () => {
  const mockRandomBytes = vi.mocked(crypto.randomBytes);
  const mockCreateCipheriv = vi.mocked(crypto.createCipheriv);
  const mockCreateDecipheriv = vi.mocked(crypto.createDecipheriv);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.ENCRYPTION_KEY;
  });

  describe('encrypt', () => {
    it('should return null for null input', () => {
      const result = encrypt(null);
      expect(result).toBeNull();
    });

    it('should return null for undefined input', () => {
      const result = encrypt(undefined);
      expect(result).toBeNull();
    });

    it('should return null for empty string input', () => {
      const result = encrypt('');
      expect(result).toBeNull();
    });

    it('should return plaintext if ENCRYPTION_KEY is not set', () => {
      const plaintext = 'test data';
      const result = encrypt(plaintext);
      expect(result).toBe(plaintext);
    });
  });

  describe('decrypt', () => {
    it('should return null for null input', () => {
      const result = decrypt(null);
      expect(result).toBeNull();
    });

    it('should return plaintext if not prefixed with "enc:"', () => {
      const plaintext = 'not encrypted';
      const result = decrypt(plaintext);
      expect(result).toBe(plaintext);
    });
  });
});