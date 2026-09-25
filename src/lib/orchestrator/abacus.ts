import type { OrchestratorLane } from "./types";

export function abacusConfigured() {
  return Boolean(process.env.ABACUS_SUPER_WORKER_URL);
}

export async function runAbacusTask(args: {
  taskId: string;
  lane: OrchestratorLane;
  title: string;
  objective: string;
  goal: string;
  context: string;
}): Promise<{ text: string; runId?: string | null } | null> {
  const url = process.env.ABACUS_SUPER_WORKER_URL;
  if (!url) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 115_000);

  try {
    const response = await fetch(url, {
      method: "POST",
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(process.env.ABACUS_WORKER_TOKEN
          ? { Authorization: `Bearer ${process.env.ABACUS_WORKER_TOKEN}` }
          : {}),
      },
      body: JSON.stringify({
        job: "mansa-super-task",
        version: 1,
        taskId: args.taskId,
        lane: args.lane,
        title: args.title,
        objective: args.objective,
        goal: args.goal,
        context: args.context.slice(0, 80_000),
      }),
    });

    if (!response.ok) {
      throw new Error(`Abacus worker failed with HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      result?: string;
      report?: string;
      runId?: string | null;
    };
    const text = (payload.result || payload.report || "").trim();
    if (!text) throw new Error("Abacus worker returned an empty result");
    return { text, runId: payload.runId };
  } finally {
    clearTimeout(timeout);
  }
}
