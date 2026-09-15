import { createHash, randomUUID } from "crypto";
import { Redis } from "@upstash/redis";

const INCIDENT_TTL_SECONDS = 30 * 24 * 60 * 60;
const RECENT_KEY = "hospital:recent";
const INCIDENT_PREFIX = "hospital:incident:";
const ACTIVE_PREFIX = "hospital:active:";

const RECOVERABLE_CRONS = new Set([
  "/api/cron/agent-intelligence",
  "/api/cron/daily-report",
  "/api/cron/system-audit",
]);

export type IncidentStatus = "OPEN" | "RETRYING" | "RECOVERED" | "ESCALATED";
export type IncidentSeverity = "warning" | "critical";

export interface HospitalIncident {
  id: string;
  source: string;
  operation: string;
  message: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  attempts: number;
  maxAttempts: number;
  occurrences: number;
  retriable: boolean;
  createdAt: string;
  lastSeenAt: string;
  nextRetryAt: string;
  resolvedAt: string;
}

function createRedis(): Redis | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  return url && token ? new Redis({ url, token }) : null;
}

function clean(value: unknown, limit = 600): string {
  const text = value instanceof Error ? value.message : String(value);
  return text
    .replace(/(bearer|token|secret|password|api[-_ ]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, limit);
}

function fingerprint(source: string, operation: string): string {
  return createHash("sha256").update(`${source}:${operation}`).digest("hex").slice(0, 24);
}

function parseIncident(raw: Record<string, unknown> | null): HospitalIncident | null {
  if (!raw?.id) return null;
  return {
    id: String(raw.id),
    source: String(raw.source ?? "unknown"),
    operation: String(raw.operation ?? "unknown"),
    message: String(raw.message ?? "Unknown failure"),
    severity: raw.severity === "critical" ? "critical" : "warning",
    status: (["OPEN", "RETRYING", "RECOVERED", "ESCALATED"].includes(String(raw.status))
      ? String(raw.status)
      : "OPEN") as IncidentStatus,
    attempts: Number(raw.attempts ?? 0),
    maxAttempts: Number(raw.maxAttempts ?? 3),
    occurrences: Number(raw.occurrences ?? 1),
    retriable: raw.retriable === true || raw.retriable === "true" || raw.retriable === 1 || raw.retriable === "1",
    createdAt: String(raw.createdAt ?? ""),
    lastSeenAt: String(raw.lastSeenAt ?? ""),
    nextRetryAt: String(raw.nextRetryAt ?? ""),
    resolvedAt: String(raw.resolvedAt ?? ""),
  };
}

export function hospitalIsConfigured(): boolean {
  return Boolean(process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN);
}

export async function recordHospitalFailure(input: {
  source: string;
  operation: string;
  error: unknown;
  severity?: IncidentSeverity;
  retriable?: boolean;
  maxAttempts?: number;
}): Promise<string | null> {
  const redis = createRedis();
  if (!redis) {
    console.error(`[hospital] ${input.source}:${input.operation}`, clean(input.error));
    return null;
  }

  try {
    const fp = fingerprint(input.source, input.operation);
    const activeKey = `${ACTIVE_PREFIX}${fp}`;
    const existingId = await redis.get<string>(activeKey);
    const now = new Date();

    if (existingId) {
      const key = `${INCIDENT_PREFIX}${existingId}`;
      const current = parseIncident(await redis.hgetall<Record<string, unknown>>(key));
      if (current && current.status !== "RECOVERED") {
        await redis.hset(key, {
          message: clean(input.error),
          lastSeenAt: now.toISOString(),
          occurrences: current.occurrences + 1,
          severity: input.severity ?? current.severity,
        });
        await redis.expire(key, INCIDENT_TTL_SECONDS);
        return existingId;
      }
    }

    const id = randomUUID();
    const key = `${INCIDENT_PREFIX}${id}`;
    const retriable = input.retriable ?? RECOVERABLE_CRONS.has(input.operation);
    const incident: HospitalIncident = {
      id,
      source: clean(input.source, 80),
      operation: clean(input.operation, 160),
      message: clean(input.error),
      severity: input.severity ?? "warning",
      status: "OPEN",
      attempts: 0,
      maxAttempts: Math.min(Math.max(input.maxAttempts ?? 3, 1), 3),
      occurrences: 1,
      retriable,
      createdAt: now.toISOString(),
      lastSeenAt: now.toISOString(),
      nextRetryAt: new Date(now.getTime() + 15 * 60_000).toISOString(),
      resolvedAt: "",
    };

    await redis.hset(key, incident as unknown as Record<string, string | number | boolean>);
    await redis.expire(key, INCIDENT_TTL_SECONDS);
    await redis.set(activeKey, id, { ex: INCIDENT_TTL_SECONDS });
    await redis.lpush(RECENT_KEY, id);
    await redis.ltrim(RECENT_KEY, 0, 99);
    return id;
  } catch (error) {
    console.error("[hospital] could not persist incident", error);
    return null;
  }
}

async function updateIncident(redis: Redis, incident: HospitalIncident, data: Partial<HospitalIncident>) {
  await redis.hset(`${INCIDENT_PREFIX}${incident.id}`, data as unknown as Record<string, string | number | boolean>);
}

export async function getHospitalIncidents(limit = 50): Promise<HospitalIncident[]> {
  const redis = createRedis();
  if (!redis) return [];
  try {
    const ids = await redis.lrange<string>(RECENT_KEY, 0, Math.min(Math.max(limit, 1), 100) - 1);
    const uniqueIds = [...new Set(ids)];
    const incidents = await Promise.all(
      uniqueIds.map((id) => redis.hgetall<Record<string, unknown>>(`${INCIDENT_PREFIX}${id}`)),
    );
    return incidents.map(parseIncident).filter((incident): incident is HospitalIncident => Boolean(incident));
  } catch (error) {
    console.error("[hospital] could not read incidents", error);
    return [];
  }
}

export async function recoverHospitalIncidents(limit = 1): Promise<{
  attempted: number;
  recovered: number;
  escalated: number;
}> {
  const redis = createRedis();
  if (!redis) return { attempted: 0, recovered: 0, escalated: 0 };

  const now = new Date();
  const incidents = (await getHospitalIncidents(100))
    .filter((incident) =>
      incident.retriable &&
      (incident.status === "OPEN" || incident.status === "RETRYING") &&
      incident.attempts < incident.maxAttempts &&
      new Date(incident.nextRetryAt).getTime() <= now.getTime() &&
      RECOVERABLE_CRONS.has(incident.operation),
    )
    .slice(0, Math.min(Math.max(limit, 1), 2));

  let recovered = 0;
  let escalated = 0;
  const baseUrl = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com").replace(/\/$/, "");

  for (const incident of incidents) {
    const attempts = incident.attempts + 1;
    await updateIncident(redis, incident, { status: "RETRYING", attempts, lastSeenAt: now.toISOString() });

    try {
      const response = await fetch(`${baseUrl}${incident.operation}`, {
        headers: {
          authorization: `Bearer ${process.env.CRON_SECRET ?? ""}`,
          "x-hospital-incident": incident.id,
        },
        cache: "no-store",
        signal: AbortSignal.timeout(25_000),
      });
      if (!response.ok) throw new Error(`Recovery returned HTTP ${response.status}`);

      const resolvedAt = new Date().toISOString();
      await updateIncident(redis, incident, { status: "RECOVERED", resolvedAt, lastSeenAt: resolvedAt });
      await redis.del(`${ACTIVE_PREFIX}${fingerprint(incident.source, incident.operation)}`);
      recovered += 1;
    } catch (error) {
      const exhausted = attempts >= incident.maxAttempts;
      const delayMinutes = 15 * 2 ** attempts;
      await updateIncident(redis, incident, {
        status: exhausted ? "ESCALATED" : "OPEN",
        message: clean(error),
        nextRetryAt: new Date(Date.now() + delayMinutes * 60_000).toISOString(),
        lastSeenAt: new Date().toISOString(),
      });
      if (exhausted) escalated += 1;
    }
  }

  return { attempted: incidents.length, recovered, escalated };
}
