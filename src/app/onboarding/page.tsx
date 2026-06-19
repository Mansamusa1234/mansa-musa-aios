import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import OnboardingClient from "./OnboardingClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Get started | MansaMusaAI",
  robots: { index: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { name: true, onboardingComplete: true },
  });

  if (user?.onboardingComplete) redirect("/dashboard");

  const receptionist = await db.receptionist.findUnique({
    where: { userId: session.user.id },
    select: { id: true, name: true, greeting: true },
  });

  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    select: { status: true, trialUsed: true },
  });

  return (
    <OnboardingClient
      userName={user?.name ?? ""}
      receptionistExists={!!receptionist}
      receptionistName={receptionist?.name ?? ""}
      subscriptionStatus={subscription?.status ?? "INACTIVE"}
      trialUsed={subscription?.trialUsed ?? false}
    />
  );
}
