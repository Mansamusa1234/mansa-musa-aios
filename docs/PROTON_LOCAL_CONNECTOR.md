# Proton Mail local connector

This connector gives a **local Mansa Musa AI process** access to Proton Mail through the official Proton Mail Bridge. It does not route mail through Outlook and does not expose Proton Bridge to the public internet.

## Architecture

Proton Mail <-> official Proton Mail Bridge <-> localhost IMAP/SMTP <-> Mansa Musa local connector <-> authenticated Mansa Musa control plane

Proton documents that Bridge decrypts mail locally and exposes IMAP/SMTP only to applications on the same device. For that reason, the connector must run on the Windows machine where Bridge is running. Do not deploy this connector directly to Vercel and do not open the Bridge ports in Windows Firewall/router.

## Local setup

1. Keep Proton Mail Bridge running and signed into the intended Proton account.
2. In Bridge, open the account's mailbox/configuration details.
3. Store the Bridge-generated values in a local secret store or local environment variables. Never commit them:
   - PROTON_BRIDGE_EMAIL
   - PROTON_BRIDGE_IMAP_PASSWORD
   - PROTON_BRIDGE_IMAP_HOST (normally 127.0.0.1)
   - PROTON_BRIDGE_IMAP_PORT (use the value Bridge displays)
   - PROTON_BRIDGE_SMTP_HOST (normally 127.0.0.1)
   - PROTON_BRIDGE_SMTP_PORT (use the value Bridge displays)
4. Optional but preferred: export/trust Bridge's local TLS certificate and set PROTON_BRIDGE_CA_FILE to that certificate path.
5. Test health locally before enabling any remote control-plane access.

## Security requirements

- Bridge credentials never go to GitHub, Vercel, chat, logs, or screenshots.
- Bind any future Mansa local-agent HTTP server to localhost by default.
- If remote access is added, use an outbound authenticated tunnel initiated by the local agent; never port-forward Bridge IMAP/SMTP.
- Read operations may be enabled independently. Sending, deleting, moving, or marking mail should remain approval-gated.
- Redact message bodies from logs.

## Current connector functions

- health()
- list_messages(mailbox="INBOX", limit=25, unread_only=False)
- read_message(message_id, mailbox="INBOX")
- send_message(to, subject, body)

The next layer is a small authenticated local-agent/control-plane protocol so the hosted Mansa Musa AI app can request these operations without exposing Proton Bridge itself.
