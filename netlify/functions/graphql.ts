import { createYoga } from 'graphql-yoga';
import { schema } from '../../shared/graphql/schema.js';
import { buildContext } from '../../shared/graphql/context.js';

const yoga = createYoga({
  schema,
  context: buildContext,
});

export default async function handler(request: Request) {
  const yogaResponse = await yoga.handleRequest(request, {});

  // Debug guard: Log the exact type and properties of Yoga's response
  // This helps identify why Netlify might reject it (e.g., not a native Response)
  console.log('Yoga response type:', typeof yogaResponse);
  console.log('Yoga response constructor:', yogaResponse?.constructor?.name);
  console.log('Yoga response status:', yogaResponse?.status);
  console.log('Yoga response headers type:', typeof yogaResponse?.headers);
  console.log('Yoga response body type:', typeof yogaResponse?.body);

  // If Yoga returns null/undefined, return a 500 instead of throwing.
  if (!yogaResponse) {
    console.error('Yoga returned null/undefined response');
    return new Response('Internal Server Error', { status: 500 });
  }

  // Netlify expects a native Web Fetch Response instance. Yoga may return a Response
  // from a different implementation (e.g., undici). Wrap into a native Response to
  // ensure Netlify accepts it.
  return new Response(yogaResponse.body, {
    status: yogaResponse.status,
    headers: yogaResponse.headers as Record<string, string>,
  });
}