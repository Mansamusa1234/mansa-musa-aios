"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import MarketingNav from "@/components/marketing/MarketingNav";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import { fadeUp, stagger, scaleIn } from "@/lib/motion";
import type { BlogPost } from "@/data/blog";

const categoryColors: Record<string, string> = {
  Strategy:    "bg-purple-50 text-purple-700",
  "AI Agents": "bg-blue-50 text-blue-700",
  Fintech:     "bg-green-50 text-green-700",
  Engineering: "bg-orange-50 text-orange-700",
  Security:    "bg-red-50 text-red-700",
  Guide:       "bg-brand-50 text-brand-700",
};

interface Props {
  post: BlogPost;
  allPosts: BlogPost[];
}

export default function BlogPostContent({ post, allPosts }: Props) {
  const related = allPosts.filter((p) => p.slug !== post.slug && p.category === post.category).slice(0, 2);
  const fallback = allPosts.filter((p) => p.slug !== post.slug).slice(0, 2);
  const suggestions = related.length > 0 ? related : fallback;

  return (
    <div className="min-h-screen bg-white">
      <MarketingNav />

      {/* Article header */}
      <section className="bg-gray-50 px-6 py-16">
        <motion.div variants={stagger} initial="hidden" animate="visible" className="mx-auto max-w-3xl">
          <motion.div variants={fadeUp} className="flex items-center gap-3 mb-4">
            <Link href="/blog" className="text-sm text-gray-400 hover:text-brand-600 transition-colors">← Back to Blog</Link>
            <span className="text-gray-300">·</span>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${categoryColors[post.category] ?? "bg-gray-100 text-gray-600"}`}>
              {post.category}
            </span>
          </motion.div>

          <motion.h1 variants={fadeUp} className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            {post.title}
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-3 text-xl text-gray-500">{post.subtitle}</motion.p>

          <motion.div variants={fadeUp} className="mt-6 flex flex-wrap items-center gap-4 text-sm text-gray-400 border-t border-gray-200 pt-6">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-brand-100 flex items-center justify-center text-xs font-bold text-brand-600">M</div>
              <span className="font-medium text-gray-700">{post.author}</span>
            </div>
            <span>·</span>
            <span>{new Date(post.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>·</span>
            <span>{post.readTime}</span>
          </motion.div>
        </motion.div>
      </section>

      {/* Article body */}
      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          {/* Excerpt as lead paragraph */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-xl leading-relaxed text-gray-700 font-medium border-l-4 border-brand-400 pl-6 mb-10"
          >
            {post.excerpt}
          </motion.p>

          {/* Article content */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="prose prose-gray max-w-none space-y-6 text-gray-600 leading-relaxed"
          >
            {post.content ? (
              <div dangerouslySetInnerHTML={{ __html: post.content }} />
            ) : (
              <>
            <p>
              This is a growing article on <strong>{post.title}</strong>. Full content is coming soon as we continue to build out the MansaMusaAI blog.
            </p>
            <p>
              In the meantime, you can explore the platform to see these concepts in action — or reach out to our team with questions.
            </p>
            </>
            )}

            <div className="my-8 rounded-2xl border border-brand-100 bg-brand-50 p-6">
              <h3 className="font-bold text-brand-900 mb-2">Key takeaways</h3>
              <ul className="space-y-2">
                {post.tags.map((tag) => (
                  <li key={tag} className="flex items-center gap-2 text-sm text-brand-800">
                    <span className="text-brand-500">✓</span> {tag}
                  </li>
                ))}
              </ul>
            </div>

            <p>
              MansaMusaAI is built for businesses that want to move faster, think smarter, and automate everything from finance to legal research with AI agents.
            </p>
          </motion.div>

          {/* Tags */}
          <div className="mt-10 flex flex-wrap gap-2 pt-6 border-t border-gray-100">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full border border-gray-200 px-3 py-1 text-xs font-medium text-gray-500">
                #{tag.toLowerCase().replace(/ /g, "-")}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-12 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-white p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900">Ready to deploy AI in your business?</h3>
            <p className="mt-2 text-gray-500">Start with MansaMusaAI for free. No credit card required.</p>
            <Link href="/register" className="mt-5 inline-block rounded-xl bg-brand-500 px-8 py-3 text-sm font-semibold text-white hover:bg-brand-600 shadow-sm transition-colors">
              Get started free →
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts */}
      {suggestions.length > 0 && (
        <section className="bg-gray-50 px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-xl font-bold text-gray-900 mb-6">More from the blog</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {suggestions.map((p) => (
                <motion.div key={p.slug} variants={scaleIn} initial="hidden" whileInView="visible" viewport={{ once: true }}>
                  <Link href={`/blog/${p.slug}`} className="group flex flex-col h-full rounded-xl border border-gray-200 bg-white p-5 hover:border-brand-200 hover:shadow-sm transition-all">
                    <span className={`self-start rounded-full px-2.5 py-1 text-xs font-semibold mb-3 ${categoryColors[p.category] ?? "bg-gray-100 text-gray-600"}`}>{p.category}</span>
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-700 line-clamp-2 transition-colors">{p.title}</h3>
                    <p className="mt-2 text-sm text-gray-500 line-clamp-2">{p.excerpt}</p>
                    <span className="mt-3 text-xs font-medium text-brand-600">Read → </span>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      <MarketingFooter />
    </div>
  );
}
