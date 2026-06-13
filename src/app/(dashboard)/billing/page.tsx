import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { PLANS } from "@/lib/stripe";
import BillingClient from "./BillingClient";

export default async function BillingPage() {
  const session = await auth();
  const subscription = await db.subscription.findUnique({
    where: { userId: session!.user.id },
  });

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-bold text-gray-900">Billing & Plans</h1>
      <p className="mt-1 text-sm text-gray-500">Manage your subscription and payment details.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((plan) => (
          <BillingClient
            key={plan.id}
            plan={plan}
            currentPriceId={subscription?.stripePriceId ?? null}
          />
        ))}
      </div>
    </div>
  );
}
