import { createYoga } from 'graphql-yoga';
import { schema } from '../../shared/graphql/schema.js';
import { buildContext } from '../../shared/graphql/context.js';

const yoga = createYoga({
  schema,
  context: buildContext,
});

export default async function handler(request: Request) {
  const response = await yoga.handleRequest(request, {});
  return response;
}