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
    detail: "MansaMusaAI gives your business an AI receptionist for your website chat, a CRM that captures your leads, a booking calendar and email automation, plus an AI executive team for advice. Let me show you around.",
    icon: "👑",
  },
  {
    id: "receptionist",
    title: "AI Receptionist",
    description: "Answer website enquiries with AI.",
    detail: "Your AI receptionist answers enquiries on your website chat, captures the enquirer's details into your CRM, and your booking calendar lets clients book appointments. Set it up in a few minutes: give it a name, write your greeting, and tell it what your business does. Phone, SMS and WhatsApp are not currently offered.",
    href: "/receptionist",
    cta: "Set up AI Receptionist",
    icon: "🤖",
  },
  {
    id: "calendar",
    title: "Smart Calendar & Bookings",
    description: "Let clients book into your availability.",
    detail: "Set your availability and clients can book appointments into your calendar. Bookings appear in your calendar view, and you can add or cancel bookings yourself.",
    href: "/calendar",
    cta: "Set Your Availability",
    icon: "📅",
  },
  {
    id: "crm",
    title: "CRM & Lead Capture",
    description: "Keep every lead in one pipeline.",
    detail: "Enquiries from your website chat and the lead capture page are saved as leads in your CRM. Move each lead through your pipeline, from first contact to closed deal, and record every follow-up in one place.",
    href: "/crm",
    cta: "View Your CRM",
    icon: "👥",
  },
  {
    id: "chat",
    title: "AI Chat & Workforce",
    description: "Chat with AI and your executive team.",
    detail: "Chat with leading AI models in your dashboard: Claude Haiku 4.5 on the free plan, with more capable models on paid plans. Use it for writing, research and analysis. On Starter and above you can also ask your AI executive team (CEO, CFO, CMO and more) for plans and advice.",
    href: "/chat",
    cta: "Start Chatting",
    icon: "💬",
  },

  {
    id: "billing",
    title: "Upgrade Your Plan",
    description: "Unlock the full power of MansaMusaAI.",
    detail: "The free plan includes 5 AI chats a day. Starter at £49/month adds the website chat AI receptionist, CRM, appointment booking and your AI executive team. Professional at £149/month adds email automation sequences and the Business Research Desk. Enterprise at £499/month adds the most capable AI models and a dedicated account manager.",
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
