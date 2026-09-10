# Audit status schema

Health-check renderers should consume a normalized object:

```ts
type AuditSeverity = 'ok' | 'warning' | 'critical'

type AuditResult = {
  name: string
  ok: boolean
  severity: AuditSeverity
  message: string
  action?: string
}
```

Rendering rules:

- `ok` -> green check and `OK`
- `warning` -> amber warning and `WARNING`
- `critical` -> red cross and `CRITICAL`

Never derive the displayed severity from section position or a hard-coded label.
