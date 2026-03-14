import { http, HttpResponse } from 'msw';

// Mock GraphQL responses
export const handlers = [
  http.post('/.netlify/functions/graphql', async ({ request }) => {
    const { query } = await request.json();

    if (query.includes('meDetails')) {
      return HttpResponse.json({
        data: {
          meDetails: {
            user_id: 'test-user-id',
            is_active: true,
            kundli_added: true,
          },
        },
      });
    }

    if (query.includes('login')) {
      return HttpResponse.json({
        data: {
          login: {
            success: true,
            token: 'mock-jwt-token',
            user: 'test-user',
            role: 'user',
          },
        },
      });
    }

    if (query.includes('signup')) {
      return HttpResponse.json({
        data: {
          signup: {
            success: true,
            token: 'mock-jwt-token',
            user: 'test-user',
            role: 'user',
          },
        },
      });
    }

    if (query.includes('ask')) {
      return HttpResponse.json({
        data: {
          ask: {
            success: true,
            answer: 'This is a mock AI response for testing.',
          },
        },
      });
    }

    return HttpResponse.json({ data: {} });
  }),

  http.post('/.netlify/functions/query', () => {
    return HttpResponse.json({
      success: true,
      answer: 'Mock RAG query response',
    });
  }),
];