import type { OrchestratorLane } from "./types";

export interface OrchestratorSkill {
  id: string;
  name: string;
  description: string;
  goalTemplate: string;
  contextHint: string;
  lanes: Array<Exclude<OrchestratorLane, "judge">>;
  preferSupercomputer: boolean;
}

export const ORCHESTRATOR_SKILLS: OrchestratorSkill[] = [
  {
    id: "business-audit",
    name: "Full Business Audit",
    description: "Revenue, funnel, operations, marketing, risk and automation opportunities in one run.",
    goalTemplate:
      "Audit the business end to end. Find where revenue, conversions, time or margin are being lost; identify the highest-leverage fixes; and prepare approval-ready actions.",
    contextHint: "Add current revenue, conversion rates, products, campaign context, customer issues or operating constraints.",
    lanes: ["research", "analysis", "operations", "creative", "risk"],
    preferSupercomputer: true,
  },
  {
    id: "growth-lab",
    name: "Growth & Creative Lab",
    description: "Competitor/evidence analysis, offers, creative angles, experiments and campaign actions.",
    goalTemplate:
      "Find the strongest evidence-backed growth opportunities. Analyse current performance and competitors, create testable offers and creative directions, and prepare a prioritised experiment plan.",
    contextHint: "Add your offer, audience, current winners/losers, campaign metrics and brand rules.",
    lanes: ["research", "analysis", "creative", "operations", "risk"],
    preferSupercomputer: true,
  },
  {
    id: "production-readiness",
    name: "Production Readiness",
    description: "Architecture, deployment, reliability, security, integrations and rollback controls.",
    goalTemplate:
      "Audit the application for production readiness. Find broken routes, deployment risks, security gaps, incomplete integrations, observability gaps and the smallest safe fixes.",
    contextHint: "Add the repo/deployment area to focus on, recent errors, or release constraints.",
    lanes: ["research", "engineering", "operations", "risk"],
    preferSupercomputer: true,
  },
  {
    id: "evidence-deep-dive",
    name: "Evidence Deep Dive",
    description: "Separate evidence, inference and unknowns, then reconcile competing explanations.",
    goalTemplate:
      "Investigate this question deeply. Separate verified evidence from inference and unsupported claims, identify contradictions and missing evidence, and produce the strongest supported conclusion.",
    contextHint: "Paste the claim, source material, links, documents or competing explanations to examine.",
    lanes: ["research", "analysis", "risk"],
    preferSupercomputer: true,
  },
  {
    id: "automation-design",
    name: "Automation Designer",
    description: "Map a workflow into agents, integrations, approval gates, triggers and failure recovery.",
    goalTemplate:
      "Turn this workflow into a reliable automation. Identify triggers, specialist agents, tools, data sources, approval gates, retries, observability and rollback paths.",
    contextHint: "Describe the current manual workflow, systems involved, actions that may spend money/send messages/change data, and desired outcome.",
    lanes: ["analysis", "engineering", "operations", "risk"],
    preferSupercomputer: true,
  },
];

export function getOrchestratorSkill(id?: string | null) {
  if (!id) return null;
  return ORCHESTRATOR_SKILLS.find((skill) => skill.id === id) ?? null;
}
