import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createLLMClient, getLLMClient, createJSONLLMClient } from '../../../src/lib/llmClient.js';

// Mock @langchain/openai
vi.mock('@langchain/openai', () => ({
  ChatOpenAI: vi.fn(),
}));

import { ChatOpenAI } from '@langchain/openai';

describe('llmClient', () => {
  const MockChatOpenAI = vi.mocked(ChatOpenAI);

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment
    delete process.env.OPENAI_API_KEY;
    delete process.env.OPENAI_MODEL;
    delete process.env.OPENAI_BASE_URL;
  });

  describe('createLLMClient', () => {
    it('should throw if OPENAI_API_KEY is not set', () => {
      expect(() => createLLMClient()).toThrow('OPENAI_API_KEY environment variable is required');
    });

    it('should create ChatOpenAI with default config', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockInstance = {};
      MockChatOpenAI.mockImplementation(() => mockInstance as any);

      const result = createLLMClient();

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
      });
      expect(result).toBe(mockInstance);
    });

    it('should use custom model from environment', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4';

      createLLMClient();

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4',
      });
    });

    it('should include baseURL when OPENAI_BASE_URL is set', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_BASE_URL = 'https://custom.openai.com';

      createLLMClient();

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        configuration: {
          baseURL: 'https://custom.openai.com',
        },
      });
    });

    it('should merge custom options with defaults', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const customOptions = {
        temperature: 0.5,
        maxTokens: 100,
      };

      createLLMClient(customOptions);

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        temperature: 0.5,
        maxTokens: 100,
      });
    });

    it('should override defaults with custom options', () => {
      process.env.OPENAI_API_KEY = 'test-key';
      process.env.OPENAI_MODEL = 'gpt-4';

      const customOptions = {
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
      };

      createLLMClient(customOptions);

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-3.5-turbo',
        temperature: 0.8,
      });
    });
  });

  describe('getLLMClient', () => {
    it('should create and cache LLM client', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockInstance = {};
      MockChatOpenAI.mockImplementation(() => mockInstance as any);

      const result1 = getLLMClient();
      const result2 = getLLMClient();

      expect(MockChatOpenAI).toHaveBeenCalledTimes(1);
      expect(result1).toBe(mockInstance);
      expect(result2).toBe(mockInstance);
    });

    it('should throw if OPENAI_API_KEY is not set', () => {
      expect(() => getLLMClient()).toThrow('OPENAI_API_KEY environment variable is required');
    });
  });

  describe('createJSONLLMClient', () => {
    it('should create LLM client with JSON response format', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      const mockInstance = {};
      MockChatOpenAI.mockImplementation(() => mockInstance as any);

      const result = createJSONLLMClient();

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
      });
      expect(result).toBe(mockInstance);
    });

    it('should accept custom temperature', () => {
      process.env.OPENAI_API_KEY = 'test-key';

      createJSONLLMClient(0.7);

      expect(MockChatOpenAI).toHaveBeenCalledWith({
        apiKey: 'test-key',
        model: 'gpt-4o-mini',
        temperature: 0.7,
        response_format: { type: 'json_object' },
      });
    });
  });
});