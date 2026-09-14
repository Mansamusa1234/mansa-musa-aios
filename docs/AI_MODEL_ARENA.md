# Mansa Musa AI Council

This feature sends one user task to ChatGPT, Grok, Claude and Gemini in parallel. A separate judge then scores the successful responses and returns a stronger merged answer.

## Routes

- User interface: `/arena`
- Server API: `POST /api/arena`

The route is protected by the existing Mansa Musa AI authentication and Arena rate limiter. Users must sign in before they can use it.

## Required provider credentials

Add these only in Vercel Project Settings -> Environment Variables. Never paste secret keys into browser code or commit them to GitHub.

```bash
OPENAI_API_KEY=...
XAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Optional model overrides:

```bash
OPENAI_ARENA_MODEL=gpt-5.1
OPENAI_JUDGE_MODEL=gpt-5.1
XAI_ARENA_MODEL=grok-4
ANTHROPIC_ARENA_MODEL=claude-sonnet-4-6
GEMINI_ARENA_MODEL=gemini-2.5-flash
```

If a provider changes a model name, update only the corresponding environment variable; no code change is required.

## How the full stack works

1. Visitor creates an account using the existing `/register` flow.
2. User signs in.
3. User opens `/arena`.
4. The browser sends only the user's prompt to `/api/arena`.
5. The server verifies the authenticated session and rate limit.
6. The server calls OpenAI, xAI, Anthropic and Google concurrently.
7. API keys stay on the server and are never returned to the browser.
8. Each provider response is shown separately.
9. Successful provider responses are sent to a judge model.
10. The judge returns individual scores, a winner, a short rationale and the Mansa Musa AI combined answer.

## Vercel deployment checklist

1. Merge the AI Council pull request into `main`.
2. In Vercel, confirm the project is connected to `Mansamusa1234/mansa-musa-aios` and Production Branch is `main`.
3. Add all four API-key environment variables for Production, Preview and Development as needed.
4. Add or verify your existing database, auth, Redis/rate-limit and application variables used elsewhere by Mansa Musa AI.
5. Redeploy the project after adding variables.
6. Create a normal test account through `/register`.
7. Sign in and open `/arena`.
8. Run a small test prompt and confirm all configured providers answer.
9. If one provider shows unavailable, check that provider's API key, billing/credits and model environment variable.

## Before inviting paying users

The existing route now requires login and uses the existing Arena limiter. For a commercial rollout, also enforce plan-based quotas/credits before each multi-provider call, because one Council request can create five paid model calls: four candidate providers plus the judge. Store usage per user and charge Council requests at a higher credit cost than a single-model chat.

Recommended product tiers:

- Free: limited single-model messages; small AI Council trial allowance.
- Pro: larger monthly message quota and regular AI Council access.
- Business: higher limits, team/workspace features and priority models.

Keep actual quotas and pricing configurable rather than hard-coded, so provider-cost changes do not require a redeploy.

## Security rules

- Never expose provider keys through `NEXT_PUBLIC_*` variables.
- Never accept a provider API key from a customer browser unless you deliberately build a BYOK vault later.
- Keep authentication, rate limiting and quota checks on the server.
- Log usage metadata, not secrets.
- Apply spend alerts/limits in each provider account and in your own billing logic.
- Treat model output as untrusted input before performing actions on behalf of users.
