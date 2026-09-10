# MansaMusaAI system-audit repair

This branch fixes the hourly monitoring report and integration checks without storing secrets in Git.

## Problems observed

- Instagram access token expiry reported as a hard failure without an actionable configuration state.
- Pinterest token expiry (HTTP 401).
- LinkedIn token not configured.
- HeyGen health check returns HTTP 404.
- Healthy Database, Anthropic, Stripe and Resend checks are displayed with a misleading `CRITICAL` label.

## Repair goals

1. Status labels must reflect the actual health result: `OK`, `WARNING`, or `CRITICAL`.
2. Missing optional integrations should be `NOT CONFIGURED`/`WARNING`, not system-critical.
3. Authentication failures should include concise remediation guidance without exposing tokens.
4. HeyGen should use a current, non-destructive API endpoint and distinguish 401/403 authentication errors from 404 endpoint/resource errors.
5. Production integration credentials belong in the deployment environment only, never in the repository.

## Required deployment variables

- `INSTAGRAM_ACCESS_TOKEN`
- `INSTAGRAM_USER_ID`
- `PINTEREST_ACCESS_TOKEN`
- `LINKEDIN_ACCESS_TOKEN`
- `HEYGEN_API_KEY`

The application should tolerate these variables being absent by reporting the relevant integration as not configured rather than failing the whole audit.
