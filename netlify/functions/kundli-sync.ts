import { processKundliSyncQueue } from '../../shared/services/kundliQueueService.js';
import { prisma } from '../../shared/lib/prisma.js';

export default async function handler() {
  try {
    await processKundliSyncQueue(prisma);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Kundli sync failed:', err);
    return new Response(JSON.stringify({ success: false, error: (err as Error)?.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}