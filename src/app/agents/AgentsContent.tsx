"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, staggerSlow, scaleIn } from "@/lib/motion";

const agents = [
  {
    icon: "👑", gradient: "from-yellow-400 to-amber-500",
    name: "CEO Agent", role: "Strategic Intelligence",
    description: "Plans long-term strategy, generates executive reports, aligns company vision with market opportunities, and prepares board presentations.",
    capabilities: ["Strategic Planning", "Board Reports", "OKR Framework", "Risk Analysis", "Market Intelligence"],
  },
  {
    icon: "💰", gradient: "from-green-400 to-emerald-500",
    name: "Finance Agent", role: "Financial Intelligence",
    description: "Analyses financial data, forecasts revenue, processes invoices, monitors cash flow, and generates CFO-ready financial reports.",
    capabilities: ["Revenue Forecasting", "Invoice Processing", "Cash Flow Analysis", "P&L Reports", "Budget Planning"],
  },
  {
    icon: "🔬", gradient: "from-blue-400 to-cyan-500",
    name: "Research Agent", role: "Market Intelligence",
    description: "Conducts deep market research, competitive analysis, trend detection, and synthesises insights from multiple data sources.",
    capabilities: ["Market Research", "Competitor Analysis", "Trend Detection", "Industry Reports", "Data Synthesis"],
  },
  {
    icon: "⚖️", gradient: "from-purple-400 to-violet-500",
    name: "Legal Research Agent", role: "Legal Intelligence",
    description: "Reviews contracts, checks regulatory compliance, researches case law, identifies legal risks, and summarises complex legal documents.",
    capabilities: ["Contract Review", "Compliance Checks", "Risk Identification", "Legal Research", "Document Analysis"],
  },
  {
    icon: "⚡", gradient: "from-indigo-400 to-blue-500",
    name: "Developer Agent", role: "Engineering Intelligence",
    description: "Reviews code quality, fixes bugs, writes documentation, suggests architecture improvements, and generates comprehensive unit tests.",
    capabilities: ["Code Review", "Bug Detection", "Documentation", "Architecture Review", "Test Generation"],
  },
  {
    icon: "📣", gradient: "from-pink-400 to-rose-500",
    name: "Marketing Agent", role: "Growth Intelligence",
    description: "Plans campaigns, generates content strategy, optimises for SEO, analyses audience data, and measures marketing performance.",
    capabilities: ["Campaign Planning", "Content Strategy", "SEO Optimisation", "Audience Analysis", "Performance Reports"],
  },
  {
    icon: "📄", gradient: "from-slate-400 to-gray-500",
    name: "Document Agent", role: "Document Intelligence",
    description: "Generates professional documents, extracts key data from files, summarises long texts, and converts between formats at scale.",
    capabilities: ["Document Generation", "Data Extraction", "Text Summarisation", "Format Conversion", "Template Creation"],
  },
  {
    icon: "🎧", gradient: "from-teal-400 to-green-500",
    name: "Customer Support Agent", role: "Support Intelligence",
    description: "Resolves customer queries, routes complex tickets, performs sentiment analysis, and generates support documentation automatically.",
    capabilities: ["Query Resolution", "Ticket Routing", "Sentiment Analysis", "FAQ Generation", "Escalation Management"],
  },
  {
    icon: "💼", gradient: "from-orange-400 to-amber-500",
    name: "Sales Agent", role: "Revenue Intelligence",
    description: "Qualifies leads, generates proposals, updates CRM records, analyses win/loss patterns, and forecasts pipeline revenue.",
    capabilities: ["Lead Qualification", "Proposal Generation", "CRM Updates", "Pipeline Analysis", "Win/Loss Analysis"],
  },
  {
    icon: "🔒", gradient: "from-red-400 to-rose-500",
    name: "Security Agent", role: "Security Intelligence",
    description: "Analyses threat vectors, generates security audit reports, scans for vulnerabilities, and monitors for suspicious activity patterns.",
    capabilities: ["Threat Analysis", "Audit Reports", "Vulnerability Scanning", "Compliance Monitoring", "Incident Response"],
  },
];

export default function AgentsContent() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden bg-[#050508] px-6 py-24 text-center">
        <motion.div
          className="pointer-events-none absolute inset-0"
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 8, repeat: Infinity }}
        >
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[500px] w-[800px] rounded-full bg-brand-500/12 blur-[120px]" />
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="visible"
          className="relative z-10 mx-auto max-w-4xl"
        >
          <motion.span variants={fadeUp} className="inline-flex items-center gap-2 rounded-full border border-brand-500/30 bg-brand-500/10 px-4 py-1.5 text-xs font-semibold text-brand-400">
            <span className="flex h-2 w-2 rounded-full bg-brand-400">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-brand-400 opacity-75" />
            </span>
            41 Agents · All Active
          </motion.span>

          <motion.h1 variants={fadeUp} className="mt-6 text-5xl font-extrabold tracking-tight text-white sm:text-6xl">
            Your AI Workforce,{" "}
            <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              Ready to Deploy
            </span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-6 text-lg text-gray-400 max-w-2xl mx-auto">
            41 specialist AI agents covering every business function — from C-Suite to Security. Deploy workforce agents, run multi-agent competitions, and build your Wisdom Vault.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-brand-500/30 hover:bg-brand-600 transition-colors">
              Deploy your first agent →
            </Link>
            <Link href="/pricing" className="rounded-xl border border-white/10 px-8 py-3.5 text-base font-semibold text-gray-300 hover:border-white/20 hover:text-white transition-colors">
              See pricing
            </Link>
          </motion.div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
      </section>

      {/* Agents grid */}
      <section className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={staggerSlow}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
          >
            {agents.map((agent, i) => (
              <motion.div
                key={agent.name}
                variants={scaleIn}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="group relative flex flex-col rounded-2xl border border-gray-100 bg-white p-6 shadow-sm hover:border-brand-200 hover:shadow-md transition-shadow"
              >
                {/* Status */}
                <div className="absolute top-4 right-4 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                  </span>
                  <span className="text-xs font-medium text-green-600">Active</span>
                </div>

                {/* Icon */}
                <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${agent.gradient} text-2xl shadow-lg`}>
                  {agent.icon}
                </div>

                {/* Info */}
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">{agent.role}</p>
                <h3 className="mt-1 text-lg font-bold text-gray-900">{agent.name}</h3>
                <p className="mt-2 text-sm text-gray-500 leading-relaxed flex-1">{agent.description}</p>

                {/* Capabilities */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {agent.capabilities.map((c) => (
                    <span key={c} className="rounded-full bg-gray-50 border border-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 group-hover:border-brand-100 group-hover:bg-brand-50 group-hover:text-brand-700 transition-colors">
                      {c}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <Link
                  href="/register"
                  className="mt-5 flex items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-700 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700 transition-all"
                >
                  Deploy {agent.name.split(" ")[0]}
                  <span className="text-gray-300 group-hover:text-brand-400 transition-colors">→</span>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 px-6 py-20">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={stagger}
          className="mx-auto max-w-3xl text-center"
        >
          <motion.h2 variants={fadeUp} className="text-4xl font-extrabold text-gray-900">
            Ready to build your AI team?
          </motion.h2>
          <motion.p variants={fadeUp} className="mt-4 text-lg text-gray-500">
            Start with any plan and deploy agents immediately. Scale as your needs grow.
          </motion.p>
          <motion.div variants={fadeUp} className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="rounded-xl bg-brand-500 px-8 py-3.5 text-base font-semibold text-white hover:bg-brand-600 shadow-lg shadow-brand-500/20 transition-colors">
              Start free today
            </Link>
            <Link href="/pricing" className="rounded-xl border border-gray-200 px-8 py-3.5 text-base font-semibold text-gray-700 hover:bg-gray-100 transition-colors">
              See all plans
            </Link>
          </motion.div>
        </motion.div>
      </section>

      <MarketingFooter />
    </div>
  );
}
