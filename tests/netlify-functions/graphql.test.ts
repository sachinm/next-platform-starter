import { describe, expect, it, vi } from 'vitest';

vi.mock('graphql-yoga', () => ({
  createYoga: vi.fn(),
}));

vi.mock('../../shared/graphql/schema.js', () => ({
  schema: {},
}));

vi.mock('../../shared/graphql/context.js', () => ({
  buildContext: vi.fn(),
}));

describe('GraphQL Netlify Function', () => {
  it('returns a native Response even when Yoga returns a non-native Response', async () => {
    const { createYoga } = await import('graphql-yoga');

    // Mock Yoga to return a non-native Response (simulate undici or other impl)
    const mockYogaResponse = {
      status: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"data": "test"}',
      constructor: { name: 'UndiciResponse' }, // Simulate non-native Response
    };

    const mockYoga = {
      handleRequest: vi.fn().mockResolvedValue(mockYogaResponse),
    };

    createYoga.mockReturnValue(mockYoga);

    const { default: handler } = await import('../../netlify/functions/graphql');

    const request = new Request('http://localhost/graphql', { method: 'POST' });

    const response = await handler(request);

    // Verify it's a native Response
    expect(response).toBeInstanceOf(Response);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('application/json');

    const body = await response.text();
    expect(body).toBe('{"data": "test"}');
  });

  it('handles Yoga returning null gracefully', async () => {
    vi.resetAllMocks();

    const { createYoga } = await import('graphql-yoga');

    const mockYoga = {
      handleRequest: vi.fn().mockResolvedValue(null),
    };

    createYoga.mockReturnValue(mockYoga);

    // Re-import to get fresh module with new mock
    const { default: handler } = await import('../../netlify/functions/graphql');

    const request = new Request('http://localhost/graphql', { method: 'POST' });

    const response = await handler(request);

    expect(response.status).toBe(500);
    const body = await response.text();
    expect(body).toContain('Internal Server Error');
  });});