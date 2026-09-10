# Integration environment variables

Configure these in the live deployment environment; do not commit values.

```env
INSTAGRAM_ACCESS_TOKEN=""
INSTAGRAM_USER_ID=""
PINTEREST_ACCESS_TOKEN=""
LINKEDIN_ACCESS_TOKEN=""
HEYGEN_API_KEY=""
```

The hourly audit should report an absent optional integration as `WARNING / NOT CONFIGURED`, not `CRITICAL`.
