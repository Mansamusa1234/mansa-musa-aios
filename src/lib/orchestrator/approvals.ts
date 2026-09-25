import { db } from "@/lib/db";
import type { ProposedAction } from "./types";

export async function queueOrchestratorActions(args: {
  actions: ProposedAction[];
  goal: string;
  requestedBy: string;
}) {
  const actions = args.actions.slice(0, 10);
  if (!actions.length) return 0;

  await db.$transaction(
    actions.map((action) =>
      db.contentQueue.create({
        data: {
          type: "orchestrator_action",
          platform: action.target.slice(0, 100),
          title: action.title.slice(0, 180),
          content: action.description.slice(0, 12_000),
          metadata: JSON.stringify({
            source: "super-orchestrator",
            kind: action.kind,
            target: action.target,
            risk: action.risk,
            goal: args.goal.slice(0, 2000),
            requestedBy: args.requestedBy,
          }),
        },
      }),
    ),
  );

  return actions.length;
}
