// Uses Prisma only; no Supabase. Pass prisma as first argument.
import type { PrismaClient } from '@prisma/client';

export interface KundliRow {
  id: string;
  user_id: string;
  biodata: unknown;
  d1: unknown;
  d7?: unknown;
  d9: unknown;
  d10: unknown;
  charakaraka: unknown;
  vimsottari_dasa: unknown;
  other_readings: unknown;
  created_at: Date;
}

/** Get the latest kundli row for a user_id */
export async function fetchLatestKundliForUser(
  prisma: PrismaClient,
  userId: string
): Promise<KundliRow> {
  const row = await prisma.kundli.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  if (!row) throw new Error('No kundli found for this user.');
  return row as KundliRow;
}

/** Pretty-print helper for objects/arrays into readable text */
function toBlock(title: string, value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const body =
    typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  return `${title}:\n${body}`;
}

/** Turn a kundli row (with multiple JSONB columns) into text chunks for RAG */
export function kundliRowToChunks(row: KundliRow): string[] {
  const chunks: string[] = [];

  const tryPush = (title: string, v: unknown) => {
    const b = toBlock(title, v);
    if (b) chunks.push(b);
  };

  tryPush('Biodata', row.biodata);
  tryPush('Chart D1', row.d1);
  tryPush('Chart D7', row.d7);
  tryPush('Chart D9', row.d9);
  tryPush('Chart D10', row.d10);
  tryPush('Chara Karaka', row.charakaraka);
  tryPush('Vimsottari Dasa', row.vimsottari_dasa);
  tryPush('Other Readings', row.other_readings);

  chunks.unshift(
    `Kundli Meta:
user_id: ${row.user_id}
kundli_id: ${row.id}
created_at: ${row.created_at}`
  );

  return chunks;
}
