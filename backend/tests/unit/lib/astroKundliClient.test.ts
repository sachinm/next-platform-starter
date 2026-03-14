import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  authToAstroKundliParams,
  parseAstroKundliResponse,
  fetchHoroscopeChart,
  KUNDLI_JSON_FIELDS,
} from '../../../src/lib/astroKundliClient.js';

// Mock dependencies
vi.mock('../../src/config/env.js', () => ({
  getAstroKundliBaseUrl: vi.fn(),
  getAstroKundliApiKey: vi.fn(),
  isAstroKundliLogResponseEnabled: vi.fn(),
}));

vi.mock('../../src/lib/encrypt.js', () => ({
  decrypt: vi.fn(),
}));

vi.mock('../../src/lib/queueLogger.js', () => ({
  queueLog: vi.fn(),
}));

import { getAstroKundliBaseUrl, getAstroKundliApiKey, isAstroKundliLogResponseEnabled } from '../../../src/config/env.js';
import { decrypt } from '../../../src/lib/encrypt.js';
import { queueLog } from '../../../src/lib/queueLogger.js';

describe('astroKundliClient', () => {
  const mockGetBaseUrl = vi.mocked(getAstroKundliBaseUrl);
  const mockGetApiKey = vi.mocked(getAstroKundliApiKey);
  const mockIsLogEnabled = vi.mocked(isAstroKundliLogResponseEnabled);
  const mockDecrypt = vi.mocked(decrypt);
  const mockQueueLog = vi.mocked(queueLog);

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  describe('KUNDLI_JSON_FIELDS', () => {
    it('should contain expected fields', () => {
      expect(KUNDLI_JSON_FIELDS).toEqual([
        'biodata',
        'd1',
        'd7',
        'd9',
        'd10',
        'charakaraka',
        'vimsottari_dasa',
      ]);
    });
  });

  describe('authToAstroKundliParams', () => {
    it('should convert auth record to AstroKundli params with decrypted values', () => {
      const auth = {
        date_of_birth: 'enc:encrypted-dob',
        place_of_birth: 'enc:encrypted-place',
        time_of_birth: 'enc:encrypted-time',
      };

      mockDecrypt
        .mockReturnValueOnce('1990-01-01')
        .mockReturnValueOnce('New York, USA')
        .mockReturnValueOnce('12:30:00');

      const result = authToAstroKundliParams(auth);

      expect(result).toEqual({
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
        ayanamsa: 'LAHIRI',
      });
      expect(mockDecrypt).toHaveBeenCalledTimes(3);
    });

    it('should handle non-encrypted values', () => {
      const auth = {
        date_of_birth: '1990-01-01',
        place_of_birth: 'New York, USA',
        time_of_birth: '12:30:00',
      };

      mockDecrypt
        .mockReturnValueOnce('1990-01-01')
        .mockReturnValueOnce('New York, USA')
        .mockReturnValueOnce('12:30:00');

      const result = authToAstroKundliParams(auth);

      expect(result.dob).toBe('1990-01-01');
      expect(result.place).toBe('New York, USA');
      expect(result.tob).toBe('12:30:00');
    });

    it('should normalize DOB format from comma-separated', () => {
      const auth = {
        date_of_birth: '1990,01,01',
        place_of_birth: 'New York',
        time_of_birth: '12:30:00',
      };

      mockDecrypt
        .mockReturnValueOnce('1990,01,01')
        .mockReturnValueOnce('New York')
        .mockReturnValueOnce('12:30:00');

      const result = authToAstroKundliParams(auth);

      expect(result.dob).toBe('1990-01-01');
    });

    it('should normalize TOB format', () => {
      const auth = {
        date_of_birth: '1990-01-01',
        place_of_birth: 'New York',
        time_of_birth: '12:30',
      };

      mockDecrypt
        .mockReturnValueOnce('1990-01-01')
        .mockReturnValueOnce('New York')
        .mockReturnValueOnce('12:30');

      const result = authToAstroKundliParams(auth);

      expect(result.tob).toBe('12:30:00');
    });

    it('should handle missing time_of_birth', () => {
      const auth = {
        date_of_birth: '1990-01-01',
        place_of_birth: 'New York',
        time_of_birth: null,
      };

      mockDecrypt
        .mockReturnValueOnce('1990-01-01')
        .mockReturnValueOnce('New York')
        .mockReturnValueOnce(null);

      const result = authToAstroKundliParams(auth);

      expect(result.tob).toBe('00:00:00');
    });

    it('should handle empty place_of_birth', () => {
      const auth = {
        date_of_birth: '1990-01-01',
        place_of_birth: null,
        time_of_birth: '12:30:00',
      };

      mockDecrypt
        .mockReturnValueOnce('1990-01-01')
        .mockReturnValueOnce(null)
        .mockReturnValueOnce('12:30:00');

      const result = authToAstroKundliParams(auth);

      expect(result.place).toBe('Unknown');
    });

    it('should trim whitespace from decrypted values', () => {
      const auth = {
        date_of_birth: 'enc:encrypted-dob',
        place_of_birth: 'enc:encrypted-place',
        time_of_birth: 'enc:encrypted-time',
      };

      mockDecrypt
        .mockReturnValueOnce(' 1990-01-01 ')
        .mockReturnValueOnce(' New York, USA ')
        .mockReturnValueOnce(' 12:30:00 ');

      const result = authToAstroKundliParams(auth);

      expect(result.dob).toBe('1990-01-01');
      expect(result.place).toBe('New York, USA');
      expect(result.tob).toBe('12:30:00');
    });
  });

  describe('parseAstroKundliResponse', () => {
    it('should return data when response has no error', () => {
      const response = {
        type: 'biodata',
        data: { name: 'John', dob: '1990-01-01' },
      };

      const result = parseAstroKundliResponse(response);

      expect(result).toEqual({ name: 'John', dob: '1990-01-01' });
    });

    it('should throw error when response contains error', () => {
      const response = {
        type: 'biodata',
        error: 'Invalid date format',
        data: null,
      };

      expect(() => parseAstroKundliResponse(response)).toThrow('Invalid date format');
    });

    it('should handle response without type field', () => {
      const response = {
        data: { planets: [] },
      };

      const result = parseAstroKundliResponse(response);

      expect(result).toEqual({ planets: [] });
    });

    it('should handle null data', () => {
      const response = {
        type: 'chart',
        data: null,
      };

      const result = parseAstroKundliResponse(response);

      expect(result).toBeNull();
    });
  });

  describe('fetchHoroscopeChart', () => {
    const mockFetch = vi.mocked(fetch);
    let mockAbortController: any;

    beforeEach(() => {
      mockAbortController = {
        signal: {},
        abort: vi.fn(),
      };
      global.AbortController = vi.fn(() => mockAbortController);
      global.clearTimeout = vi.fn();
      global.setTimeout = vi.fn(() => 'timeout-id');
    });

    it('should fetch horoscope chart successfully', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };
      const type = 'biodata';
      const apiResponse = {
        type: 'biodata',
        data: { name: 'John' },
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue('test-api-key');
      mockIsLogEnabled.mockReturnValue(false);

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(apiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      const result = await fetchHoroscopeChart(params, type);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.astrokundli.com/api/export-horoscope',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer test-api-key',
            'X-API-Key': 'test-api-key',
          },
          body: JSON.stringify({
            dob: '1990-01-01',
            tob: '12:30:00',
            place: 'New York, USA',
            type: 'biodata',
            ayanamsa: 'LAHIRI',
          }),
          signal: mockAbortController.signal,
        }
      );
      expect(result).toEqual({ name: 'John' });
    });

    it('should handle API error response', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };
      const apiResponse = {
        error: 'Invalid date',
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(false);

      const mockResponse = {
        ok: false,
        status: 400,
        json: vi.fn().mockResolvedValue(apiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(fetchHoroscopeChart(params, 'biodata')).rejects.toThrow('Invalid date');
    });

    it('should handle network errors', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(false);

      mockFetch.mockRejectedValue(new Error('Network error'));

      await expect(fetchHoroscopeChart(params, 'biodata')).rejects.toThrow('Network error');
    });

    it('should timeout after 30 seconds', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(false);

      // Mock setTimeout to trigger abort
      const mockSetTimeout = vi.fn((cb) => {
        cb(); // Immediately call callback to simulate timeout
        return 'timeout-id';
      });
      global.setTimeout = mockSetTimeout;

      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      await expect(fetchHoroscopeChart(params, 'biodata')).rejects.toThrow();

      expect(mockAbortController.abort).toHaveBeenCalled();
    });

    it('should log response when logging is enabled', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };
      const apiResponse = {
        type: 'biodata',
        data: { name: 'John' },
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(true);

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(apiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await fetchHoroscopeChart(params, 'biodata');

      expect(mockQueueLog).toHaveBeenCalledWith({
        event: 'astrokundli_api_response',
        type: 'biodata',
        http_status: 200,
        response_preview: JSON.stringify(apiResponse),
        truncated: false,
      });
    });

    it('should truncate long responses in logs', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };
      const longData = 'x'.repeat(6000);
      const apiResponse = {
        type: 'biodata',
        data: { longField: longData },
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(true);

      const mockResponse = {
        ok: true,
        status: 200,
        json: vi.fn().mockResolvedValue(apiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await fetchHoroscopeChart(params, 'biodata');

      const logCall = mockQueueLog.mock.calls[0][0];
      expect(logCall.response_preview).toContain('...[truncated]');
      expect(logCall.truncated).toBe(true);
    });

    it('should handle API responses without standard error field', async () => {
      const params = {
        dob: '1990-01-01',
        tob: '12:30:00',
        place: 'New York, USA',
      };
      const apiResponse = {
        message: 'Custom error message',
      };

      mockGetBaseUrl.mockReturnValue('https://api.astrokundli.com');
      mockGetApiKey.mockReturnValue(null);
      mockIsLogEnabled.mockReturnValue(false);

      const mockResponse = {
        ok: false,
        status: 500,
        json: vi.fn().mockResolvedValue(apiResponse),
      };
      mockFetch.mockResolvedValue(mockResponse as any);

      await expect(fetchHoroscopeChart(params, 'biodata')).rejects.toThrow('Custom error message');
    });
  });
});