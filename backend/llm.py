"""Thin LLM wrapper. Uses OpenAI or Anthropic depending on .env.
If no key is present it returns a clearly-marked stub so the system still runs."""
from __future__ import annotations
import os


def complete(system: str, user: str, max_tokens: int = 800) -> str:
    provider = os.getenv("LLM_PROVIDER", "openai").lower()
    model = os.getenv("LLM_MODEL", "gpt-4o-mini")

    if provider == "anthropic" and os.getenv("ANTHROPIC_API_KEY"):
        import anthropic
        client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
        msg = client.messages.create(
            model=model if "claude" in model else "claude-haiku-4-5-20251001",
            max_tokens=max_tokens,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
        return "".join(b.text for b in msg.content if b.type == "text")

    if os.getenv("OPENAI_API_KEY"):
        from openai import OpenAI
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        resp = client.chat.completions.create(
            model=model if "gpt" in model else "gpt-4o-mini",
            max_tokens=max_tokens,
            messages=[
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
        )
        return resp.choices[0].message.content or ""

    # No key -> stub so the pipeline is still demonstrable end to end.
    return (
        "[STUB OUTPUT — add OPENAI_API_KEY or ANTHROPIC_API_KEY to .env to get real "
        f"generations]\nSystem prompt was:\n{system[:200]}...\nTask was:\n{user[:200]}..."
    )
