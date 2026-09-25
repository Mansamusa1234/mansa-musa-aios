import type { PlannedTask } from "./types";

function has(text: string, pattern: RegExp) {
  return pattern.test(text.toLowerCase());
}

export function planGoal(goal: string, context = ""): PlannedTask[] {
  const text = `${goal}\n${context}`;
  const tasks: PlannedTask[] = [
    {
      id: "research",
      lane: "research",
      title: "Evidence & external intelligence",
      objective:
        "Identify the facts, evidence, assumptions, dependencies and missing information that matter to the goal. Separate verified inputs from inference.",
      route: "abacus-preferred",
      complexity: "heavy",
    },
    {
      id: "analysis",
      lane: "analysis",
      title: "Commercial & strategic analysis",
      objective:
        "Analyse the goal from a commercial, operational and decision-quality perspective. Find bottlenecks, leverage points, trade-offs and measurable outcomes.",
      route: "model-preferred",
      complexity: "normal",
    },
  ];

  if (
    has(text, /code|repo|github|vercel|api|app|website|software|stack|deploy|database|auth|security|integration|mcp|agent|model|supabase/)
  ) {
    tasks.push({
      id: "engineering",
      lane: "engineering",
      title: "Technical architecture",
      objective:
        "Design the smallest production-safe technical implementation, including architecture, integrations, failure modes, observability and deployment implications.",
      route: "abacus-preferred",
      complexity: "heavy",
    });
  }

  if (
    has(text, /ad|creative|brand|copy|campaign|social|video|image|marketing|landing|content|offer/)
  ) {
    tasks.push({
      id: "creative",
      lane: "creative",
      title: "Creative & growth",
      objective:
        "Develop high-quality creative and growth directions grounded in the supplied evidence. Produce testable concepts, not unsupported claims.",
      route: "model-preferred",
      complexity: "normal",
    });
  }

  if (
    has(text, /shopify|meta|stripe|crm|sales|customer|lead|email|calendar|business|store|conversion|revenue|workflow|automation/)
  ) {
    tasks.push({
      id: "operations",
      lane: "operations",
      title: "Operations & automation",
      objective:
        "Map the operational workflow, identify what can be automated safely, what needs human approval, and what should remain read-only.",
      route: "model-preferred",
      complexity: "normal",
    });
  }

  if (
    has(text, /publish|send|spend|budget|payment|delete|security|privacy|legal|customer|campaign|production|credential|token/)
  ) {
    tasks.push({
      id: "risk",
      lane: "risk",
      title: "Risk, security & controls",
      objective:
        "Review security, privacy, financial, reputational and operational risks. Specify approval gates and rollback controls for external actions.",
      route: "abacus-preferred",
      complexity: "heavy",
    });
  }

  return tasks.slice(0, 6);
}
