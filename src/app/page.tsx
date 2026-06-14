import Link from "next/link";
import { PLANS } from "@/lib/stripe";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <span className="text-xl font-bold text-brand-600">MansaMusaAI</span>
          <div className="flex items-center gap-4">
            <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 transition-colors"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-6 py-24 text-center">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-5xl font-extrabold tracking-tight text-gray-900 sm:text-6xl">
            AI as powerful as{" "}
            <span className="text-brand-500">Mansa Musa</span>
          </h1>
          <p className="mt-6 text-xl text-gray-500">
            MansaMusaAI brings state-of-the-art language models to your fingertips. Chat, analyse,
            create — all in one place.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link
              href="/register"
              className="rounded-xl bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow hover:bg-brand-600 transition-colors"
            >
              Start for free
            </Link>
            <Link
              href="#pricing"
              className="rounded-xl border border-gray-200 px-8 py-3 text-base font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-gray-50 px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">Everything you need</h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { title: "Streaming responses", desc: "See answers as they're generated in real time." },
              { title: "Conversation history", desc: "Pick up exactly where you left off." },
              { title: "Multiple models", desc: "Haiku for speed, Sonnet for balance, Opus for depth." },
              { title: "Stripe billing", desc: "Upgrade or cancel anytime — no lock-in." },
              { title: "Admin dashboard", desc: "Monitor usage, manage users, track revenue." },
              { title: "Mobile first", desc: "Fully responsive — works great on any device." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-gray-900">Simple, honest pricing</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border p-6 flex flex-col ${
                  plan.highlighted
                    ? "border-brand-500 bg-brand-50 shadow-lg"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.highlighted && (
                  <span className="mb-2 self-start rounded-full bg-brand-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Most popular
                  </span>
                )}
                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-1 text-sm text-gray-500">{plan.description}</p>
                <div className="mt-4 text-3xl font-extrabold text-gray-900">
                  {plan.price === 0
                    ? "Free"
                    : new Intl.NumberFormat("en-GB", {
                        style: "currency",
                        currency: plan.currency.toUpperCase(),
                        minimumFractionDigits: 0,
                      }).format(plan.price)}
                  {plan.price > 0 && (
                    <span className="text-base font-normal text-gray-400">/mo</span>
                  )}
                </div>
                <ul className="mt-6 flex-1 space-y-2">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                      <span className="mt-0.5 text-brand-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/register"
                  className={`mt-6 block rounded-xl py-2.5 text-center text-sm font-semibold transition-colors ${
                    plan.highlighted
                      ? "bg-brand-500 text-white hover:bg-brand-600"
                      : "border border-gray-200 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Get started
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-8 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} MansaMusaAI. All rights reserved.
      </footer>
    </div>
  );
}
