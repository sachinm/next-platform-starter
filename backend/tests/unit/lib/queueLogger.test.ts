import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { queueLog, queueLogError } from '../../../src/lib/queueLogger.js';

// Mock fs and path
vi.mock('fs', () => ({
  default: {
    existsSync: vi.fn(),
    mkdirSync: vi.fn(),
    appendFileSync: vi.fn(),
  },
}));

vi.mock('path', () => ({
  default: {
    isAbsolute: vi.fn(),
    join: vi.fn(),
    dirname: vi.fn(),
  },
}));

import fs from 'fs';
import path from 'path';

describe('queueLogger', () => {
  const mockExistsSync = vi.mocked(fs.existsSync);
  const mockMkdirSync = vi.mocked(fs.mkdirSync);
  const mockAppendFileSync = vi.mocked(fs.appendFileSync);
  const mockIsAbsolute = vi.mocked(path.isAbsolute);
  const mockJoin = vi.mocked(path.join);
  const mockDirname = vi.mocked(path.dirname);

  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.KUNDLI_QUEUE_LOG_FILE;
    delete process.env.KUNDLI_QUEUE_LOG_CONSOLE;

    // Mock path functions
    mockJoin.mockImplementation((...args) => args.join('/'));
    mockDirname.mockImplementation((p) => p.split('/').slice(0, -1).join('/') || '.');
    mockIsAbsolute.mockReturnValue(false);

    // Mock console
    consoleLogSpy = vi.fn();
    consoleErrorSpy = vi.fn();
    console.log = consoleLogSpy;
    console.error = consoleErrorSpy;
  });

  afterEach(() => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
  });

  describe('queueLog', () => {
    it('should write JSON log to default file path', () => {
      const payload = { event: 'test', user_id: '123' };
      const expectedLine = JSON.stringify(payload) + '\n';
      const defaultPath = 'logs/kundli-queue.log';

      mockExistsSync.mockReturnValue(true);
      mockJoin.mockReturnValue(defaultPath);

      queueLog(payload);

      expect(mockDirname).toHaveBeenCalledWith(defaultPath);
      expect(mockExistsSync).toHaveBeenCalledWith('logs');
      expect(mockAppendFileSync).toHaveBeenCalledWith(defaultPath, expectedLine);
    });

    it('should create directory if it does not exist', () => {
      const payload = { event: 'test' };
      const logPath = 'logs/kundli-queue.log';

      mockExistsSync.mockReturnValue(false);
      mockJoin.mockReturnValue(logPath);

      queueLog(payload);

      expect(mockMkdirSync).toHaveBeenCalledWith('logs', { recursive: true });
    });

    it('should use custom log file from environment', () => {
      process.env.KUNDLI_QUEUE_LOG_FILE = 'custom/log.txt';
      const payload = { event: 'test' };
      const expectedPath = 'custom/log.txt';

      mockExistsSync.mockReturnValue(true);
      mockJoin.mockReturnValue(expectedPath);

      queueLog(payload);

      expect(mockAppendFileSync).toHaveBeenCalledWith(expectedPath, expect.any(String));
    });

    it('should handle absolute path from environment', () => {
      process.env.KUNDLI_QUEUE_LOG_FILE = '/absolute/path/log.txt';

      mockIsAbsolute.mockReturnValue(true);
      mockExistsSync.mockReturnValue(true);

      queueLog({ event: 'test' });

      expect(mockJoin).not.toHaveBeenCalledWith(process.cwd(), '/absolute/path/log.txt');
    });

    it('should log to console when KUNDLI_QUEUE_LOG_CONSOLE is set', () => {
      process.env.KUNDLI_QUEUE_LOG_CONSOLE = '1';
      const payload = { event: 'test', data: 'value' };

      mockExistsSync.mockReturnValue(true);

      queueLog(payload);

      expect(consoleLogSpy).toHaveBeenCalledWith(JSON.stringify(payload));
    });

    it('should not log to console when KUNDLI_QUEUE_LOG_CONSOLE is not set', () => {
      const payload = { event: 'test' };

      mockExistsSync.mockReturnValue(true);

      queueLog(payload);

      expect(consoleLogSpy).not.toHaveBeenCalled();
    });

    it('should handle file write errors gracefully', () => {
      const payload = { event: 'test' };
      const error = new Error('Write failed');

      mockExistsSync.mockReturnValue(true);
      mockAppendFileSync.mockImplementation(() => { throw error; });

      // Should not throw
      expect(() => queueLog(payload)).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Queue log write failed:', error.message);
    });

    it('should handle complex payload objects', () => {
      const payload = {
        event: 'complex',
        nested: { data: [1, 2, 3] },
        timestamp: new Date('2024-01-01'),
      };

      mockExistsSync.mockReturnValue(true);

      queueLog(payload);

      const expectedLine = JSON.stringify(payload) + '\n';
      expect(mockAppendFileSync).toHaveBeenCalledWith(expect.any(String), expectedLine);
    });
  });

  describe('queueLogError', () => {
    it('should add level error and call queueLog', () => {
      const payload = { event: 'error_event', message: 'Something failed' };
      const expectedPayload = { ...payload, level: 'error' };

      mockExistsSync.mockReturnValue(true);

      queueLogError(payload);

      expect(mockAppendFileSync).toHaveBeenCalledWith(
        expect.any(String),
        JSON.stringify(expectedPayload) + '\n'
      );
    });

    it('should log to console when KUNDLI_QUEUE_LOG_CONSOLE is set', () => {
      process.env.KUNDLI_QUEUE_LOG_CONSOLE = '1';
      const payload = { event: 'error_event' };
      const expectedPayload = { ...payload, level: 'error' };

      mockExistsSync.mockReturnValue(true);

      queueLogError(payload);

      expect(consoleErrorSpy).toHaveBeenCalledWith(JSON.stringify(expectedPayload));
    });

    it('should handle file write errors gracefully', () => {
      const payload = { event: 'error_event' };
      const error = new Error('Write failed');

      mockExistsSync.mockReturnValue(true);
      mockAppendFileSync.mockImplementation(() => { throw error; });

      expect(() => queueLogError(payload)).not.toThrow();

      expect(consoleErrorSpy).toHaveBeenCalledWith('Queue log write failed:', error.message);
    });
  });
});