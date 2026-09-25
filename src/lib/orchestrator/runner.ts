import { planGoal } from "./planner";
import { specialistPrompt, specialistSystem, judgePrompt } from "./prompts";
import { runAbacusTask } from "./abacus";
import { runAiGatewayTask } from "./aiGateway";
import { runLocalModelTask } from "./localModel";
import { collectLiveContext } from "./context";
import { getOrchestratorSkill } from "./skills";
import type {
  EngineResult,
  OrchestratorLane,
  OrchestratorRunInput,
  OrchestratorRunResult,
  PlannedTask,
  ProposedAction,
} from "./types";

async function withEngine(
  lane: OrchestratorLane,
  args: {
    taskId: string;
    title: string;
    objective: string;
    goal: string;
    context: string;
    system: string;
    prompt: string;
    preferAbacus: boolean;
    useSupercomputer: boolean;
  },
): Promise<EngineResult> {
  const started = Date.now();
  const errors: string[] = [];

  if (args.preferAbacus && args.useSupercomputer) {
    try {
      const result = await runAbacusTask({
        taskId: args.taskId,
        lane,
        title: args.title,
        objective: args.objective,
        goal: args.goal,
        context: args.context,
      });
      if (result) {
        return {
          ok: true,
          engine: "abacus",
          text: result.text,
          durationMs: Date.now() - started,
        };
      }
    } catch (error) {
      errors.push(`Abacus: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  try {
    const gateway = await runAiGatewayTask({
      lane,
      system: args.system,
      prompt: args.prompt,
    });
    if (gateway) {
      return {
        ok: true,
        engine: "ai-gateway",
        model: gateway.model,
        text: gateway.text,
        durationMs: Date.now() - started,
      };
    }
  } catch (error) {
    errors.push(`AI Gateway: ${error instanceof Error ? error.message : String(error)}`);
  }

  try {
    const local = await runLocalModelTask({
      lane,
      system: args.system,
      prompt: args.prompt,
    });
    if (local) {
      return {
        ok: true,
        engine: "model-hub",
        model: local.model,
        provider: local.provider,
        text: local.text,
        durationMs: Date.now() - started,
      };
    }
  } catch (error) {
    errors.push(`Model Hub: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!args.preferAbacus && args.useSupercomputer) {
    try {
      const result = await runAbacusTask({
        taskId: args.taskId,
        lane,
        title: args.title,
        objective: args.objective,
        goal: args.goal,
        context: args.context,
      });
      if (result) {
        return {
          ok: true,
          engine: "abacus",
          text: result.text,
          durationMs: Date.now() - started,
        };
      }
    } catch (error) {
      errors.push(`Abacus fallback: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return {
    ok: false,
    engine: "none",
    text: "",
    error: errors.length ? errors.join(" | ") : "No AI engine is configured.",
    durationMs: Date.now() - started,
  };
}

function actionLines(report: string): { report: string; actions: ProposedAction[] } {
  const actions: ProposedAction[] = [];
  const kept: string[] = [];

  for (const line of report.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("ACTION|")) {
      kept.push(line);
      continue;
    }
    const [, kind, target, title, description, riskRaw] = trimmed.split("|");
    if (!kind || !target || !title || !description) continue;
    const risk = riskRaw === "high" || riskRaw === "medium" ? riskRaw : "low";
    actions.push({
      kind: kind.slice(0, 80),
      target: target.slice(0, 120),
      title: title.slice(0, 180),
      description: description.slice(0, 12_000),
      risk,
    });
  }

  return { report: kept.join("\n").trim(), actions: actions.slice(0, 10) };
}

function formatOutputs(tasks: Array<{ task: PlannedTask; result: EngineResult }>) {
  return tasks
    .map(({ task, result }) => {
      const header = `## ${task.title} [${result.engine}${result.model ? ` · ${result.model}` : ""}]`;
      return result.ok
        ? `${header}\n${result.text}`
        : `${header}\nFAILED: ${result.error || "Unknown error"}`;
    })
    .join("\n\n");
}

export async function runSuperOrchestrator(
  input: OrchestratorRunInput,
): Promise<OrchestratorRunResult> {
  const startedAt = new Date().toISOString();
  const skill = getOrchestratorSkill(input.skillId);
  const ownerContext = (input.context || "").slice(0, 15_000);
  const useSupercomputer = input.useSupercomputer !== false;
  const live = await collectLiveContext(input.goal, ownerContext);
  const context = [ownerContext, live.context].filter(Boolean).join("\n\n").slice(0, 30_000);
  const plan = planGoal(input.goal, context, skill?.lanes ?? []);

  const raw = await Promise.all(
    plan.map(async (task) => {
      const system = specialistSystem(task.lane);
      const prompt = specialistPrompt({
        goal: input.goal,
        context,
        title: task.title,
        objective: task.objective,
      });
      const result = await withEngine(task.lane, {
        taskId: task.id,
        title: task.title,
        objective: task.objective,
        goal: input.goal,
        context,
        system,
        prompt,
        preferAbacus: task.route === "abacus-preferred",
        useSupercomputer,
      });
      return { task, result };
    }),
  );

  const specialistOutputs = formatOutputs(raw);
  const judge = await withEngine("judge", {
    taskId: "judge",
    title: "Synthesis judge",
    objective: "Reconcile all specialist findings into the final operating plan.",
    goal: input.goal,
    context: `${context}\n\n${specialistOutputs}`.slice(0, 80_000),
    system: specialistSystem("judge"),
    prompt: judgePrompt({
      goal: input.goal,
      context,
      specialistOutputs,
    }),
    preferAbacus: useSupercomputer,
    useSupercomputer,
  });

  const parsed = actionLines(
    judge.ok
      ? judge.text
      : `# Orchestration completed with synthesis failure\n\n${specialistOutputs}\n\nSynthesis error: ${judge.error || "Unknown error"}`,
  );

  const tasks = raw.map(({ task, result }) => ({ ...task, result }));
  return {
    goal: input.goal,
    startedAt,
    completedAt: new Date().toISOString(),
    tasks,
    synthesis: judge,
    report: parsed.report,
    actions: parsed.actions,
    architecture: {
      abacusUsed: [...tasks.map((task) => task.result), judge].some((r) => r.engine === "abacus"),
      gatewayUsed: [...tasks.map((task) => task.result), judge].some((r) => r.engine === "ai-gateway"),
      modelHubUsed: [...tasks.map((task) => task.result), judge].some((r) => r.engine === "model-hub"),
      parallelTasks: tasks.length,
      liveConnectorsUsed: live.connectorsUsed,
      connectorFailures: live.failures,
    },
  };
}
