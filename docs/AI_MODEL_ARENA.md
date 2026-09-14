# AI Model Arena

Mansa Musa AI can send the same task to OpenAI and xAI/Grok in parallel, then use a separate judge model to score both answers and create a stronger merged result.

## Route

- UI: `/arena`
- API: `POST /api/arena`

## Required environment variables

Add these to your Vercel project environment variables:

```bash
OPENAI_API_KEY=...
XAI_API_KEY=...
```

Optional model overrides:

```bash
OPENAI_ARENA_MODEL=gpt-5.1
OPENAI_JUDGE_MODEL=gpt-5.1
XAI_ARENA_MODEL=grok-4
```

Do not expose API keys in browser code or commit them to GitHub. The API route runs server-side.

## Flow

1. User enters one task.
2. Server sends the task to OpenAI and xAI concurrently.
3. Both raw answers are displayed.
4. The judge receives the original task plus both answers.
5. The judge returns scores, winner, explanation, and a merged best answer.

## Production hardening

Before opening this route to the public, add authentication, per-user rate limits, usage logging, spend limits, and model allow-lists. The current implementation validates prompt presence and length but is intended as the first working internal version.
