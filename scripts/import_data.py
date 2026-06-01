"""Load a restaurant's real data into Supabase so the analytics go LIVE.

Reads CSV files from a folder (templates in data/templates/) and inserts them into
the matching tables. Run it once to seed history, or on a schedule to keep data fresh.

Usage:
  python scripts/import_data.py data/templates           # import every CSV present
  python scripts/import_data.py data/mydata --only menu,inventory

CSV files (any subset; headers must match):
  menu_items.csv     name,category,price,food_cost,active
  inventory.csv      item,unit,on_hand,par_level,daily_usage,lead_time_days,unit_cost
  customers.csv      name,email,phone,vip,birthday
  staff.csv          name,role,email,phone
  shifts.csv         role,hours,rate
  orders.csv         total,covers,customer_email,placed_at
  order_items.csv    order_ref,menu_item_name,qty,unit_price

Without SUPABASE_URL set, it runs against the in-memory store (a safe dry-run you can test).
"""
from __future__ import annotations
import csv
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))
from dotenv import load_dotenv  # noqa: E402
load_dotenv()
from backend import store  # noqa: E402

# table -> (csv filename, [columns], type coercions)
SPEC = {
    "menu_items": ("menu_items.csv", {"price": float, "food_cost": float, "active": bool}),
    "inventory": ("inventory.csv", {"on_hand": float, "par_level": float,
                                    "daily_usage": float, "lead_time_days": float, "unit_cost": float}),
    "customers": ("customers.csv", {"vip": bool}),
    "staff": ("staff.csv", {}),
    "shifts": ("shifts.csv", {"hours": float, "rate": float}),
    "orders": ("orders.csv", {"total": float, "covers": int}),
    "order_items": ("order_items.csv", {"qty": int, "unit_price": float}),
}


def _coerce(row: dict, casts: dict) -> dict:
    out = {}
    for k, v in row.items():
        if v == "" or v is None:
            continue
        if k in casts:
            out[k] = (str(v).lower() in ("1", "true", "yes")) if casts[k] is bool else casts[k](v)
        else:
            out[k] = v
    return out


def import_table(folder: Path, table: str) -> int:
    fname, casts = SPEC[table]
    path = folder / fname
    if not path.exists():
        return 0
    n = 0
    with path.open() as f:
        for row in csv.DictReader(f):
            store.insert(table, _coerce(row, casts))
            n += 1
    print(f"  {table}: imported {n} rows from {fname}")
    return n


def main():
    if len(sys.argv) < 2:
        sys.exit("Usage: python scripts/import_data.py <folder> [--only menu_items,orders]")
    folder = Path(sys.argv[1])
    only = None
    if "--only" in sys.argv:
        only = set(sys.argv[sys.argv.index("--only") + 1].split(","))
    live = bool(__import__("os").getenv("SUPABASE_URL"))
    print(f"Importing from {folder}  ({'LIVE Supabase' if live else 'in-memory dry-run'})")
    total = 0
    # order matters: menu_items & customers before order_items/orders that reference them
    for table in ["menu_items", "inventory", "customers", "staff", "shifts", "orders", "order_items"]:
        if only and table not in only:
            continue
        total += import_table(folder, table)
    print(f"Done. {total} rows imported. The analytics will read these on next load.")


if __name__ == "__main__":
    main()
