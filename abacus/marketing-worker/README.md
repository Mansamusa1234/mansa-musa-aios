# Abacus SuperComputer marketing worker

This service is the heavy-compute bridge for the MansaMusaAI AI Marketing Team.

## What it does

MansaMusaAI sends one marketing brief to this worker. The worker uses the Abacus RouteLLM API available inside SuperComputer, builds platform-specific drafts, and returns them to the MansaMusaAI approval queue.

## SuperComputer setup

The Abacus SuperComputer provides `ABACUS_API_KEY` in the VM. Set one additional secret:

```bash
export MANSA_WORKER_TOKEN="replace-with-a-long-random-secret"
```

Install and run:

```bash
cd abacus/marketing-worker
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn server:app --host 0.0.0.0 --port 8080
```

Expose port 8080 as a public HTTPS service in SuperComputer. Use the resulting URL with `/marketing`, for example:

```
https://YOUR-ABACUS-SERVICE/marketing
```

Then set these Vercel production secrets:

```
ABACUS_WORKER_URL=https://YOUR-ABACUS-SERVICE/marketing
ABACUS_WORKER_TOKEN=<same value as MANSA_WORKER_TOKEN>
```

Health endpoint: `GET /health`.

If the Abacus worker is unavailable, MansaMusaAI automatically falls back to its native marketing draft generator and still sends content to the approval queue.
