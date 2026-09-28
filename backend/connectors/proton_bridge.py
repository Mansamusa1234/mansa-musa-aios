"""Local Proton Mail connector for Mansa Musa AI.

Security model:
- Runs on the SAME Windows machine as Proton Mail Bridge.
- Connects only to Bridge's localhost IMAP/SMTP endpoints.
- Never stores the Proton account password.
- Never expose Bridge IMAP/SMTP ports to the LAN or Internet.
- Bridge-generated credentials stay in local environment variables only.

Required local environment variables:
  PROTON_BRIDGE_EMAIL
  PROTON_BRIDGE_IMAP_PASSWORD
Optional:
  PROTON_BRIDGE_IMAP_HOST=127.0.0.1
  PROTON_BRIDGE_IMAP_PORT=1143
  PROTON_BRIDGE_SMTP_HOST=127.0.0.1
  PROTON_BRIDGE_SMTP_PORT=1025
"""

from __future__ import annotations

import email
import imaplib
import os
import smtplib
import ssl
from email.header import decode_header
from email.message import EmailMessage
from typing import Any


def _cfg(name: str, default: str | None = None) -> str:
    value = os.getenv(name, default)
    if not value:
        raise RuntimeError(f"Missing local configuration: {name}")
    return value


def _decode(value: str | None) -> str:
    if not value:
        return ""
    parts = decode_header(value)
    out = []
    for part, charset in parts:
        if isinstance(part, bytes):
            out.append(part.decode(charset or "utf-8", errors="replace"))
        else:
            out.append(part)
    return "".join(out)


def _imap() -> imaplib.IMAP4:
    host = _cfg("PROTON_BRIDGE_IMAP_HOST", "127.0.0.1")
    port = int(_cfg("PROTON_BRIDGE_IMAP_PORT", "1143"))
    user = _cfg("PROTON_BRIDGE_EMAIL")
    password = _cfg("PROTON_BRIDGE_IMAP_PASSWORD")

    # Proton Bridge uses a locally generated certificate. STARTTLS keeps the
    # loopback hop encrypted; certificate trust is local to this machine.
    conn = imaplib.IMAP4(host, port)
    context = ssl.create_default_context()
    cafile = os.getenv("PROTON_BRIDGE_CA_FILE")
    if cafile:
        context.load_verify_locations(cafile)
    else:
        context.check_hostname = False
        context.verify_mode = ssl.CERT_NONE
    conn.starttls(ssl_context=context)
    conn.login(user, password)
    return conn


def health() -> dict[str, Any]:
    try:
        conn = _imap()
        status, _ = conn.noop()
        conn.logout()
        return {"status": "ok" if status == "OK" else "error", "provider": "proton-bridge", "host": "127.0.0.1"}
    except Exception as exc:
        return {"status": "error", "provider": "proton-bridge", "error": str(exc)}


def list_messages(mailbox: str = "INBOX", limit: int = 25, unread_only: bool = False) -> list[dict[str, str]]:
    conn = _imap()
    try:
        status, _ = conn.select(mailbox, readonly=True)
        if status != "OK":
            raise RuntimeError(f"Unable to open mailbox: {mailbox}")
        criteria = "UNSEEN" if unread_only else "ALL"
        status, data = conn.search(None, criteria)
        if status != "OK" or not data:
            return []
        ids = data[0].split()[-max(1, min(limit, 100)):]
        messages: list[dict[str, str]] = []
        for msg_id in reversed(ids):
            status, payload = conn.fetch(msg_id, "(BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE MESSAGE-ID)])")
            if status != "OK" or not payload or not isinstance(payload[0], tuple):
                continue
            msg = email.message_from_bytes(payload[0][1])
            messages.append({
                "id": msg_id.decode(),
                "from": _decode(msg.get("From")),
                "to": _decode(msg.get("To")),
                "subject": _decode(msg.get("Subject")),
                "date": _decode(msg.get("Date")),
                "message_id": _decode(msg.get("Message-ID")),
            })
        return messages
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def read_message(message_id: str, mailbox: str = "INBOX") -> dict[str, str]:
    conn = _imap()
    try:
        conn.select(mailbox, readonly=True)
        status, payload = conn.fetch(message_id.encode(), "(BODY.PEEK[])")
        if status != "OK" or not payload or not isinstance(payload[0], tuple):
            raise RuntimeError("Message not found")
        msg = email.message_from_bytes(payload[0][1])
        body = ""
        if msg.is_multipart():
            for part in msg.walk():
                if part.get_content_type() == "text/plain" and "attachment" not in str(part.get("Content-Disposition", "")).lower():
                    raw = part.get_payload(decode=True) or b""
                    body = raw.decode(part.get_content_charset() or "utf-8", errors="replace")
                    break
        else:
            raw = msg.get_payload(decode=True) or b""
            body = raw.decode(msg.get_content_charset() or "utf-8", errors="replace")
        return {
            "id": message_id,
            "from": _decode(msg.get("From")),
            "to": _decode(msg.get("To")),
            "subject": _decode(msg.get("Subject")),
            "date": _decode(msg.get("Date")),
            "body": body,
        }
    finally:
        try:
            conn.logout()
        except Exception:
            pass


def send_message(to: str, subject: str, body: str) -> dict[str, str]:
    host = _cfg("PROTON_BRIDGE_SMTP_HOST", "127.0.0.1")
    port = int(_cfg("PROTON_BRIDGE_SMTP_PORT", "1025"))
    user = _cfg("PROTON_BRIDGE_EMAIL")
    password = _cfg("PROTON_BRIDGE_IMAP_PASSWORD")

    msg = EmailMessage()
    msg["From"] = user
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(body)

    context = ssl.create_default_context()
    context.check_hostname = False
    context.verify_mode = ssl.CERT_NONE
    with smtplib.SMTP(host, port, timeout=30) as smtp:
        smtp.starttls(context=context)
        smtp.login(user, password)
        smtp.send_message(msg)
    return {"status": "sent", "provider": "proton-bridge"}
