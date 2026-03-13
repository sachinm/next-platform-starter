import { fetchLatestKundliForUser, kundliRowToChunks } from '../../shared/kundli-rag.js';
import { prisma } from '../../shared/lib/prisma.js';
import jwt from 'jsonwebtoken';
import { getJwtSecret } from '../../shared/graphql/context.js';

function getUserIdFromRequest(request: Request): string | null {
  const authHeader = request.headers.get('Authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as {
      sub?: string;
      userId?: string;
    };
    return decoded.sub ?? decoded.userId ?? null;
  } catch {
    return null;
  }
}

export default async function handler(request: Request) {
  if (process.env.NODE_ENV === 'production') {
    return new Response(JSON.stringify({ success: false, error: 'Not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const url = new URL(request.url);
  const userId = url.pathname.split('/').pop(); // Assuming /debug/kundli/:user_id

  const authUserId = getUserIdFromRequest(request);
  if (!authUserId || authUserId !== userId) {
    return new Response(JSON.stringify({ error: 'Authorization required' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const row = await fetchLatestKundliForUser(prisma, userId);
    const chunks = kundliRowToChunks(row);
    return new Response(JSON.stringify({
      success: true,
      kundli_id: row.id,
      chunkCount: chunks.length,
      chunks,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ success: false, error: (e as Error).message }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}