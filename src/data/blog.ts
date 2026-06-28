export interface BlogPost {
  slug: string;
  title: string;
  subtitle: string;
  excerpt: string;
  content?: string;
  date: string;
  readTime: string;
  category: string;
  featured: boolean;
  tags: string[];
  author: string;
}

export const posts: BlogPost[] = [
  {
    slug: "ai-receptionist-for-small-business-uk",
    title: "AI Receptionist for Small Business UK: The Complete 2026 Guide",
    subtitle: "How small businesses are saving £2,000+/month with AI",
    excerpt:
      "Missing calls costs UK small businesses an estimated £30,000 a year in lost revenue. An AI receptionist costs less than £50/month and never sleeps. Here's everything you need to know.",
    date: "2026-06-20",
    readTime: "7 min read",
    category: "Guide",
    featured: false,
    tags: ["AI Receptionist UK", "Small Business AI", "AI Phone Answering", "UK Business"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "how-to-automate-lead-capture",
    title: "How to Automate Lead Capture for Your Business in 2026",
    subtitle: "Turn website visitors and phone calls into booked appointments automatically",
    excerpt:
      "73% of leads go cold within the first hour. AI-powered lead capture responds instantly, qualifies prospects, and books them into your calendar — while you sleep.",
    date: "2026-06-15",
    readTime: "6 min read",
    category: "Guide",
    featured: false,
    tags: ["Lead Capture", "Business Automation", "CRM", "AI Sales"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "whatsapp-business-ai-automation",
    title: "WhatsApp Business AI Automation: How to Handle 100+ Messages a Day",
    subtitle: "Scale your WhatsApp support without hiring more staff",
    excerpt:
      "WhatsApp has 2 billion users. UK businesses that respond within 5 minutes convert 9× more leads. Here's how to automate your entire WhatsApp inbox with AI.",
    date: "2026-06-12",
    readTime: "5 min read",
    category: "Guide",
    featured: false,
    tags: ["WhatsApp Business", "AI Automation", "Customer Service", "Messaging"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "rise-of-ai-operating-systems",
    title: "The Rise of AI Operating Systems",
    subtitle: "Why every business will run on AI in 2026",
    excerpt:
      "Traditional SaaS is being replaced by AI-native operating systems that think, plan, and act autonomously. The businesses that adopt early will dominate their categories.",
    date: "2026-06-10",
    readTime: "8 min read",
    category: "Strategy",
    featured: true,
    tags: ["AI Operating System", "Business Strategy", "AI Transformation"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "ai-agents-replacing-workflows",
    title: "10 Ways AI Agents Are Replacing Business Workflows",
    subtitle: "From automation to full autonomy",
    excerpt:
      "AI agents are no longer a future concept. They're handling finance, legal research, marketing campaigns, and developer tasks right now — at a fraction of the cost.",
    date: "2026-06-05",
    readTime: "6 min read",
    category: "AI Agents",
    featured: false,
    tags: ["AI Agents", "Business Automation", "Productivity"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "fintech-ai-revolution",
    title: "Fintech AI: The £100B Opportunity Reshaping Finance",
    subtitle: "How artificial intelligence is transforming financial services",
    excerpt:
      "From real-time fraud detection to automated regulatory compliance, AI is reshaping every corner of fintech. Here's where the next decade of value will be created.",
    date: "2026-05-28",
    readTime: "10 min read",
    category: "Fintech",
    featured: false,
    tags: ["Fintech AI", "Financial Technology", "AI Banking"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "building-ai-productivity-platform",
    title: "Building a Production AI Productivity Platform",
    subtitle: "Architecture, lessons learned, and what we'd do differently",
    excerpt:
      "We built MansaMusaAI from scratch using Next.js 15, Prisma, Stripe, and Claude. Here's the full technical breakdown — including the mistakes we made along the way.",
    date: "2026-05-20",
    readTime: "12 min read",
    category: "Engineering",
    featured: false,
    tags: ["AI Productivity", "SaaS Architecture", "Engineering"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "enterprise-ai-security-guide",
    title: "Enterprise AI Security: The Complete Guide",
    subtitle: "Protecting your business in the age of autonomous AI",
    excerpt:
      "AI security isn't just about preventing breaches — it's about building trust at every layer. Here's how we approach security-by-design at MansaMusaAI.",
    date: "2026-05-12",
    readTime: "9 min read",
    category: "Security",
    featured: false,
    tags: ["AI Security", "Enterprise", "Compliance"],
    author: "MansaMusaAI Team",
  },
  {
    slug: "choosing-right-ai-plan",
    title: "Free vs Pro vs Enterprise: Choosing Your AI Plan",
    subtitle: "A no-nonsense buyer's guide",
    excerpt:
      "Not every business needs Opus 4.8 and unlimited agents on day one. Here's how to match your AI investment to your actual operational stage.",
    date: "2026-05-05",
    readTime: "5 min read",
    category: "Guide",
    featured: false,
    tags: ["AI Pricing", "Business Guide", "AI Adoption"],
    author: "MansaMusaAI Team",
  },
];

export const categories = [...new Set(posts.map((p) => p.category))];
