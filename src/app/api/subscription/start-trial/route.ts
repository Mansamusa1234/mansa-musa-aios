import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateStripeCustomer } from "@/lib/stripe";
import { sendEmail } from "@/lib/email";
import { triggerWorkflows } from "@/lib/email-automation";

const TRIAL_DAYS = 14;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.redirect(
      new URL("/login", process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com"),
      303
    );
  }

  const userId = session.user.id;
  const email = session.user.email;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

  const existing = await db.subscription.findUnique({ where: { userId } });
  if (existing?.trialUsed) {
    return NextResponse.redirect(new URL("/billing?trial=already_used", appUrl), 303);
  }
  if (existing?.status === "ACTIVE") {
    return NextResponse.redirect(new URL("/billing", appUrl), 303);
  }

  const trialEndsAt = new Date(Date.now() + TRIAL_DAYS * 24 * 60 * 60 * 1000);
  const stripeCustomerId = await getOrCreateStripeCustomer(userId, email);

  await db.subscription.upsert({
    where: { userId },
    create: {
      userId,
      stripeCustomerId,
      status: "TRIALING",
      trialEndsAt,
      trialUsed: true,
    },
    update: {
      status: "TRIALING",
      trialEndsAt,
      trialUsed: true,
    },
  });

  // Welcome trial email — best-effort
  try {
    const name = session.user.name ?? "there";
    const trialEndFormatted = trialEndsAt.toLocaleDateString("en-GB", {
      day: "numeric", month: "long", year: "numeric",
    });
    await sendEmail(
      email,
      "Your 14-day free trial has started — MansaMusaAI",
      trialStartedEmailHtml({ name, trialEndDate: trialEndFormatted }),
    );
  } catch {
    // non-fatal
  }

  // Trigger TRIAL_STARTED automation workflows — fire and forget
  void triggerWorkflows(userId, "TRIAL_STARTED", { email, name: session.user.name ?? "" }).catch(() => {});

  return NextResponse.redirect(new URL("/billing?trial=started", appUrl), 303);
}

function trialStartedEmailHtml({ name, trialEndDate }: { name: string; trialEndDate: string }) {
  return `<!DOCTYPE html>
<html>
<body style="font-family:sans-serif;background:#f9fafb;padding:40px 20px;">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:40px;">
  <h1 style="color:#111;font-size:24px;margin-bottom:8px;">Welcome to your free trial, ${name}!</h1>
  <p style="color:#555;font-size:16px;line-height:1.6;">
    Your 14-day trial of MansaMusaAI Professional is now active.
    You have full access to the AI receptionist, CRM, appointment booking,
    and email automation until <strong>${trialEndDate}</strong>.
  </p>
  <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display:inline-block;margin-top:24px;background:#6366f1;color:#fff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;">
    Go to dashboard
  </a>
  <p style="color:#999;font-size:13px;margin-top:32px;">
    Questions? Reply to this email or visit our support centre.
  </p>
</div>
</body>
</html>`;
}
