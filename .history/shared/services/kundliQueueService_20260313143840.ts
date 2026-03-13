import type { PrismaClient } from '@prisma/client';
import {
  KUNDLI_JSON_FIELDS,
  type KundliJsonField,
  fetchHoroscopeChart,
  authToAstroKundliParams,
} from '../../lib/astroKundliClient.js';
import { getNodeEnv, getAstroKundliBaseUrl } from '../../config/env.js';
import { queueLog, queueLogError } from '../../lib/queueLogger.js';

const QUEUE_STATUS_PENDING = 'pending';
const QUEUE_STATUS_IN_PROGRESS = 'in_progress';
const QUEUE_STATUS_COMPLETED = 'completed';

/** Nominatim (OpenStreetMap) allows ~1 req/s. Delay between AstroKundli calls to avoid 400. */
const ASTROKUNDLI_MIN_DELAY_MS = 1100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Ensure the user has a Kundli row with queue_status = 'pending' so the queue worker will pick it up.
 * Call after login or signup. Creates a new Kundli row if none exists.
 */
export async function enqueueKundliSync(prisma: PrismaClient, userId: string): Promise<void> {
  const latest = await prisma.kundli.findFirst({
    where: { user_id: userId },
    orderBy: { created_at: 'desc' },
  });
  if (latest) {
    await prisma.kundli.update({
      where: { id: latest.id },
      data: { queue_status: QUEUE_STATUS_PENDING },
    });
    return;
  }
  await prisma.kundli.create({
    data: {
      user_id: userId,
      queue_status: QUEUE_STATUS_PENDING,
    },
  });
}

type Outcome = 'passed' | 'failed' | 'error';

/**
 * Returns true if the value is considered "filled" for a Kundli JSON column
 * (non-null and, for objects, non-empty).
 */
export function isJsonFieldFilled(value: unknown): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object' && !Array.isArray(value)) {
    return Object.keys(value as Record<string, unknown>).length > 0;
  }
  return true;
}

function logAstroKundliCall(
  userId: string,
  kundliId: string,
  field: KundliJsonField,
  outcome: Outcome,
  durationMs: number,
  errMessage?: string
): void {
  const env = getNodeEnv();
  const baseUrl = getAstroKundliBaseUrl();
  const payload: Record<string, unknown> = {
    event: 'astrokundli_call',
    user_id: userId,
    kundli_id: kundliId,
    field,
    outcome,
    duration_ms: durationMs,
    timestamp: new Date().toISOString(),
    env,
    base_url: baseUrl,
  };
  if (errMessage) payload.error_message = errMessage;
  queueLog(payload);
}

/**
 * Process one batch of Kundli rows with queue_status = 'pending'.
 * For each row: load Auth, set in_progress, fetch missing fields from AstroKundli one at a time,
 * update columns, then set completed and kundli_added only when all Kundli JSON fields
 * (biodata, d1, d7, d9, d10, charakaraka, vimsottari_dasa) have been pulled from AstroKundli.
 */
export async function processKundliSyncQueue(prisma: PrismaClient): Promise<void> {
  const pending = await prisma.kundli.findMany({
    where: { queue_status: QUEUE_STATUS_PENDING },
    orderBy: { created_at: 'asc' },
    take: 10,
    include: { user: true },
  });

  queueLog({ event: 'kundli_queue_tick_start', pending_count: pending.length });

  for (const row of pending) {
    const userId = row.user_id;
    const kundliId = row.id;

    try {
      await prisma.kundli.update({
        where: { id: kundliId },
        data: {
          queue_status: QUEUE_STATUS_IN_PROGRESS,
          queue_started_at: new Date(),
          last_sync_error: null,
        },
      });
    } catch (err) {
      queueLogError({
        event: 'kundli_queue_update_failed',
        kundli_id: kundliId,
        user_id: userId,
        error: (err as Error).message,
      });
      continue;
    }

    const auth = row.user;
    let params: ReturnType<typeof authToAstroKundliParams>;
    try {
      params = authToAstroKundliParams({
        date_of_birth: auth.date_of_birth,
        place_of_birth: auth.place_of_birth,
        time_of_birth: auth.time_of_birth,
      });
    } catch (err) {
      const msg = (err as Error).message;
      await prisma.kundli.update({
        where: { id: kundliId },
        data: {
          queue_status: QUEUE_STATUS_COMPLETED,
          queue_completed_at: new Date(),
          last_sync_error: msg,
        },
      });
      logAstroKundliCall(userId, kundliId, 'biodata', 'error', 0, msg);
      continue;
    }

    const updates: Partial<Record<KundliJsonField, unknown>> = {};
    for (const field of KUNDLI_JSON_FIELDS) {
      const current = row[field] as unknown;
      if (isJsonFieldFilled(current)) continue;

      await sleep(ASTROKUNDLI_MIN_DELAY_MS);

      const start = Date.now();
      let outcome: Outcome = 'passed';
      let errMessage: string | undefined;

      try {
        const data = await fetchHoroscopeChart(params, field);
        updates[field] = data;
      } catch (err) {
        outcome = (err as Error).message?.includes('HTTP') ? 'failed' : 'error';
        errMessage = (err as Error).message;
      }

      const durationMs = Date.now() - start;
      logAstroKundliCall(userId, kundliId, field, outcome, durationMs, errMessage);

      if (updates[field] !== undefined) {
        try {
          await prisma.kundli.update({
            where: { id: kundliId },
            data: { [field]: updates[field] as object },
          });
        } catch (updateErr) {
          logAstroKundliCall(
            userId,
            kundliId,
            field,
            'error',
            durationMs,
            (updateErr as Error).message
          );
        }
      }
    }

    const updatedRow = await prisma.kundli.findUnique({
      where: { id: kundliId },
      select: {
        biodata: true,
        d1: true,
        d7: true,
        d9: true,
        d10: true,
        charakaraka: true,
        vimsottari_dasa: true,
      },
    });
    const allFieldsFilled = updatedRow && KUNDLI_JSON_FIELDS.every(
      (field) => isJsonFieldFilled((updatedRow as Record<string, unknown>)[field])
    );

    if (allFieldsFilled) {
      await prisma.auth.update({
        where: { id: userId },
        data: { kundli_added: true },
      });
    }

    await prisma.kundli.update({
      where: { id: kundliId },
      data: {
        queue_status: QUEUE_STATUS_COMPLETED,
        queue_completed_at: new Date(),
      },
    });
  }
}