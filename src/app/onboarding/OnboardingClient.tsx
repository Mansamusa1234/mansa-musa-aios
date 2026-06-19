"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  userName: string;
  receptionistExists: boolean;
  receptionistName: string;
  subscriptionStatus: string;
  trialUsed: boolean;
}

const STEPS = ["Welcome", "AI Receptionist", "Your plan", "Done"];

export default function OnboardingClient({
  userName,
  receptionistExists,
  receptionistName: initialName,
  subscriptionStatus,
  trialUsed,
}: Props) {
  const router = useRouter();
  const [step, setStep]   = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1 — Receptionist setup
  const [recName, setRecName]       = useState(initialName || "AI Receptionist");
  const [greeting, setGreeting]     = useState("Hello! How can I help you today?");
  const [persona, setPersona]       = useState("professional, friendly and helpful");
  const [recSaved, setRecSaved]     = useState(receptionistExists);

  // Step 2 — Trial
  const [trialStarted, setTrialStarted] = useState(subscriptionStatus === "TRIALING");

  async function saveReceptionist() {
    setSaving(true);
    try {
      await fetch("/api/receptionist/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: recName, greeting, persona }),
      });
      setRecSaved(true);
      setStep(2);
    } finally {
      setSaving(false);
    }
  }

  async function startTrial() {
    setSaving(true);
    try {
      const res = await fetch("/api/subscription/start-trial", { method: "POST" });
      if (res.ok) setTrialStarted(true);
    } finally {
      setSaving(false);
    }
    setStep(3);
  }

  async function complete() {
    setSaving(true);
    try {
      await fetch("/api/user/complete-onboarding", { method: "POST" });
    } finally {
      setSaving(false);
    }
    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center px-4 py-12">
      {/* Progress */}
      <div className="w-full max-w-md mb-8">
        <div className="flex items-center justify-between mb-2">
          {STEPS.map((s, i) => (
            <div key={s} className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < step ? "bg-brand-600 text-white" : i === step ? "bg-brand-500 text-white ring-2 ring-brand-400/40" : "bg-gray-800 text-gray-500"
              }`}>
                {i < step ? "✓" : i + 1}
              </div>
              <span className={`text-xs ${i === step ? "text-white" : "text-gray-500"}`}>{s}</span>
            </div>
          ))}
        </div>
        <div className="h-1 bg-gray-800 rounded-full mt-1">
          <div className="h-1 bg-brand-500 rounded-full transition-all duration-500" style={{ width: `${(step / (STEPS.length - 1)) * 100}%` }} />
        </div>
      </div>

      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-gray-800 p-8">

        {/* Step 0 — Welcome */}
        {step === 0 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">👋</div>
            <h1 className="text-2xl font-bold text-white">
              Welcome{userName ? `, ${userName.split(" ")[0]}` : ""}!
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              Let&apos;s set up MansaMusaAI for your business in under 2 minutes.
              You&apos;ll have an AI receptionist answering calls and capturing leads before you finish your coffee.
            </p>
            <div className="grid grid-cols-3 gap-3 pt-2">
              {[
                { icon: "📞", label: "AI Receptionist" },
                { icon: "📋", label: "Lead Capture" },
                { icon: "📅", label: "Bookings" },
              ].map((f) => (
                <div key={f.label} className="rounded-xl bg-gray-800 px-3 py-4 text-center">
                  <div className="text-2xl mb-1">{f.icon}</div>
                  <p className="text-xs text-gray-300 font-medium">{f.label}</p>
                </div>
              ))}
            </div>
            <button onClick={() => setStep(1)}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 transition-colors">
              Let&apos;s go →
            </button>
          </div>
        )}

        {/* Step 1 — AI Receptionist */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="text-3xl">📞</div>
            <h2 className="text-xl font-bold text-white">Set up your AI receptionist</h2>
            <p className="text-sm text-gray-400">This is the AI that will answer your calls and chats 24/7.</p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Receptionist name</label>
                <input value={recName} onChange={(e) => setRecName(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="e.g. Sarah, Alex, or AI Assistant" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Opening greeting</label>
                <input value={greeting} onChange={(e) => setGreeting(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="Hello! How can I help you today?" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Persona / tone</label>
                <input value={persona} onChange={(e) => setPersona(e.target.value)}
                  className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="professional, friendly and helpful" />
              </div>
            </div>

            <button onClick={saveReceptionist} disabled={saving || !recName.trim()}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
              {saving ? "Saving…" : recSaved ? "Update & continue →" : "Save & continue →"}
            </button>
            <button onClick={() => setStep(2)} className="w-full text-xs text-gray-500 hover:text-gray-300 py-1">
              Skip for now
            </button>
          </div>
        )}

        {/* Step 2 — Trial / Plan */}
        {step === 2 && (
          <div className="space-y-5">
            <div className="text-3xl">🚀</div>
            <h2 className="text-xl font-bold text-white">Activate your free trial</h2>
            <p className="text-sm text-gray-400">
              Get 14 days of full Professional access — no credit card required.
              AI receptionist, CRM, bookings, WhatsApp, and email automation.
            </p>

            {trialStarted ? (
              <div className="rounded-xl border border-green-500/30 bg-green-500/10 px-4 py-4 text-center">
                <p className="text-green-400 font-semibold text-sm">✓ Trial activated — 14 days of full access</p>
              </div>
            ) : trialUsed ? (
              <div className="rounded-xl border border-gray-700 bg-gray-800 px-4 py-4 text-center">
                <p className="text-gray-400 text-sm">Your trial has already been used.</p>
                <Link href="/billing" className="text-brand-400 text-sm hover:text-brand-300 mt-1 block">View paid plans →</Link>
              </div>
            ) : (
              <button onClick={startTrial} disabled={saving}
                className="w-full rounded-xl bg-green-600 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-40 transition-colors">
                {saving ? "Starting…" : "Start 14-day free trial"}
              </button>
            )}

            <div className="border-t border-gray-800 pt-4">
              <p className="text-xs text-gray-500 text-center mb-3">Or choose a plan now</p>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { name: "Starter", price: "£49/mo" },
                  { name: "Professional", price: "£149/mo", highlight: true },
                  { name: "Enterprise", price: "£499/mo" },
                ].map((p) => (
                  <Link key={p.name} href="/billing"
                    className={`rounded-lg border px-3 py-3 text-center text-xs transition-colors ${
                      p.highlight ? "border-brand-500 bg-brand-500/10 text-brand-300" : "border-gray-700 text-gray-400 hover:border-gray-600"
                    }`}>
                    <p className="font-semibold">{p.name}</p>
                    <p className="mt-0.5 text-gray-500">{p.price}</p>
                  </Link>
                ))}
              </div>
            </div>

            <button onClick={() => setStep(3)}
              className="w-full rounded-xl border border-gray-700 py-3 text-sm text-gray-300 hover:border-gray-600 transition-colors">
              Continue →
            </button>
          </div>
        )}

        {/* Step 3 — Done */}
        {step === 3 && (
          <div className="text-center space-y-5">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-white">You&apos;re all set!</h2>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your AI receptionist is ready. Leads captured via chat, WhatsApp, or your website will appear in your CRM automatically.
            </p>
            <div className="text-left rounded-xl bg-gray-800 p-4 space-y-2">
              {[
                { href: "/receptionist", label: "Configure your AI receptionist", icon: "📞" },
                { href: "/crm", label: "View your CRM & leads", icon: "📋" },
                { href: "/calendar", label: "Set your availability", icon: "📅" },
                { href: "/whatsapp", label: "Connect WhatsApp", icon: "💬" },
                { href: "/email-automation", label: "Build email sequences", icon: "📧" },
                { href: "/affiliate", label: "Earn 20% as an affiliate", icon: "💰" },
              ].map((item) => (
                <Link key={item.href} href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-300 hover:bg-gray-700 transition-colors">
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                  <span className="ml-auto text-gray-600">→</span>
                </Link>
              ))}
            </div>
            <button onClick={complete} disabled={saving}
              className="w-full rounded-xl bg-brand-600 py-3 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-40 transition-colors">
              {saving ? "Loading…" : "Go to dashboard →"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
