import type { Metadata } from "next";
import { posts } from "@/data/blog";
import BlogContent from "./BlogContent";

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Insights on AI Operating Systems, AI Agents, Business Automation, Fintech AI, and AI Productivity — from the MansaMusaAI team.",
  keywords: ["AI Blog", "AI Operating System", "AI Agents Blog", "Fintech AI", "Business Automation"],
  openGraph: {
    title: "Blog — MansaMusaAI",
    description: "Insights on AI, business automation, and the future of work.",
  },
};

export default function BlogPage() {
  return <BlogContent posts={posts} />;
}
