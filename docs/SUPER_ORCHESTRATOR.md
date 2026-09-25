# Mansa Musa AI — Super Orchestrator

The Super Orchestrator is the control plane above the existing Model Hub, Agent Arena, Command Centre, Repo Intelligence and Abacus worker.

## Architecture

1. **Goal intake** — one owner goal plus optional context.
2. **Deterministic planner** — decomposes the goal into bounded specialist jobs.
3. **Parallel execution** — research, analysis, engineering, creative, operations and risk jobs run concurrently.
4. **Engine routing**:
   - Abacus Supercomputer first for heavy jobs when configured.
   - Vercel AI Gateway next when configured.
   - Existing Mansa Musa Model Hub as the local provider fallback.
5. **Judge / synthesis** — reconciles specialist outputs and contradictions.
6. **Approval boundary** — consequential external writes are converted into `ContentQueue` drafts.
7. **Report persistence** — final reports are saved in the existing `ExportedDocument` table.

No new database migration is required.

## Environment variables

### Abacus

```bash
ABACUS_SUPER_WORKER_URL="https://YOUR-ABACUS-HOST/task"
ABACUS_WORKER_TOKEN="same-shared-secret-as-MANSA_WORKER_TOKEN"
```

The existing Abacus FastAPI service now exposes both `/repo-intelligence` and `/task`.

### Vercel AI Gateway (optional)

```bash
AI_GATEWAY_API_KEY=""
AI_GATEWAY_MODEL_DEFAULT=""
AI_GATEWAY_MODEL_FAST=""
AI_GATEWAY_MODEL_RESEARCH=""
AI_GATEWAY_MODEL_REASONING=""
AI_GATEWAY_MODEL_CREATIVE=""
AI_GATEWAY_MODEL_JUDGE=""
```

Model IDs are intentionally configured through environment variables rather than hard-coded into the orchestrator, so model changes and retirements do not require a code deploy.

## Safety and control model

- Server-side credentials are never returned to the browser.
- External writes are drafts by default.
- `orchestrator_action` approvals are staged as APPROVED rather than falsely marked SENT.
- The initial UI/API is admin-only to control cost and operational risk.
- Each engine can fail independently; the router falls through to the next configured engine.
- The deterministic planner means the system can still explain its intended work even if every AI provider is temporarily unavailable.


## Live data fabric

The orchestrator can enrich a run with configured read-only connector data before specialist jobs start. It currently recognises relevant goals and selectively pulls from the existing connector registry rather than hitting every service on every run.

Native connector slots now include:

- Shopify Admin GraphQL — store and recent product snapshot
- Meta Marketing API — recent campaign-level performance snapshot
- Figma REST API — brand/design file structure
- Existing internal analytics, GOV.UK, RSS, crypto and other repository connectors

The Shopify, Meta and Figma adapters are read-only. They remain disabled until their server-side credentials are configured. External writes still flow through the Command Centre approval boundary.
