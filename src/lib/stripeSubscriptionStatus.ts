import type { SubscriptionStatus } from "@prisma/client";
export function stripeSubscriptionStatus(status: string): SubscriptionStatus {
  switch (status) {
    case "active": return "ACTIVE";
    case "trialing": return "TRIALING";
    case "past_due": case "unpaid": return "PAST_DUE";
    case "canceled": return "CANCELED";
    default: return "INACTIVE";
  }
}
