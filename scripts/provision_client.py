"""End-to-end client provisioning — create the cloud resources, not just the env file.

Given a client env (from onboard_client.py), this:
  1. Supabase Management API → create a project, wait for it, run db/schema.sql.
  2. Render API → create the API web service + the scheduler worker from your GitHub repo,
     wired with the client's env vars.
  3. Writes the resulting URLs/keys back into the client env and prints the DNS to set.

It makes REAL API calls when the provisioning tokens are present. Without them it runs in
DRY-RUN mode: it prints exactly what it would do and creates nothing — safe to try anytime.

Provisioning tokens (set in YOUR environment, not the client's):
  SUPABASE_ACCESS_TOKEN   personal access token (supabase.com/dashboard/account/tokens)
  SUPABASE_ORG_ID         org slug/id to create projects under
  SUPABASE_DB_PASSWORD    db password for the new project (or one is generated)
  SUPABASE_REGION         e.g. eu-west-2 (default)
  RENDER_API_KEY          render.com → Account → API Keys
  RENDER_OWNER_ID         render owner/team id (GET /v1/owners)
  GITHUB_REPO             https://github.com/<you>/mansa-musa-aios

Usage:
  python scripts/provision_client.py config/clients/acme-bistro-os.env
  python scripts/provision_client.py config/clients/acme-bistro-os.env --yes   # skip confirm
"""
from __future__ import annotations
import os
import sys
import time
import secrets
from pathlib import Path

try:
    import httpx
except ImportError:
    httpx = None

ROOT = Path(__file__).resolve().parent.parent
SCHEMA = (ROOT / "db" / "schema.sql")


# ── env file helpers ──────────────────────────────────────────────────────────
def load_env_file(path: Path) -> dict:
    d = {}
    for line in path.read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            k, v = line.split("=", 1)
            d[k.strip()] = v.strip()
    return d


def update_env_file(path: Path, updates: dict):
    lines = path.read_text().splitlines()
    keys = set(updates)
    out = []
    for line in lines:
        k = line.split("=", 1)[0].strip() if "=" in line and not line.startswith("#") else None
        if k in keys:
            out.append(f"{k}={updates[k]}")
            keys.discard(k)
        else:
            out.append(line)
    for k in keys:
        out.append(f"{k}={updates[k]}")
    path.write_text("\n".join(out) + "\n")


def dry() -> bool:
    return not (os.getenv("SUPABASE_ACCESS_TOKEN") and os.getenv("RENDER_API_KEY"))


# ── Supabase ────────────────────────────────────────────────────────────────--
def provision_supabase(client_env: dict) -> dict:
    name = client_env.get("BRAND_NAME", "client").lower().replace(" ", "-")
    region = os.getenv("SUPABASE_REGION", "eu-west-2")
    if dry():
        print(f"  [dry-run] Supabase: create project '{name}' in {region}, then run db/schema.sql")
        return {"SUPABASE_URL": "https://<new-ref>.supabase.co", "SUPABASE_SERVICE_KEY": "<service-key>"}

    token = os.getenv("SUPABASE_ACCESS_TOKEN")
    org = os.getenv("SUPABASE_ORG_ID")
    db_pw = os.getenv("SUPABASE_DB_PASSWORD") or secrets.token_urlsafe(20)
    h = {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    with httpx.Client(base_url="https://api.supabase.com", headers=h, timeout=60) as c:
        print("  Supabase: creating project…")
        r = c.post("/v1/projects", json={"name": name, "organization_id": org,
                                         "region": region, "db_pass": db_pw})
        r.raise_for_status()
        proj = r.json(); ref = proj["id"]
        # wait until the project is ACTIVE_HEALTHY
        for _ in range(40):
            s = c.get(f"/v1/projects/{ref}").json()
            if s.get("status") == "ACTIVE_HEALTHY":
                break
            time.sleep(15)
        # run the schema
        print("  Supabase: applying db/schema.sql…")
        c.post(f"/v1/projects/{ref}/database/query", json={"query": SCHEMA.read_text()}).raise_for_status()
        # fetch the service_role key
        keys = c.get(f"/v1/projects/{ref}/api-keys").json()
        service_key = next((k["api_key"] for k in keys if k.get("name") == "service_role"), "")
    return {"SUPABASE_URL": f"https://{ref}.supabase.co", "SUPABASE_SERVICE_KEY": service_key}


# ── Render ─────────────────────────────────────────────────────────────────--
def provision_render(client_env: dict, env_vars: dict) -> dict:
    repo = os.getenv("GITHUB_REPO", "https://github.com/Mansamusa1234/mansa-musa-aios")
    name = client_env.get("BRAND_NAME", "client").lower().replace(" ", "-")
    if dry():
        print(f"  [dry-run] Render: create web 'api-{name}' + worker 'sched-{name}' from {repo}")
        print(f"  [dry-run] Render: inject {len(env_vars)} env vars; health check /health")
        return {"api_url": f"https://api-{name}.onrender.com"}

    key, owner = os.getenv("RENDER_API_KEY"), os.getenv("RENDER_OWNER_ID")
    h = {"Authorization": f"Bearer {key}", "Content-Type": "application/json"}
    envs = [{"key": k, "value": v} for k, v in env_vars.items() if v]
    with httpx.Client(base_url="https://api.render.com", headers=h, timeout=60) as c:
        print("  Render: creating API web service…")
        web = c.post("/v1/services", json={
            "type": "web_service", "name": f"api-{name}", "ownerId": owner,
            "repo": repo, "branch": "main", "autoDeploy": "yes",
            "serviceDetails": {"env": "docker", "healthCheckPath": "/health",
                               "envSpecificDetails": {"dockerfilePath": "./Dockerfile"}},
            "envVars": envs,
        })
        web.raise_for_status()
        api_url = web.json().get("service", {}).get("serviceDetails", {}).get("url", "")
        print("  Render: creating scheduler worker…")
        c.post("/v1/services", json={
            "type": "background_worker", "name": f"sched-{name}", "ownerId": owner,
            "repo": repo, "branch": "main",
            "serviceDetails": {"env": "docker",
                               "envSpecificDetails": {"dockerfilePath": "./Dockerfile",
                                                      "dockerCommand": "python scheduler/daily_workflow.py"}},
            "envVars": envs,
        }).raise_for_status()
    return {"api_url": api_url or f"https://api-{name}.onrender.com"}


def main():
    if httpx is None:
        sys.exit("Install httpx first:  pip install httpx   (or run via: uv run --with httpx ...)")
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/provision_client.py config/clients/<slug>.env [--yes]")
    env_path = Path(sys.argv[1])
    client_env = load_env_file(env_path)
    brand = client_env.get("BRAND_NAME", "client")
    domain = client_env.get("BRAND_DOMAIN", "their-domain")

    print(f"\nProvisioning '{brand}'  {'(DRY-RUN — no tokens set)' if dry() else '(LIVE)'}")
    if not dry() and "--yes" not in sys.argv:
        if input("This will create real Supabase + Render resources. Continue? [y/N] ").lower() != "y":
            sys.exit("Aborted.")

    sb = provision_supabase(client_env)
    merged = {**client_env, **sb}
    rd = provision_render(client_env, merged)

    if not dry():
        update_env_file(env_path, sb)
        print(f"  ✓ wrote Supabase URL/key back into {env_path.name}")

    print(f"""
✓ {brand} provisioned.
   API:   {rd['api_url']}
   Set DNS:  api.{domain}  CNAME → {rd['api_url'].replace('https://','')}
             {domain} + dashboard → Vercel (deploy site/ and dashboard/)
   Then open https://api.{domain}/health  → should be healthy.
   Safety switches stay OFF until the client signs off on the drafts.
""")
    if dry():
        print("DRY-RUN only. Set SUPABASE_ACCESS_TOKEN, SUPABASE_ORG_ID, RENDER_API_KEY,\n"
              "RENDER_OWNER_ID and GITHUB_REPO to provision for real.")


if __name__ == "__main__":
    main()
