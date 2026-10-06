# Mansa Musa AI — Market Gap Intelligence Worker

This worker runs the heavy research step for the reusable Market Gap / Competitor Intelligence feature.

## What it does

- Uses Abacus RouteLLM Responses API with the built-in `web_search` tool when available.
- Researches competitors, customer demand signals, business-scale evidence, YouTube/social visibility, pricing, gaps and MVP opportunities.
- Forces evidence labelling so estimates and proxies are not presented as verified revenue or market share.
- Returns a Markdown report to the Mansa Musa AI Next.js app.

## Endpoints

- `GET /health`
- `POST /market-gap`

## Environment variables

```bash
ABACUS_API_KEY=
MANSA_WORKER_TOKEN=
ABACUS_RESEARCH_MODEL=gpt-5.5
ABACUS_RESPONSES_URL=https://routellm.abacus.ai/v1/responses
ABACUS_CHAT_URL=https://routellm.abacus.ai/v1/chat/completions
```

Set the same shared secret as `ABACUS_WORKER_TOKEN` in Vercel.

## Run

```bash
uvicorn server:app --host 0.0.0.0 --port 8080
```

The app-side environment variable should point to:

```bash
ABACUS_MARKET_GAP_WORKER_URL=https://YOUR-WORKER/market-gap
```

## Evidence rules

The worker is instructed to:
- distinguish verified facts, estimates and proxies;
- include source URLs and access dates for current claims;
- avoid claiming that a company is "doing the most business" unless reliable revenue or transaction evidence exists;
- use audience size, views, traffic, funding, app rankings or similar only as labelled proxies;
- identify gaps as hypotheses until validated by customer behaviour.
