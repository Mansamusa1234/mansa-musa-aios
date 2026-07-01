"use client";

import { motion, useInView } from "framer-motion";
import { useRef, useEffect, useState } from "react";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";

function useCountUp(target: number, duration = 2000, enabled = true) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled) return;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(step);
      else setCount(target);
    };
    requestAnimationFrame(step);
  }, [target, duration, enabled]);
  return count;
}

function AnimatedStat({ stat, enabled }: { stat: { value: string; label: string }; enabled: boolean }) {
  // Parse numeric value and suffix (e.g. "2,400+" → 2400, "+"; "£12M+" → 12, "M+"; "98.7%" → 98.7, "%"; "4.9★" → 4.9, "★")
  const match = stat.value.match(/^([£]?)(\d[\d,.]*)([^\d]*)$/);
  const prefix = match?.[1] ?? "";
  const rawNum = match?.[2]?.replace(/,/g, "") ?? "0";
  const suffix = match?.[3] ?? "";
  const target = parseFloat(rawNum);
  const decimals = rawNum.includes(".") ? rawNum.split(".")[1].length : 0;

  const count = useCountUp(target, 2200, enabled);
  const display = decimals > 0 ? count.toFixed(decimals) : count.toLocaleString();

  return (
    <div className="text-center">
      <p className="text-4xl font-extrabold text-gray-900">
        {prefix}{display}{suffix}
      </p>
      <p className="mt-1 text-sm text-gray-500">{stat.label}</p>
    </div>
  );
}

const TESTIMONIALS = [
  {
    name: "James Thornton",
    role: "Owner, Thornton & Co Dental",
    avatar: "JT",
    color: "bg-blue-500",
    stars: 5,
    text: "We were missing 40% of our calls outside opening hours. MansaMusaAI now answers every single one and books appointments directly into Dentally. Game changer.",
  },
  {
    name: "Sarah Mensah",
    role: "MD, Mensah Property Group",
    avatar: "SM",
    color: "bg-purple-500",
    stars: 5,
    text: "The AI receptionist handles all our inbound enquiries, qualifies leads, and sends them into our CRM. We close 3× more deals than before.",
  },
  {
    name: "Ravi Patel",
    role: "CEO, Patel Scaffolding Ltd",
    avatar: "RP",
    color: "bg-green-500",
    stars: 5,
    text: "I used to spend 2 hours a day on the phone with basic enquiries. Now MansaMusaAI handles it all and I get a summary every morning. Worth every penny.",
  },
  {
    name: "Lisa Okafor",
    role: "Founder, Okafor Accountants",
    avatar: "LO",
    color: "bg-amber-500",
    stars: 5,
    text: "Setup took under 10 minutes. It now handles our WhatsApp enquiries 24/7, books consultation calls, and sends follow-up emails automatically.",
  },
  {
    name: "Mike Dawson",
    role: "Director, Dawson Motors",
    avatar: "MD",
    color: "bg-red-500",
    stars: 5,
    text: "Our sales team used to chase cold leads all day. The AI qualifies them first, so we only talk to buyers who are ready. Revenue up 60% in 3 months.",
  },
  {
    name: "Priya Williams",
    role: "Founder, Williams Wellness",
    avatar: "PW",
    color: "bg-pink-500",
    stars: 5,
    text: "The email automation sequences are brilliant. New clients get a personalised sequence the moment they enquire. We convert 2× more than before.",
  },
];

const LOGOS = [
  { name: "Powered by Claude", icon: "🧠" },
  { name: "Stripe Payments", icon: "💳" },
  { name: "GDPR Compliant", icon: "🔒" },
  { name: "UK Based", icon: "🇬🇧" },
  { name: "24/7 Uptime", icon: "⚡" },
  { name: "Twilio Voice", icon: "📞" },
];

const STATS = [
  { value: "2,400+", label: "businesses onboarded" },
  { value: "£12M+",  label: "revenue generated for clients" },
  { value: "98.7%",  label: "customer satisfaction" },
  { value: "4.9★",   label: "average review score" },
];

export default function SocialProof() {
  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, margin: "-80px" });

  return (
    <section className="bg-white px-6 py-24 border-t border-gray-100">
      <div className="mx-auto max-w-6xl">

        {/* Stats strip */}
        <motion.div
          ref={statsRef}
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="grid grid-cols-2 gap-4 sm:grid-cols-4 mb-20"
        >
          {STATS.map((s) => (
            <motion.div key={s.label} variants={scaleIn}>
              <AnimatedStat stat={s} enabled={statsInView} />
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonials */}
        <motion.div variants={stagger} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
          <motion.p variants={fadeUp} className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">· Customer stories ·</motion.p>
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900">
            Businesses growing with MansaMusaAI
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.div
              key={t.name}
              variants={scaleIn}
              whileHover={{ y: -4, transition: { duration: 0.15 } }}
              className="rounded-2xl border border-gray-100 bg-gray-50 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: t.stars }).map((_, i) => (
                  <span key={i} className="text-amber-400 text-sm">★</span>
                ))}
              </div>
              <p className="text-gray-700 text-sm leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
              <div className="flex items-center gap-3">
                <div className={`flex h-9 w-9 items-center justify-center rounded-full text-white text-xs font-bold flex-shrink-0 ${t.color}`}>
                  {t.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Trust logos */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-6"
        >
          {LOGOS.map((l) => (
            <motion.div
              key={l.name}
              variants={fadeUp}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600 shadow-sm"
            >
              <span>{l.icon}</span>
              <span className="font-medium">{l.name}</span>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
