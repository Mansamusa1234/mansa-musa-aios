# Cost Optimisation — AI tooling and app model spend

Audited 2026-10-14. "Verified" means checked on this machine or in this repo. No billing settings were changed, no credits purchased, no top-ups or spending limits altered.

## 1. Coding-agent setup

`CLAUDE.md` and `AGENTS.md` give every coding-agent session the stack, verification gate and rules up front, so agents don't re-discover the project by reading the codebase. Account and subscription settings are documented privately.

## 2. App production AI spend (Mansa Musa AI code)

Measured from the code, not from billing data. No Anthropic Admin API key or usage logs were available, so **no dollar baseline exists yet**.

### Already in place ✅
- Tiered routing by plan (`getModelForPlan`): Haiku for basic, Sonnet for pro, Opus for enterprise.
- 13 of the 14 files with a hard-coded Claude model use Haiku 4.5 (crons, receptionist, outreach, support). Workforce chat uses Sonnet 4.6. Arena, competition and model router choose models dynamically.
- Upstash rate limiters on chat, arena, public AI.

### Spend leaks fixed in this branch (PR #35)
| Leak | Fix | Commit |
|---|---|---|
| Free/lapsed owners kept a working AI receptionist (chat, voice, SMS), so we paid for Haiku calls on their behalf | Starter+ gate | 01372f5 |
| Any signed-in Free user had unlimited Claude Sonnet 4.6 calls via `/api/workforce/chat`, with no rate limit | Starter+ gate + per-user limiter + input caps | 0faa7e8 |

### Biggest remaining lever: models are a generation behind (owner decision)
Per-million-token list prices (Anthropic API, cached 2026-10-06):

| In use | $ in / out | Current successor | $ in / out | Change |
|---|---|---|---|---|
| `claude-haiku-4-5-20251001` (most calls) | 1.00 / 5.00 | `claude-haiku-5-5` | 0.10 / 0.50 | ~90% cheaper |
| `claude-sonnet-4-6` | 3.00 / 15.00 | `claude-sonnet-5-5` | 2.00 / 10.00 | ~33% cheaper |
| `claude-opus-4-8` | 5.00 / 25.00 | `claude-opus-5-5` | 4.00 / 20.00 | 20% cheaper |

The successors are both newer and cheaper, but they have API breaking changes: thinking defaults, no assistant prefill, no forced `tool_choice`, and a new tokenizer on the Opus line. So this is a migration, not an ID swap. **Recommended next step:** migrate the Haiku call sites first, behind a small eval of real prompts (receptionist, lead follow-up, outreach). That needs your approval, because evaluation runs spend real API credit.

### Prompt caching: deliberately not added yet
- The app's system prompts are small. C-suite prompts are ≤ ~300 tokens; the receptionist prompt is shorter.
- Minimum cacheable prefix: 4,096 tokens on Haiku 4.5, 1,024 on Sonnet 4.6, 512 on the 5.5 models. Below that, a cache marker silently does nothing.
- Caching would only pay off on long multi-turn chats (workforce, main chat) once history passes the minimum. After a model migration (512-token minimum), caching conversation history becomes worthwhile. Verify with `usage.cache_read_input_tokens`.

### Other providers in code (not audited for spend)
OpenAI (`gpt-4o`, `gpt-4o-mini`, `gpt-4.1`), Gemini (`gemini-2.5-pro`, `gemini-2.0-flash`), Grok (`grok-3`, `grok-4`), Mistral are used in Model Hub / Arena / model router. Several of these IDs are older generations too. Review them in the same migration pass.
