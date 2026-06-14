"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";
import type { BlogPost } from "@/data/blog";

const categoryColors: Record<string, string> = {
  Strategy:    "bg-purple-50 text-purple-700 border-purple-100",
  "AI Agents": "bg-blue-50 text-blue-700 border-blue-100",
  Fintech:     "bg-green-50 text-green-700 border-green-100",
  Engineering: "bg-orange-50 text-orange-700 border-orange-100",
  Security:    "bg-red-50 text-red-700 border-red-100",
  Guide:       "bg-brand-50 text-brand-700 border-brand-100",
};

interface Props { posts: BlogPost[] }

export default function BlogContent({ posts }: Props) {
  const [active, setActive] = useState("All");
  const categories = ["All", ...Array.from(new Set(posts.map((p) => p.category)))];
  const filtered = active === "All" ? posts : posts.filter((p) => p.category === active);
  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="bg-gray-50 px-6 py-20">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-4xl">
          <motion.p variants={fadeUp} className="text-sm font-semibold uppercase tracking-widest text-brand-600">Blog</motion.p>
          <motion.h1 variants={fadeUp} className="mt-3 text-5xl font-extrabold tracking-tight text-gray-900">
            Insights on AI & Business
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-4 text-xl text-gray-500 max-w-2xl">
            Deep dives into AI operating systems, business automation, fintech AI, and the future of work — from the MansaMusaAI team.
          </motion.p>

          {/* Category filters */}
          <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActive(cat)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-all border ${
                  active === cat
                    ? "bg-brand-500 text-white border-brand-500 shadow-sm"
                    : "bg-white text-gray-600 border-gray-200 hover:border-brand-300 hover:text-brand-600"
                }`}
              >
                {cat}
              </button>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* Featured post */}
      {featured && active === "All" && (
        <section className="px-6 py-12">
          <div className="mx-auto max-w-5xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="group relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-brand-50 to-white p-8 shadow-sm lg:p-10"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${categoryColors[featured.category] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {featured.category}
                    </span>
                    <span className="text-xs text-gray-400">Featured</span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-gray-900 group-hover:text-brand-700 transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-lg text-gray-500">{featured.subtitle}</p>
                  <p className="text-gray-600">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{featured.author}</span>
                    <span>·</span>
                    <span>{new Date(featured.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
                    <span>·</span>
                    <span>{featured.readTime}</span>
                  </div>
                  <Link
                    href={`/blog/${featured.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors shadow-sm"
                  >
                    Read article
                    <span className="transition-transform group-hover:translate-x-1">→</span>
                  </Link>
                </div>

                {/* Decorative */}
                <div className="hidden lg:flex lg:w-64 items-center justify-center">
                  <div className="relative h-48 w-48">
                    <motion.div
                      animate={{ rotate: [0, 360] }}
                      transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                      className="absolute inset-0 rounded-full border-2 border-dashed border-brand-200"
                    />
                    <div className="absolute inset-6 rounded-full bg-brand-500/10 flex items-center justify-center text-6xl">
                      🤖
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Post grid */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-5xl">
          {active !== "All" && (
            <p className="mb-6 text-sm text-gray-500">{filtered.length} post{filtered.length !== 1 ? "s" : ""} in <strong>{active}</strong></p>
          )}
          <motion.div
            key={active}
            initial="hidden"
            animate="visible"
            variants={stagger}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
          >
            {(active === "All" ? rest : filtered).map((post) => (
              <motion.div
                key={post.slug}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.15 } }}
              >
                <Link
                  href={`/blog/${post.slug}`}
                  className="group flex h-full flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${categoryColors[post.category] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                      {post.category}
                    </span>
                    <span className="text-xs text-gray-400">{post.readTime}</span>
                  </div>
                  <h3 className="font-bold text-gray-900 group-hover:text-brand-700 transition-colors line-clamp-2">{post.title}</h3>
                  <p className="mt-2 text-sm text-gray-500 line-clamp-3 flex-1">{post.excerpt}</p>
                  <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                    <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>·</span>
                    <span className="font-medium text-brand-600 group-hover:underline">Read →</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="bg-gray-900 px-6 py-16 text-center">
        <h2 className="text-3xl font-bold text-white">Stay ahead of the AI curve</h2>
        <p className="mt-3 text-gray-400">Weekly insights on AI, business automation, and fintech delivered to your inbox.</p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
          <input
            type="email"
            placeholder="your@email.com"
            className="flex-1 rounded-xl border border-gray-700 bg-gray-800 px-4 py-3 text-sm text-white placeholder-gray-500 focus:border-brand-500 focus:outline-none"
          />
          <button className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-semibold text-white hover:bg-brand-600 transition-colors">
            Subscribe
          </button>
        </div>
        <p className="mt-3 text-xs text-gray-600">No spam. Unsubscribe anytime.</p>
      </section>

      <MarketingFooter />
    </div>
  );
}
