import { describe, it, expect } from 'vitest';
import { validateLoginInput, validateSignUpInput } from '../../../src/lib/validators.js';

describe('validators', () => {
  describe('validateLoginInput', () => {
    it('should validate valid login input', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should reject missing username', () => {
      const input = {
        password: 'password123',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('should reject empty username', () => {
      const input = {
        username: '',
        password: 'password123',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Username is required');
      }
    });

    it('should reject missing password', () => {
      const input = {
        username: 'testuser',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('should reject empty password', () => {
      const input = {
        username: 'testuser',
        password: '',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required');
      }
    });

    it('should reject username too long', () => {
      const input = {
        username: 'a'.repeat(129),
        password: 'password123',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
    });

    it('should reject password too long', () => {
      const input = {
        username: 'testuser',
        password: 'a'.repeat(257),
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(false);
    });

    it('should handle extra fields gracefully', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        extra: 'field',
      };

      const result = validateLoginInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
        expect(result.data.password).toBe('password123');
        expect((result.data as any).extra).toBeUndefined();
      }
    });
  });

  describe('validateSignUpInput', () => {
    it('should validate valid signup input with all fields', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        place_of_birth: 'New York, USA',
        time_of_birth: '12:30:00',
        gender: 'male',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(input);
      }
    });

    it('should validate valid signup input with minimal required fields', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.username).toBe('testuser');
        expect(result.data.password).toBe('password123');
        expect(result.data.email).toBe('test@example.com');
        expect(result.data.date_of_birth).toBe('1990-01-01');
        expect(result.data.place_of_birth).toBeNull();
        expect(result.data.time_of_birth).toBeNull();
        expect(result.data.gender).toBeNull();
      }
    });

    it('should reject missing username', () => {
      const input = {
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Username is required');
      }
    });

    it('should reject password too short', () => {
      const input = {
        username: 'testuser',
        password: '12345',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password must be at least 6 characters');
      }
    });

    it('should reject invalid email', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'invalid-email',
        date_of_birth: '1990-01-01',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email');
      }
    });

    it('should reject missing date_of_birth', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Required');
      }
    });

    it('should reject empty date_of_birth', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '',
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Date of birth is required');
      }
    });

    it('should accept null optional fields', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        place_of_birth: null,
        time_of_birth: null,
        gender: null,
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.place_of_birth).toBeNull();
        expect(result.data.time_of_birth).toBeNull();
        expect(result.data.gender).toBeNull();
      }
    });

    it('should reject place_of_birth too long', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        place_of_birth: 'a'.repeat(513),
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
    });

    it('should reject time_of_birth too long', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        time_of_birth: 'a'.repeat(33),
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
    });

    it('should reject gender too long', () => {
      const input = {
        username: 'testuser',
        password: 'password123',
        email: 'test@example.com',
        date_of_birth: '1990-01-01',
        gender: 'a'.repeat(33),
      };

      const result = validateSignUpInput(input);

      expect(result.success).toBe(false);
    });
  });
});