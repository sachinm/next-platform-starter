import { runRagQuery } from '../../shared/services/kundliService.js';
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
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const userId = getUserIdFromRequest(request);
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Authorization required' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { question } = body as { question?: string; userID?: string };
    if (!question) {
      return new Response(JSON.stringify({ error: 'question is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const user = await prisma.auth.findUnique({
      where: { id: userId },
      select: { id: true },
    });
    if (!user) {
      return new Response(JSON.stringify({ error: 'User not authorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { answer } = await runRagQuery(prisma, userId, question);

    return new Response(JSON.stringify({
      success: true,
      data: {
        answer,
        userID: userId,
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Error processing query:', err);
    return new Response(JSON.stringify({
      success: false,
      error: {
        message: 'Query failed.',
        details: (err as Error)?.message,
        timestamp: new Date().toISOString(),
      },
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}