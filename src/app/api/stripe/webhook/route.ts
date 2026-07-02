import { NextResponse } from "next/server";
import { after } from "next/server";
import { getStripe } from "@/lib/stripe";
import { PLANS } from "@/lib/stripe";
import { db } from "@/lib/db";
import { recordConversion } from "@/lib/referrals";
import { triggerWorkflows } from "@/lib/email-automation";
import {
  sendEmail,
  subscriptionStartedEmailHtml,
  subscriptionCancelledEmailHtml,
  paymentFailedEmailHtml,
} from "@/lib/email";
import type Stripe from "stripe";

const APP = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.mansamusainitiative.com";

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
}

function formatAmount(unitAmount: number | null, currency: string) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format((unitAmount ?? 0) / 100);
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 503 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook error: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const sub = await stripe.subscriptions.retrieve(session.subscription as string);

      await db.subscription.upsert({
        where: { stripeCustomerId: session.customer as string },
        create: {
          userId: session.metadata!.userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          status: "ACTIVE",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          status: "ACTIVE",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
        },
      });

      // Referral/affiliate conversion — best-effort, must never affect webhook processing.
      try {
        await recordConversion(
          session.metadata!.userId,
          sub.items.data[0]?.price.id ?? "",
          sub.id,
          session.metadata?.affiliateCode ?? null,
        );
      } catch (err) {
        console.error("[webhook] referral/affiliate conversion tracking failed:", err);
      }

      // Subscription started email + trigger automation workflows
      after(async () => {
        try {
          const user = await db.user.findUnique({
            where: { id: session.metadata!.userId },
            select: { email: true, name: true },
          });
          if (user) {
            const priceItem = sub.items.data[0];
            const planName = PLANS.find((p) => p.priceId === priceItem?.price.id)?.name ?? "paid";
            await sendEmail(
              user.email,
              `Your ${planName} plan is now active`,
              subscriptionStartedEmailHtml({
                name: user.name ?? "there",
                plan: planName,
                amount: formatAmount(priceItem?.price.unit_amount ?? null, priceItem?.price.currency ?? "gbp"),
                nextBillDate: formatDate(sub.current_period_end),
              })
            );
            void triggerWorkflows(session.metadata!.userId, "SUBSCRIPTION_ACTIVATED", { email: user.email, name: user.name ?? "" });
          }
        } catch (err) {
          console.error("[webhook] subscription started email failed:", err);
        }
      });

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const statusMap: Record<string, string> = {
        active: "ACTIVE",
        canceled: "CANCELED",
        past_due: "PAST_DUE",
        trialing: "TRIALING",
        unpaid: "PAST_DUE",
      };

      // Fetch user before update so we have their details for the email
      const existingSub = await db.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
        include: { user: { select: { email: true, name: true } } },
      });

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: (statusMap[sub.status] ?? "INACTIVE") as never,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          currentPeriodStart: new Date(sub.current_period_start * 1000),
          currentPeriodEnd: new Date(sub.current_period_end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      // Cancellation email + trigger automation workflows
      if (event.type === "customer.subscription.deleted" && existingSub?.user) {
        after(async () => {
          try {
            const planName = PLANS.find((p) => p.priceId === existingSub.stripePriceId)?.name ?? "paid";
            await sendEmail(
              existingSub.user.email,
              "Your MansaMusaAI subscription has been cancelled",
              subscriptionCancelledEmailHtml({
                name: existingSub.user.name ?? "there",
                plan: planName,
                endsAt: formatDate(sub.current_period_end),
              })
            );
            void triggerWorkflows(existingSub.userId, "SUBSCRIPTION_CANCELLED", { email: existingSub.user.email, name: existingSub.user.name ?? "" });
          } catch (err) {
            console.error("[webhook] subscription cancelled email failed:", err);
          }
        });
      }

      break;
    }

    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = invoice.subscription as string | null;

      if (stripeSubId) {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: {
            status: "ACTIVE",
            currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
            currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
          },
        });

        // Record recurring affiliate commission for subscription renewals
        if (invoice.billing_reason === "subscription_cycle" && invoice.id) {
          after(async () => {
            try {
              const conversion = await db.affiliateConversion.findFirst({
                where: { stripeSubscriptionId: stripeSubId, status: "CONVERTED" },
                include: { affiliate: { select: { recurringRate: true, parentAffiliateId: true, tier2Rate: true } } },
              });
              if (!conversion) return;

              const alreadyRecorded = await db.affiliateRenewal.findUnique({ where: { invoiceId: invoice.id! } });
              if (alreadyRecorded) return;

              const amountCents     = invoice.amount_paid;
              const commissionCents = Math.round((amountCents * conversion.affiliate.recurringRate) / 100);

              await db.$transaction(async (tx) => {
                await tx.affiliateRenewal.create({
                  data: { conversionId: conversion.id, amountCents, commissionCents, invoiceId: invoice.id! },
                });
                await tx.affiliateConversion.update({
                  where: { id: conversion.id },
                  data: { recurringTotal: { increment: commissionCents }, lastRenewalAt: new Date() },
                });

                if (conversion.affiliate.parentAffiliateId && conversion.affiliate.tier2Rate > 0) {
                  const tier2 = Math.round((amountCents * conversion.affiliate.tier2Rate) / 100);
                  await tx.commissionLedger.create({
                    data: { userId: conversion.affiliate.parentAffiliateId, sourceType: "AFFILIATE", amountCents: tier2 },
                  });
                }
              });
            } catch (err) {
              console.error("[webhook] recurring affiliate commission failed:", err);
            }
          });
        }
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      after(async () => {
        try {
          const customerId = invoice.customer as string;
          const sub = await db.subscription.findUnique({
            where: { stripeCustomerId: customerId },
            include: { user: { select: { email: true, name: true } } },
          });
          if (sub?.user) {
            const planName = PLANS.find((p) => p.priceId === sub.stripePriceId)?.name ?? "your plan";
            await sendEmail(
              sub.user.email,
              "Payment failed — update your payment method",
              paymentFailedEmailHtml({
                name: sub.user.name ?? "there",
                plan: planName,
                updateUrl: `${APP}/billing`,
              })
            );
          }
        } catch (err) {
          console.error("[webhook] payment failed email failed:", err);
        }
      });
      break;
    }
  }

  return NextResponse.json({ received: true });
}
