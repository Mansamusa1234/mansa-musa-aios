# Mansa Musa AI Clash Arena

This feature sends one user task to a field of competing AI systems, including both frontier/closed providers and configurable open models. A separate judge scores the successful responses and returns a stronger merged Mansa Musa AI answer.

## Routes

- User interface: `/arena`
- Server API: `POST /api/arena`

The route is protected by the existing Mansa Musa AI authentication and Arena rate limiter. Users must sign in before they can use it.

## Core contestants

- ChatGPT / OpenAI
- Grok / xAI
- Claude / Anthropic
- Gemini / Google
- Mistral
- Up to six additional open models through OpenRouter

## Required provider credentials

Add these only in Vercel Project Settings -> Environment Variables. Never paste secret keys into browser code or commit them to GitHub.

```bash
OPENAI_API_KEY=...
XAI_API_KEY=...
ANTHROPIC_API_KEY=...
GOOGLE_GENERATIVE_AI_API_KEY=...
MISTRAL_API_KEY=...
OPENROUTER_API_KEY=...
```

Optional model overrides:

```bash
OPENAI_ARENA_MODEL=gpt-5.1
OPENAI_JUDGE_MODEL=gpt-5.1
XAI_ARENA_MODEL=grok-4
ANTHROPIC_ARENA_MODEL=claude-sonnet-4-6
GEMINI_ARENA_MODEL=gemini-2.5-flash
MISTRAL_ARENA_MODEL=mistral-large-latest
```

## Adding open models

Use one Vercel environment variable containing comma-separated OpenRouter model IDs:

```bash
OPENROUTER_ARENA_MODELS=model-id-1,model-id-2,model-id-3
```

The server supports up to six OpenRouter contestants per Clash. This is deliberately configurable because open-model names and hosted versions change over time. Change the environment variable instead of rewriting application code.

Examples of model families you may choose to connect through a compatible hosted provider include Llama-family, Qwen-family, DeepSeek-family and other openly available models. Use the current model identifier shown by your provider rather than assuming an old identifier will still work.

## How the full stack works

1. Visitor creates an account using the existing `/register` flow.
2. User signs in.
3. User opens `/arena`.
4. The browser sends only the user's prompt to `/api/arena`.
5. The server verifies the authenticated session and rate limit.
6. The server calls the configured contestants concurrently.
7. API keys stay on the server and are never returned to the browser.
8. Each contestant response is shown separately with the actual model identifier.
9. Successful responses are sent to the judge.
10. The judge scores answers on merit without favoring closed or open models.
11. The winner and ordered scores are displayed.
12. The judge creates the Mansa Musa AI Ultimate Combined Answer from the strongest material.

## Vercel deployment checklist

1. Merge Pull Request #23 into `main` after build/test checks pass.
2. In Vercel, confirm the project is connected to `Mansamusa1234/mansa-musa-aios` and Production Branch is `main`.
3. Add the provider API keys you want to enable for Production and Preview.
4. Add `OPENROUTER_ARENA_MODELS` if you want additional open-model contestants.
5. Verify the existing database, authentication, Redis/rate-limit, Stripe and application environment variables already used by Mansa Musa AI.
6. Redeploy after environment-variable changes.
7. Create a normal test account through `/register`.
8. Sign in and open `/arena`.
9. Run a small test challenge and confirm configured contestants answer.
10. If a contestant is unavailable, check its API key, provider credits/billing and exact model identifier.

## Commercial rollout

A full Clash can be materially more expensive than an ordinary chat because it may call many candidate models plus a judge. Do not offer unlimited Clash requests on a low-cost plan without usage controls.

Recommended product design:

- Free: single-model chat plus a very small Clash trial.
- Pro: monthly Clash credits and larger single-model quotas.
- Business: higher Clash limits, team workspaces, agents and automation.
- Extra credit packs: users can buy additional Clash runs.

The Arena should ultimately debit credits based on the number and cost class of contestants actually used. Keep pricing and quotas configurable rather than hard-coded.

## Security rules

- Never expose provider keys through `NEXT_PUBLIC_*` variables.
- Never return provider credentials to the browser.
- Keep authentication, rate limiting and quota checks server-side.
- Apply provider-level spend alerts and application-level usage caps.
- Log usage metadata, not secrets.
- Treat all model output as untrusted input before allowing it to trigger tools or external actions.
- Do not let customers arbitrarily choose an unrestricted model ID unless you validate it against an allow-list.
