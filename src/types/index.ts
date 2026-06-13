export type Plan = "free" | "basic" | "pro" | "enterprise";

export interface PricingPlan {
  id: Plan;
  name: string;
  price: number;
  priceId: string;
  description: string;
  features: string[];
  highlighted: boolean;
  messagesPerMonth: number;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
}

export interface AdminStats {
  totalUsers: number;
  activeSubscriptions: number;
  totalRevenue: number;
  totalMessages: number;
  newUsersToday: number;
  messagesThisMonth: number;
}
