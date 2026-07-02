"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Step {
  id: string;
  title: string;
  description: string;
  detail: string;
  href?: string;
  cta?: string;
  icon: string;
}

const STEPS: Step[] = [
  {
    id: "welcome",
    title: "Welcome to MansaMusaAI",
    description: "Your AI operating system is ready.",
    detail: "MansaMusaAI replaces your entire back office with AI. You get an AI receptionist that answers calls 24/7, a CRM that captures every lead automatically, a calendar that books appointments without you, email automation that follows up every prospect, and social media that posts daily without you lifting a finger. Let me show you around.",
    icon: "👑",
  },
  {
    id: "receptionist",
    title: "AI Receptionist",
    description: "Never miss a call or enquiry again.",
    detail: "Your AI receptionist answers every inbound call, chat message, and WhatsApp enquiry instantly — 24 hours a day, 7 days a week. It captures lead details, books appointments directly into your calendar, answers FAQs about your business, and sends automatic follow-up messages. Set it up in 5 minutes: give it a name, write your greeting, and tell it what your business does.",
    href: "/receptionist",
    cta: "Set up AI Receptionist",
    icon: "🤖",
  },
  {
    id: "calendar",
    title: "Smart Calendar & Bookings",
    description: "Let AI fill your diary automatically.",
    detail: "Connect your availability and your AI receptionist will book appointments directly into your calendar in real time — no back-and-forth emails, no phone tag. Customers pick a time that works, get an instant confirmation, and you just show up. Every booking is logged in your CRM automatically.",
    href: "/calendar",
    cta: "Set Your Availability",
    icon: "📅",
  },
  {
    id: "crm",
    title: "CRM & Lead Capture",
    description: "Every lead captured and followed up automatically.",
    detail: "Every enquiry — from your website chat, phone calls, WhatsApp, or email — is captured as a lead in your CRM automatically. The AI qualifies each lead, assigns a priority score, and sends a personalised follow-up email within 15 minutes. You can see every lead, their status, and their full conversation history in one place.",
    href: "/crm",
    cta: "View Your CRM",
    icon: "👥",
  },
  {
    id: "chat",
    title: "AI Chat & Workforce",
    description: "Your AI team works around the clock.",
    detail: "Access Claude Opus 4.8 — the world's most powerful AI — directly in your dashboard. Use it for writing, research, analysis, legal questions, financial modelling, or anything else. Your AI workforce agents run autonomously in the background, monitoring competitors, generating intelligence reports, and drafting content for your approval.",
    href: "/chat",
    cta: "Start Chatting",
    icon: "💬",
  },
  {
    id: "social",
    title: "Automated Social Media",
    description: "Daily posts across 5 platforms — zero effort.",
    detail: "MansaMusaAI posts to Twitter, Facebook, Instagram, YouTube, and Substack every single day automatically. AI generates the content, schedules it, and publishes it — all tailored to your brand and audience. You get consistent daily posting without hiring a social media manager or spending hours creating content.",
    href: "/agent-dashboard",
    cta: "View Agent Dashboard",
    icon: "📱",
  },
  {
    id: "billing",
    title: "Upgrade Your Plan",
    description: "Unlock the full power of MansaMusaAI.",
    detail: "The free plan gives you a taste of what's possible. Starter at £49/month gives you 1 AI receptionist, unlimited leads, and full CRM access. Professional at £149/month gives you 3 AI receptionists, WhatsApp integration, priority support, and the full email automation suite. Enterprise at £499/month gives you unlimited everything plus a dedicated account manager.",
    href: "/billing",
    cta: "View Plans & Pricing",
    icon: "💰",
  },
];

interface Props {
  userName?: string;
  isNewUser?: boolean;
}

export default function OnboardingAgent({ userName, isNewUser = false }: Props) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [messages, setMessages] = useState<{ role: "agent" | "user"; text: string }[]>([]);
  const [typing, setTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem("mm_onboarding_dismissed");
    if (saved) { setDismissed(true); return; }
    if (isNewUser) {
      setTimeout(() => setOpen(true), 1500);
    }
  }, [isNewUser]);

  useEffect(() => {
    if (open && messages.length === 0) {
      showStep(0);
    }
  }, [open]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing]);

  function showStep(idx: number) {
    const s = STEPS[idx];
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      const greeting = idx === 0 && userName ? `Hi ${userName.split(" ")[0]}! ` : "";
      setMessages((prev) => [...prev, { role: "agent", text: greeting + s.detail }]);
    }, 800);
  }

  function goNext() {
    const next = step + 1;
    if (next >= STEPS.length) {
      dismiss();
      return;
    }
    setStep(next);
    showStep(next);
  }

  function goPrev() {
    const prev = step - 1;
    if (prev < 0) return;
    setStep(prev);
    showStep(prev);
  }

  function dismiss() {
    localStorage.setItem("mm_onboarding_dismissed", "1");
    setDismissed(true);
    setOpen(false);
  }

  function reset() {
    localStorage.removeItem("mm_onboarding_dismissed");
    setDismissed(false);
    setStep(0);
    setMessages([]);
    setOpen(true);
  }

  const current = STEPS[step];

  if (dismissed && !open) {
    return (
      <button
        onClick={reset}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
        title="Open onboarding guide"
      >
        <span className="text-xl">👑</span>
      </button>
    );
  }

  return (
    <>
      {/* Toggle button */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-full bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold shadow-lg hover:shadow-violet-500/25 hover:scale-105 transition-all"
        >
          <span>👑</span> Platform Tour
        </button>
      )}

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[600px] flex flex-col rounded-2xl overflow-hidden shadow-2xl border border-white/10"
            style={{ background: "#0f172a" }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-violet-600 to-blue-600">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center text-lg">
                {current.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold text-sm truncate">{current.title}</p>
                <p className="text-white/70 text-xs truncate">{current.description}</p>
              </div>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white transition-colors ml-1">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 py-2 bg-[#0f172a]">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setStep(i); showStep(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? "bg-violet-400 w-4" : "bg-white/20"}`}
                />
              ))}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "agent" ? "justify-start" : "justify-end"}`}>
                  {msg.role === "agent" && (
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs mr-2 mt-1 flex-shrink-0">
                      👑
                    </div>
                  )}
                  <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
                    msg.role === "agent"
                      ? "bg-white/5 text-slate-200 rounded-tl-none"
                      : "bg-violet-600 text-white rounded-tr-none"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}

              {typing && (
                <div className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center text-xs flex-shrink-0">
                    👑
                  </div>
                  <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 pt-2 space-y-2">
              {current.href && current.cta && (
                <a
                  href={current.href}
                  className="block w-full text-center py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                  {current.cta} →
                </a>
              )}
              <div className="flex gap-2">
                {step > 0 && (
                  <button
                    onClick={goPrev}
                    className="flex-1 py-2 rounded-xl bg-white/5 text-slate-300 text-sm hover:bg-white/10 transition-colors"
                  >
                    ← Back
                  </button>
                )}
                <button
                  onClick={goNext}
                  className="flex-1 py-2 rounded-xl bg-white/10 text-slate-200 text-sm font-medium hover:bg-white/15 transition-colors"
                >
                  {step >= STEPS.length - 1 ? "Done ✓" : "Next →"}
                </button>
              </div>
              <button onClick={dismiss} className="w-full text-center text-xs text-slate-500 hover:text-slate-400 transition-colors py-1">
                Don&apos;t show again
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
