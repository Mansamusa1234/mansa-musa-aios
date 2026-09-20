# Mansa Musa AI — Abacus Repo Intelligence Worker

This worker runs on the same Abacus Supercomputer account used by the wider Mansa Musa AI stack. It receives a sanitised repository context from the authenticated Vercel backend and performs the heavier codebase audit through Abacus RouteLLM.

## Endpoints

- GET /health — authenticated worker health check when MANSA_WORKER_TOKEN is set.
- POST /repo-intelligence — performs a repository audit.

## Environment variables on Abacus

ABACUS_API_KEY
MANSA_WORKER_TOKEN
ABACUS_ROUTELLM_URL (optional)

The default RouteLLM endpoint is:

https://routellm.abacus.ai/v1/chat/completions

## Start

Install dependencies:

pip install -r requirements.txt

Run:

uvicorn server:app --host 0.0.0.0 --port 8000

Expose the HTTPS endpoint from Abacus and configure the Mansa Musa AI Vercel project with:

ABACUS_REPO_WORKER_URL=https://YOUR-ABACUS-HOST/repo-intelligence
ABACUS_WORKER_TOKEN=the-same-value-as-MANSA_WORKER_TOKEN

## Security design

The browser never receives the Abacus API key or worker token. The Next.js backend excludes sensitive repository paths and redacts probable credentials before sending context to this worker. Keep the worker endpoint token-protected.
