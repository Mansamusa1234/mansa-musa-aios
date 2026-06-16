"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { stagger, fadeUp, scaleIn } from "@/lib/motion";

type Category = "All" | "Business" | "Finance" | "AI" | "Tech" | "Markets" | "Global";
type Sentiment = "Positive" | "Neutral" | "Negative";

interface Article {
  id: number;
  category: Exclude<Category, "All">;
  source: string;
  time: string;
  headline: string;
  excerpt: string;
  sentiment: Sentiment;
  readTime: string;
  featured?: boolean;
}

const SEED_ARTICLES: Article[] = [
  {
    id: 1, category: "AI", source: "The Economist", time: "2 min ago",
    headline: "Large language models are now capable of real-time financial analysis",
    excerpt: "New benchmarks show frontier AI models outperforming human analysts in Q3 earnings prediction accuracy by 14 percentage points, prompting major banks to accelerate adoption.",
    sentiment: "Positive", readTime: "4 min", featured: true,
  },
  {
    id: 2, category: "Finance", source: "Financial Times", time: "8 min ago",
    headline: "FTSE 100 hits record high as inflation data surprises to the downside",
    excerpt: "UK CPI fell to 1.8% in November, below the Bank of England's 2% target for the first time since 2021, sending sterling and equities higher.",
    sentiment: "Positive", readTime: "3 min",
  },
  {
    id: 3, category: "Business", source: "Bloomberg", time: "15 min ago",
    headline: "Private equity dry powder reaches $3.9 trillion as deal activity stalls",
    excerpt: "Fund managers are sitting on record levels of committed but uninvested capital as high interest rates continue to suppress valuations and deal volume.",
    sentiment: "Neutral", readTime: "5 min",
  },
  {
    id: 4, category: "Tech", source: "Wired", time: "22 min ago",
    headline: "Anthropic raises $4B in Series E, valuation climbs to $61B",
    excerpt: "The AI safety company behind Claude secured fresh capital to accelerate compute investment and expand its enterprise product suite across EMEA.",
    sentiment: "Positive", readTime: "3 min",
  },
  {
    id: 5, category: "Markets", source: "Reuters", time: "31 min ago",
    headline: "Oil prices dip as OPEC+ signals production increase for Q1",
    excerpt: "Brent crude fell 2.3% after the cartel confirmed plans to unwind voluntary supply cuts, adding roughly 500,000 barrels per day from January.",
    sentiment: "Negative", readTime: "2 min",
  },
  {
    id: 6, category: "Global", source: "WSJ", time: "45 min ago",
    headline: "India surpasses Japan to become the third-largest economy by GDP",
    excerpt: "IMF data confirmed the milestone, driven by sustained 7%+ growth, a booming services sector, and rapid digital infrastructure expansion.",
    sentiment: "Positive", readTime: "6 min",
  },
  {
    id: 7, category: "AI", source: "MIT Tech Review", time: "1 hr ago",
    headline: "Agentic AI is reshaping enterprise software buying decisions",
    excerpt: "A new survey of 800 CTOs shows 68% plan to deploy autonomous AI agents within 12 months, fundamentally shifting how SaaS budgets are allocated.",
    sentiment: "Positive", readTime: "4 min",
  },
  {
    id: 8, category: "Finance", source: "The Guardian", time: "1 hr ago",
    headline: "UK fintech investment fell 22% in 2025 as regulatory costs rise",
    excerpt: "Venture funding into London's financial technology sector declined sharply, though deal quality improved and median valuations held steady.",
    sentiment: "Negative", readTime: "5 min",
  },
  {
    id: 9, category: "Business", source: "Forbes", time: "2 hr ago",
    headline: "Remote-first companies report 31% higher talent retention rates",
    excerpt: "A longitudinal study tracking 2,000 companies over 3 years found that fully distributed organisations saw significantly lower attrition across all seniority levels.",
    sentiment: "Positive", readTime: "4 min",
  },
  {
    id: 10, category: "Tech", source: "TechCrunch", time: "2 hr ago",
    headline: "Apple Vision Pro 2 enters production, expected at WWDC 2026",
    excerpt: "Supply chain reports indicate Foxconn has begun building units of the next-generation spatial computing headset with substantially reduced mass and improved battery life.",
    sentiment: "Positive", readTime: "3 min",
  },
];

const EXTRA_ARTICLES: Omit<Article, "id">[] = [
  { category: "Markets", source: "Reuters", time: "just now", headline: "Gold surges past $2,800 per troy ounce as dollar weakens", excerpt: "Safe-haven demand and central bank buying pushed gold to a fresh record, with analysts targeting $3,000 by mid-2026.", sentiment: "Positive", readTime: "2 min" },
  { category: "AI", source: "Bloomberg", time: "just now", headline: "OpenAI's GPT-5 clears US government security review", excerpt: "Clearance paves the way for deployment in classified federal workflows, a significant expansion of commercial AI in defence.", sentiment: "Neutral", readTime: "3 min" },
  { category: "Finance", source: "FT", time: "just now", headline: "ECB cuts rates by 25bps, signals further easing in 2026", excerpt: "Christine Lagarde cited cooling eurozone inflation and weakening German industrial output as justification for the decision.", sentiment: "Positive", readTime: "4 min" },
  { category: "Business", source: "WSJ", time: "just now", headline: "Amazon acquires logistics AI startup for $1.2B", excerpt: "The deal gives Amazon control of route optimisation technology used by over 40 last-mile delivery operators globally.", sentiment: "Positive", readTime: "3 min" },
];

const SENTIMENT_STYLES: Record<Sentiment, string> = {
  Positive: "bg-green-500/15 text-green-400 border-green-500/25",
  Neutral:  "bg-gray-500/15 text-gray-400 border-gray-500/25",
  Negative: "bg-red-500/15 text-red-400 border-red-500/25",
};

const CAT_STYLES: Record<Exclude<Category, "All">, string> = {
  Business: "bg-blue-500/15 text-blue-400",
  Finance:  "bg-green-500/15 text-green-400",
  AI:       "bg-brand-500/15 text-brand-400",
  Tech:     "bg-purple-500/15 text-purple-400",
  Markets:  "bg-red-500/15 text-red-400",
  Global:   "bg-teal-500/15 text-teal-400",
};

const TICKER_ITEMS = [
  "FTSE 100 ▲ 0.82%", "S&P 500 ▲ 1.14%", "NASDAQ ▲ 1.67%", "BTC/USD $96,420 ▲ 2.3%",
  "GBP/USD 1.2648 ▼ 0.12%", "Gold $2,841 ▲ 1.1%", "Brent Oil $78.40 ▼ 2.3%",
  "EUR/GBP 0.8432 ▲ 0.08%", "DAX ▲ 0.55%", "Nikkei 225 ▲ 1.92%",
];

const CATEGORIES: Category[] = ["All", "Business", "Finance", "AI", "Tech", "Markets", "Global"];

export default function NewsContent() {
  const [activeCategory, setActiveCategory] = useState<Category>("All");
  const [articles, setArticles] = useState<Article[]>(SEED_ARTICLES);
  const [saved, setSaved]  = useState<Set<number>>(new Set());
  const [read, setRead]    = useState<Set<number>>(new Set());
  const idRef = useRef(SEED_ARTICLES.length + 1);
  const extraRef = useRef(0);

  useEffect(() => {
    const t = setInterval(() => {
      const next = EXTRA_ARTICLES[extraRef.current % EXTRA_ARTICLES.length];
      extraRef.current++;
      const article: Article = { ...next, id: idRef.current++ };
      setArticles((prev) => [article, ...prev].slice(0, 20));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const filtered = activeCategory === "All" ? articles : articles.filter((a) => a.category === activeCategory);
  const featured = filtered.find((a) => a.featured) ?? filtered[0];
  const rest = filtered.filter((a) => a.id !== featured?.id);

  return (
    <div className="space-y-5">
      {/* Header */}
      <motion.div variants={stagger} initial="hidden" animate="visible">
        <motion.div variants={fadeUp}>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-400 mb-1">· Live Intelligence ·</p>
          <h1 className="text-2xl font-extrabold text-white">News Feed</h1>
          <p className="mt-1 text-sm text-gray-500">AI-curated business intelligence — updating in real time</p>
        </motion.div>

        {/* Ticker */}
        <motion.div variants={fadeUp} className="mt-4 overflow-hidden rounded-xl border border-white/8 bg-white/3">
          <div className="flex items-center">
            <span className="flex-shrink-0 border-r border-white/8 bg-brand-500/10 px-3 py-2 text-[10px] font-bold text-brand-400 uppercase tracking-widest">
              LIVE
            </span>
            <div className="overflow-hidden flex-1">
              <motion.div
                className="flex gap-8 px-4 py-2"
                animate={{ x: [0, -1400] }}
                transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
              >
                {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
                  <span key={i} className="whitespace-nowrap text-xs text-gray-400 font-mono">
                    {item}
                  </span>
                ))}
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Category filter */}
        <motion.div variants={fadeUp} className="mt-4 flex gap-2 overflow-x-auto pb-0.5 scrollbar-thin">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                activeCategory === cat
                  ? "bg-brand-500 text-white"
                  : "border border-white/8 bg-white/3 text-gray-500 hover:text-gray-200 hover:bg-white/6"
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* Featured article */}
      <AnimatePresence mode="wait">
        {featured && (
          <motion.div
            key={featured.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="relative overflow-hidden rounded-2xl border border-white/8 bg-white/3 p-5 hover:border-brand-500/25 transition-colors cursor-pointer"
            onClick={() => setRead((r) => new Set([...r, featured.id]))}
          >
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${SENTIMENT_STYLES[featured.sentiment]}`}>
                {featured.sentiment}
              </span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${CAT_STYLES[featured.category]}`}>
                {featured.category}
              </span>
              <span className="text-[10px] text-gray-600">{featured.source}</span>
              <span className="text-[10px] text-gray-600">·</span>
              <span className="text-[10px] text-gray-600">{featured.time}</span>
            </div>
            <h2 className={`text-lg font-bold leading-snug ${read.has(featured.id) ? "text-gray-400" : "text-white"}`}>
              {featured.headline}
            </h2>
            <p className="mt-2 text-sm text-gray-500 leading-relaxed">{featured.excerpt}</p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs text-gray-600">{featured.readTime} read</span>
              <button
                onClick={(e) => { e.stopPropagation(); setSaved((s) => { const n = new Set(s); n.has(featured.id) ? n.delete(featured.id) : n.add(featured.id); return n; }); }}
                className={`text-xs font-medium transition-colors ${saved.has(featured.id) ? "text-brand-400" : "text-gray-600 hover:text-gray-300"}`}
              >
                {saved.has(featured.id) ? "★ Saved" : "☆ Save"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Article grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence initial={false}>
          {rest.map((article) => (
            <motion.div
              key={article.id}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.25 }}
              whileHover={{ y: -2, transition: { duration: 0.15 } }}
              className="flex flex-col rounded-xl border border-white/8 bg-white/3 p-4 hover:border-white/12 transition-colors cursor-pointer"
              onClick={() => setRead((r) => new Set([...r, article.id]))}
            >
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${CAT_STYLES[article.category]}`}>{article.category}</span>
                <span className="text-[9px] text-gray-600">{article.source} · {article.time}</span>
              </div>
              <h3 className={`text-xs font-bold leading-snug flex-1 ${read.has(article.id) ? "text-gray-500" : "text-gray-200"}`}>
                {article.headline}
              </h3>
              <div className="mt-2 flex items-center justify-between">
                <span className={`rounded-full border px-1.5 py-0.5 text-[9px] font-bold ${SENTIMENT_STYLES[article.sentiment]}`}>
                  {article.sentiment}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setSaved((s) => { const n = new Set(s); n.has(article.id) ? n.delete(article.id) : n.add(article.id); return n; }); }}
                  className={`text-[11px] ${saved.has(article.id) ? "text-brand-400" : "text-gray-700 hover:text-gray-400"} transition-colors`}
                >
                  {saved.has(article.id) ? "★" : "☆"}
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
