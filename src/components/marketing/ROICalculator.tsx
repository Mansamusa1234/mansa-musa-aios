"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function ROICalculator() {
  const [calls, setCalls] = useState(30);
  const [value, setValue] = useState(500);
  const [miss, setMiss] = useState(40);

  const missedCalls = Math.round((calls * miss) / 100);
  const monthlyLoss = missedCalls * value;
  const yearlyLoss  = monthlyLoss * 12;
  const planCost    = 149;
  const monthlyROI  = monthlyLoss - planCost;

  const fmt = (n: number) =>
    n >= 1000
      ? `£${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`
      : `£${n.toLocaleString("en-GB")}`;

  return (
    <section className="bg-gray-950 px-6 py-24 border-t border-white/5">
      <div className="mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-3">· ROI Calculator ·</p>
          <h2 className="text-4xl font-extrabold text-white">
            How much are missed calls costing you?
          </h2>
          <p className="mt-4 text-gray-400 text-lg">
            Move the sliders — see your real losses in real time.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Sliders */}
          <div className="space-y-8 rounded-2xl border border-white/8 bg-white/5 p-8">
            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Calls per month</label>
                <span className="text-brand-400 font-bold">{calls}</span>
              </div>
              <input
                type="range" min={5} max={500} step={5} value={calls}
                onChange={(e) => setCalls(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1"><span>5</span><span>500</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Average value per customer</label>
                <span className="text-brand-400 font-bold">£{value}</span>
              </div>
              <input
                type="range" min={50} max={5000} step={50} value={value}
                onChange={(e) => setValue(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1"><span>£50</span><span>£5k</span></div>
            </div>

            <div>
              <div className="flex justify-between mb-2">
                <label className="text-sm font-medium text-gray-300">Calls you currently miss</label>
                <span className="text-red-400 font-bold">{miss}%</span>
              </div>
              <input
                type="range" min={5} max={80} step={5} value={miss}
                onChange={(e) => setMiss(Number(e.target.value))}
                className="w-full accent-red-500 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1"><span>5%</span><span>80%</span></div>
            </div>
          </div>

          {/* Results */}
          <div className="flex flex-col gap-4">
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 flex-1">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">You are losing every month</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={monthlyLoss}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-5xl font-extrabold text-red-400"
                >
                  {fmt(monthlyLoss)}
                </motion.p>
              </AnimatePresence>
              <p className="mt-2 text-sm text-red-300/70">{missedCalls} missed calls × £{value} each</p>
            </div>

            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-red-400 mb-1">That's per year</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={yearlyLoss}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-3xl font-extrabold text-red-400"
                >
                  {fmt(yearlyLoss)}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-green-400 mb-1">MansaMusaAI pays for itself</p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={monthlyROI}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  className="text-3xl font-extrabold text-green-400"
                >
                  {fmt(Math.max(0, monthlyROI))} net gain / mo
                </motion.p>
              </AnimatePresence>
              <p className="mt-1 text-xs text-green-300/70">After £{planCost}/mo Professional plan</p>
            </div>

            <Link
              href="/register"
              className="block w-full rounded-xl bg-brand-600 py-4 text-center text-base font-bold text-white hover:bg-brand-700 transition-colors"
            >
              Stop losing {fmt(monthlyLoss)}/mo — start free →
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
