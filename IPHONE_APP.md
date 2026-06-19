# Use Mansa Musa AI OS on your iPhone

The command center is now a **mobile web app**: responsive for iPhone and installable to
your home screen, where it opens full-screen with the gold crown icon — like a normal app,
no App Store needed.

## Install it (takes 20 seconds)
1. Deploy the `dashboard/` folder to Vercel (e.g. `dashboard.mansamusainitiative.co.uk`),
   so it's served over **https** (required for the app features to work).
2. On your iPhone, open that address in **Safari**.
3. Tap the **Share** button (the square with an up-arrow).
4. Scroll down and tap **Add to Home Screen** → **Add**.
5. You'll get a **Mansa Musa** crown icon on your home screen. Open it — it runs full-screen.

> Must be Safari for the install step (Chrome on iOS can't add PWAs). After installing you
> can open it from any browser too.

## What's mobile-optimised
- The sidebar becomes a **swipeable top tab bar** (Executive, Menu, Inventory, Finance,
  Customers, Forecast, Labour, AI Command).
- KPI cards reflow to two-per-row; wide tables scroll sideways instead of squashing.
- Tap targets are finger-sized; inputs won't trigger iOS zoom.
- Respects the notch / home-bar safe areas.
- A service worker caches the app shell, so it opens instantly and survives a flaky signal
  (live data still comes from the API when you're online).

## What you can do from your phone
- See today's KPIs, prime cost and revenue at a glance.
- Run any time-slot of agents (tap **06:00 / 09:00 / 12:00 / 15:00 / 21:00**).
- Review the menu-engineering matrix, reorder list, customer segments, forecast and labour.
- Read and approve agent drafts in **AI Command** (review replies, campaigns, supplier notes).

## Points it at your live backend
The app already calls `https://api.mansamusainitiative.co.uk`. As long as your Render API and
DNS are up, your phone shows live data from anywhere.

## Heads-up
- The **public customer website** (`site/`) is already mobile-responsive — customers don't
  install anything, they just visit `mansamusainitiative.co.uk`.
- iOS only runs the installable app features over https (Vercel handles that automatically).
  Opening the raw file from disk shows the mobile layout but not the install/offline parts.
