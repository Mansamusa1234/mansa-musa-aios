"use client";

import { motion } from "framer-motion";
import { fadeUp, stagger } from "@/lib/motion";

// Facts only. The earlier customer quotes, review scores and totals ("2,400+ businesses", "£12M+")
// were not backed by real customers and were removed. Add genuine, permissioned testimonials here.
const LOGOS = [
  { name: "Powered by Claude", icon: "🧠" },
  { name: "Payments by Stripe", icon: "💳" },
  { name: "UK based", icon: "🇬🇧" },
];

export default function SocialProof() {
  return (
    <section className="bg-white px-6 py-16 border-t border-gray-100">
      <div className="mx-auto max-w-6xl">
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="flex flex-wrap items-center justify-center gap-6"
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
