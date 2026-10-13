# Powerhouse Inventory

> Audited: 2026-10-13 | Environment: Cloud container (Linux) running against Mansamusa1234/mansa-musa-aios
>
> Note: This session runs in a cloud container. The Windows/Lenovo physical machine inventory
> must be completed locally. Items below reflect what is confirmed in this cloud session plus
> what can be inferred from repository configuration.

---

## Runtime / Core Tools

| Tool | Status | Version | Notes |
|---|---|---|---|
| Node.js | INSTALLED / WORKING | v22.22.0 | Active LTS |
| npm | INSTALLED / WORKING | 10.9.4 | v12 available but not required |
| Python | INSTALLED / WORKING | 3.11.17 | Used by backend agents |
| Docker | INSTALLED / WORKING | 29.8.2 | Available in container |
| Git | INSTALLED / WORKING | 2.43.0 | Authenticated to GitHub |
| gh (GitHub CLI) | INSTALLED / WORKING | present | Preconfigured for mansamusa1234/mansa-musa-aios |

---

## Next.js Application

| Item | Status | Notes |
|---|---|---|
| Build | WORKING | Compiles clean (warnings only — non-blocking) |
| TypeScript | WORKING | Zero TS errors in main source |
| ESLint | PARTIAL | 26 warnings, 7 errors — all in test file (tests/signup-checkout-repairs.test.cjs uses CJS require) |
| Tests | WORKING | 25/25 unit tests pass |
| npm audit | MANUAL ACTION REQUIRED | 14 vulns (11 high, 3 moderate) — mostly build tooling (braces, micromatch, sharp/librsvg) not runtime-critical auth/payment code |

---

## AI / LLM Providers

| Provider | Status | Config Key | Notes |
|---|---|---|---|
| Anthropic (Claude) | CONFIGURED | ANTHROPIC_API_KEY | Used in src/lib/anthropic.ts, chat route |
| OpenAI / Codex | NOT REQUIRED | OPENAI_API_KEY | Placeholder in .env.example; not wired in Next.js app |
| OpenRouter | CONFIGURED | OPENROUTER_API_KEY | Used in modelRouter for multi-model routing |
| Grok / xAI | CONFIGURED | XAI_API_KEY | Wired in model hub / AI Council |
| Gemini | CONFIGURED | GEMINI_API_KEY | Wired in model hub / AI Council |
| HeyGen | BROKEN | HEYGEN_API_KEY | HTTP 402 (credits exhausted) — PR #34 adds guard |
| Abacus | MANUAL ACTION REQUIRED | ABACUS_API_KEY | Referenced in PRs #25, #29 — keys not yet in production |

---

## Infrastructure / Deployment

| Service | Status | Notes |
|---|---|---|
| Vercel | CONFIGURED | vercel.json present; preview deploys working (PR #32 confirms preview URL) |
| Supabase / PostgreSQL | CONFIGURED | DATABASE_URL via env; Prisma schema complete |
| Render | NOT REQUIRED | render.yaml present but Vercel is primary |
| Docker Compose | CONFIGURED | docker-compose.yml present for local dev |

---

## Automation / Workflow

| Tool | Status | Notes |
|---|---|---|
| n8n | MANUAL ACTION REQUIRED | Referenced in docs but no active config found in repo; local instance status unknown |
| Metricool | MANUAL ACTION REQUIRED | Referenced in social distribution code; API key needed |
| ngrok | MANUAL ACTION REQUIRED | Previously used for MCP tunnelling; status unknown |

---

## ECC / ECG / Skills Systems

| System | Status | Notes |
|---|---|---|
| ECC (affaan-m/everything-claude-code) | NOT CONNECTED | Repo not cloned or installed in this session |
| ECG | NOT DISCOVERED | No local git remote, MCP config, or shell reference found in this repo |
| Replica Skill (Jakeschincariol/replica-skill) | NOT CONNECTED | Not installed; requires security review before enabling |
| Anthropic Skills (anthropics/skills) | PARTIAL | anthropic-skills loaded as session skills; not installed locally |
| Antigravity Awesome Skills (sickn33/antigravity-awesome-skills) | NOT CONNECTED | Not installed |

**ACTION REQUIRED:** Discover ECG by inspecting local Windows machine: `%USERPROFILE%\.claude\`, MCP configs, shell history, and installed app directories.

---

## Social / Publishing Connectors

| Platform | Status | Notes |
|---|---|---|
| Instagram | BROKEN | Token expired — MANUAL ACTION REQUIRED to refresh |
| Pinterest | BROKEN | Token expired — MANUAL ACTION REQUIRED |
| LinkedIn | NOT CONFIGURED | OAuth not completed |
| X (Twitter) | BROKEN | HTTP 401 — credentials invalid or credits exhausted; PR #34 adds guard |
| TikTok | MANUAL ACTION REQUIRED | Key present in .env.example; not verified |
| Facebook | MANUAL ACTION REQUIRED | Page token present in .env.example; not verified |
| Threads | MANUAL ACTION REQUIRED | Token present in .env.example; not verified |
| YouTube | NOT CONFIGURED | Not wired |

---

## Payment

| Item | Status | Notes |
|---|---|---|
| Stripe SDK | INSTALLED / WORKING | v18+ (see PR #32 which upgrades to 23.0.0) |
| Stripe checkout flow | WORKING | 25 unit tests pass covering checkout/webhook/entitlements |
| Stripe webhook | CONFIGURED | Endpoint logic verified; signature check in place |
| Stripe live keys | MANUAL ACTION REQUIRED | Verify production keys in Vercel env |

---

## Windows/Lenovo Local Inventory — MANUAL ACTION REQUIRED

The following must be audited on the physical machine:

```
DISCOVER ON LOCAL MACHINE:
[ ] Claude Code CLI version + config (~/.claude/)
[ ] MCP server configs (claude_desktop_config.json or equivalent)
[ ] Codex installation and version
[ ] Abacus SuperComputer — app version, API key, existing agents
[ ] OpenClaw — version, purpose, config
[ ] Parachute — version, purpose, config
[ ] Dora — identify exact service, version, config
[ ] ECG — search all of: git repos, MCP config, shell history, app dirs
[ ] n8n — version, running instance, port, existing workflows
[ ] ngrok — version, auth token, current tunnels
[ ] WSL distributions installed
[ ] Docker Desktop version + running containers
[ ] Any locally running backend services
```
