"""CRM: RFM segmentation, lifetime value, churn risk.

RFM scores Recency, Frequency, Monetary each 1-5, then maps to a marketing segment
so the Loyalty / Retention / Birthday agents know exactly who to target.
"""
from __future__ import annotations


def _score(value: float, breaks: list[float], reverse: bool = False) -> int:
    """Map a value to 1-5 against quintile-ish breakpoints."""
    s = 1
    for i, b in enumerate(breaks, start=1):
        if value >= b:
            s = i + 1
    return 6 - s if reverse else s


def segment_customers(customers: list[dict], today_days: int = 0) -> list[dict]:
    """customers: [{name, recency_days, frequency, monetary}]."""
    if not customers:
        return []
    rec = sorted(c["recency_days"] for c in customers)
    freq = sorted(c["frequency"] for c in customers)
    mon = sorted(c["monetary"] for c in customers)

    def q(lst, p):
        return lst[min(int(len(lst) * p), len(lst) - 1)]

    rec_breaks = [q(rec, p) for p in (0.2, 0.4, 0.6, 0.8)]   # lower recency = better
    freq_breaks = [q(freq, p) for p in (0.2, 0.4, 0.6, 0.8)]
    mon_breaks = [q(mon, p) for p in (0.2, 0.4, 0.6, 0.8)]

    out = []
    for c in customers:
        r = _score(c["recency_days"], rec_breaks, reverse=True)
        f = _score(c["frequency"], freq_breaks)
        m = _score(c["monetary"], mon_breaks)
        out.append({**c, "R": r, "F": f, "M": m, "rfm": f"{r}{f}{m}",
                    "segment": _segment(r, f, m),
                    "ltv_estimate": round(c["monetary"] * max(c["frequency"], 1) * 0.0, 2) or c["monetary"]})
    return out


def _segment(r: int, f: int, m: int) -> str:
    if r >= 4 and f >= 4:
        return "Champion"
    if r >= 4 and f <= 2:
        return "New / Promising"
    if r <= 2 and f >= 4:
        return "At Risk (was loyal)"
    if r <= 2 and f <= 2:
        return "Lost"
    if m >= 4:
        return "Big Spender"
    return "Regular"


def lifetime_value(avg_order_value: float, visits_per_year: float,
                   retention_years: float = 3.0, gross_margin: float = 0.65) -> float:
    return round(avg_order_value * visits_per_year * retention_years * gross_margin, 2)


SEGMENT_PLAY = {
    "Champion": "VIP perks, early event access, ask for referrals & reviews.",
    "New / Promising": "Welcome offer + second-visit incentive to build the habit.",
    "At Risk (was loyal)": "Win-back: 'we miss you' message + a strong, time-limited offer.",
    "Lost": "Low-cost reactivation campaign; don't over-invest.",
    "Big Spender": "Private dining / events invites, personalised recommendations.",
    "Regular": "Loyalty points, birthday offer, keep them engaged.",
}
