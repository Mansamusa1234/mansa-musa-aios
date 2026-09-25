export type OrchestratorLane =
  | "research"
  | "analysis"
  | "engineering"
  | "creative"
  | "operations"
  | "risk"
  | "judge";

export type TaskRoute = "abacus-preferred" | "model-preferred";

export interface PlannedTask {
  id: string;
  lane: Exclude<OrchestratorLane, "judge">;
  title: string;
  objective: string;
  route: TaskRoute;
  complexity: "normal" | "heavy";
}

export interface EngineResult {
  ok: boolean;
  engine: "abacus" | "ai-gateway" | "model-hub" | "none";
  model?: string;
  provider?: string;
  text: string;
  error?: string;
  durationMs: number;
}

export interface TaskResult extends PlannedTask {
  result: EngineResult;
}

export interface ProposedAction {
  kind: string;
  target: string;
  title: string;
  description: string;
  risk: "low" | "medium" | "high";
}

export interface OrchestratorRunInput {
  goal: string;
  context?: string;
  useSupercomputer?: boolean;
}

export interface OrchestratorRunResult {
  goal: string;
  startedAt: string;
  completedAt: string;
  tasks: TaskResult[];
  synthesis: EngineResult;
  report: string;
  actions: ProposedAction[];
  architecture: {
    abacusUsed: boolean;
    gatewayUsed: boolean;
    modelHubUsed: boolean;
    parallelTasks: number;
    liveConnectorsUsed: string[];
    connectorFailures: Array<{ key: string; error: string }>;
  };
}
