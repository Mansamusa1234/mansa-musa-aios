# MansaMusaAI

A production-ready AI assistant SaaS built with Next.js 15, TypeScript, Tailwind CSS, PostgreSQL, and Stripe.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3 |
| Database | PostgreSQL + Prisma ORM |
| Auth | NextAuth v5 (Credentials, GitHub, Google) |
| AI | Anthropic Claude (Haiku / Sonnet / Opus) |
| Payments | Stripe Subscriptions |
| Deployment | Vercel (recommended) |

## Features

- **AI Chat** — streaming responses powered by Claude, with persistent conversation history
- **Authentication** — email/password, GitHub OAuth, Google OAuth
- **Stripe Billing** — 4-tier plans (Free / Basic / Pro / Enterprise) with webhook sync
- **Admin Dashboard** — user management, usage stats, subscription overview
- **Mobile Responsive** — full bottom-nav on mobile, sidebar on desktop

## Project Structure

```
src/
├── app/
│   ├── (auth)/          # Login & Register pages
│   ├── (dashboard)/     # Protected user area (dashboard, chat, billing)
│   ├── admin/           # Admin-only area
│   └── api/             # Route handlers (auth, chat, stripe)
├── components/
│   ├── chat/            # ChatInterface, MessageBubble
│   └── layout/          # Sidebar, Navbar
├── lib/                 # db, auth, stripe, anthropic helpers
├── types/               # Shared TypeScript types
└── middleware.ts        # Route protection
prisma/
└── schema.prisma        # Database schema
```

## Getting Started

### 1. Clone & install

```bash
git clone https://github.com/YOUR_USERNAME/MansaMusaAI.git
cd MansaMusaAI
npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in every value in `.env`:

| Variable | Where to get it |
|----------|----------------|
| `DATABASE_URL` | Neon / Supabase / local Postgres |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `STRIPE_SECRET_KEY` | dashboard.stripe.com → API keys |
| `STRIPE_PUBLISHABLE_KEY` | dashboard.stripe.com → API keys |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen --forward-to localhost:3000/api/stripe/webhook` |
| `STRIPE_PRICE_BASIC/PRO/ENTERPRISE` | Create products in Stripe dashboard |
| `GITHUB_CLIENT_ID/SECRET` | github.com → Settings → OAuth Apps |
| `GOOGLE_CLIENT_ID/SECRET` | console.cloud.google.com → Credentials |

### 3. Database setup

```bash
npm run db:push      # Push schema to your database
npm run db:generate  # Generate Prisma client
```

### 4. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000).

### 5. Stripe webhooks (local testing)

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

## Deploying to Vercel

```bash
vercel --prod
```

Set all env vars in the Vercel dashboard. Point your Stripe webhook to
`https://your-domain.com/api/stripe/webhook`.

## Making yourself Admin

After registering your account, run in psql or Prisma Studio:

```sql
UPDATE "User" SET role = 'ADMIN' WHERE email = 'you@example.com';
```

Or via Prisma Studio (`npm run db:studio`).

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run db:push` | Sync schema to DB (no migration file) |
| `npm run db:migrate` | Create & run a migration |
| `npm run db:studio` | Open Prisma Studio GUI |

## License

MIT
