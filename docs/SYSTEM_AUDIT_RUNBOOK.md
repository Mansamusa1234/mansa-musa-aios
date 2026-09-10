# System Audit Runbook

The hourly system audit must distinguish core-service outages from optional-integration configuration issues.

## Classification

- `OK`: dependency responded successfully.
- `WARNING`: optional integration missing configuration, token expired, authentication rejected, or non-critical endpoint unavailable.
- `CRITICAL`: core database, billing, email-delivery, or primary AI dependency is unavailable and materially affects the product.

## Social/video remediation

### Instagram
Refresh the production access token and keep it only in the deployment environment as `INSTAGRAM_ACCESS_TOKEN`. Configure the associated user/account identifier as `INSTAGRAM_USER_ID` where required.

### Pinterest
Regenerate an authorised access token and save it in the deployment environment as `PINTEREST_ACCESS_TOKEN`.

### LinkedIn
Complete OAuth/application authorisation and save the production access token as `LINKEDIN_ACCESS_TOKEN`.

### HeyGen
Configure `HEYGEN_API_KEY`. Health checks must use a current read-only endpoint supported by the installed integration. HTTP 401/403 should be reported as authentication warnings; HTTP 404 should be reported as an endpoint/resource warning, not a platform-wide critical outage.

## Security

Never commit production API keys or access tokens. `.env.example` should contain only empty placeholders and documentation.
