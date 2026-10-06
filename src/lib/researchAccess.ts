import { getActivePlan } from "@/lib/subscription";

export async function canUseBusinessResearch(userId: string, role?: string | null): Promise<boolean> {
  if (role === "ADMIN") return true;
  const plan = await getActivePlan(userId);
  return plan === "pro" || plan === "enterprise";
}
