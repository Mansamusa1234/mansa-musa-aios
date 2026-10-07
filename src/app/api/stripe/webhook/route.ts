import { NextResponse } from "next/server";
import { after } from "next/server";
import { getStripe } from "@/lib/stripe";
import { findPlanByPriceId } from "@/lib/stripe";
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
import { stripeSubscriptionStatus } from "@/lib/stripeSubscriptionStatus";
import { invoiceSubscriptionId, stripeObjectId, subscriptionPeriod } from "@/lib/stripePayload";

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
    case "checkout.session.completed":
    case "checkout.session.async_payment_succeeded": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription" || !session.subscription || !session.metadata?.userId) break;
      if (!["paid", "no_payment_required"].includes(session.payment_status)) break;
      const customerId = stripeObjectId(session.customer);
      const subscriptionId = stripeObjectId(session.subscription);
      if (!customerId || !subscriptionId) break;
      const sub = await stripe.subscriptions.retrieve(subscriptionId);
      const period = subscriptionPeriod(sub);
      const previous = await db.subscription.findUnique({ where: { stripeCustomerId: customerId } });
      if (previous && previous.userId !== session.metadata.userId) {
        throw new Error("Checkout customer does not match the application user");
      }
      const active = sub.status === "active" || sub.status === "trialing";

      await db.subscription.upsert({
        where: { stripeCustomerId: customerId },
        create: {
          userId: session.metadata!.userId,
          stripeCustomerId: customerId,
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          status: stripeSubscriptionStatus(sub.status),
          currentPeriodStart: new Date(period.start * 1000),
          currentPeriodEnd: new Date(period.end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
        update: {
          stripeSubscriptionId: sub.id,
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          status: stripeSubscriptionStatus(sub.status),
          currentPeriodStart: new Date(period.start * 1000),
          currentPeriodEnd: new Date(period.end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      if (active) try {
        await recordConversion(
          session.metadata!.userId,
          sub.items.data[0]?.price.id ?? "",
          sub.id,
          session.metadata?.affiliateCode ?? null,
        );
      } catch (err) {
        console.error("[webhook] referral/affiliate conversion tracking failed:", err);
      }

      if (active && previous?.stripeSubscriptionId !== sub.id) after(async () => {
        try {
          const user = await db.user.findUnique({
            where: { id: session.metadata!.userId },
            select: { email: true, name: true },
          });
          if (user) {
            const priceItem = sub.items.data[0];
            const planName = findPlanByPriceId(priceItem?.price.id)?.name ?? "paid";
            await sendEmail(
              user.email,
              `Your ${planName} plan is now active`,
              subscriptionStartedEmailHtml({
                name: user.name ?? "there",
                plan: planName,
                amount: formatAmount(priceItem?.price.unit_amount ?? null, priceItem?.price.currency ?? "gbp"),
                nextBillDate: formatDate(period.end),
              }),
              undefined, `stripe-started-${sub.id}`
            );
            await triggerWorkflows(session.metadata!.userId, "SUBSCRIPTION_ACTIVATED", { email: user.email, name: user.name ?? "" });
          }
        } catch (err) {
          console.error("[webhook] subscription started email failed:", err);
        }
      });

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const payload = event.data.object as Stripe.Subscription;
      const sub = event.type === "customer.subscription.updated" ? await stripe.subscriptions.retrieve(payload.id) : payload;
      const period = subscriptionPeriod(sub);

      const existingSub = await db.subscription.findFirst({
        where: { stripeSubscriptionId: sub.id },
        include: { user: { select: { email: true, name: true } } },
      });

      await db.subscription.updateMany({
        where: { stripeSubscriptionId: sub.id },
        data: {
          status: stripeSubscriptionStatus(sub.status),
          stripePriceId: sub.items.data[0]?.price.id ?? "",
          currentPeriodStart: new Date(period.start * 1000),
          currentPeriodEnd: new Date(period.end * 1000),
          cancelAtPeriodEnd: sub.cancel_at_period_end,
        },
      });

      if (event.type === "customer.subscription.deleted" && existingSub?.user) {
        after(async () => {
          try {
            const planName = findPlanByPriceId(existingSub.stripePriceId)?.name ?? "paid";
            await sendEmail(
              existingSub.user.email,
              "Your MansaMusaAI subscription has been cancelled",
              subscriptionCancelledEmailHtml({
                name: existingSub.user.name ?? "there",
                plan: planName,
                endsAt: formatDate(period.end),
              }),
              undefined, `stripe-cancelled-${sub.id}`
            );
            await triggerWorkflows(existingSub.userId, "SUBSCRIPTION_CANCELLED", { email: existingSub.user.email, name: existingSub.user.name ?? "" });
          } catch (err) {
            console.error("[webhook] subscription cancelled email failed:", err);
          }
        });
      }

      break;
    }

    case "invoice.paid":
    case "invoice.payment_succeeded": {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubId = invoiceSubscriptionId(invoice);

      if (stripeSubId) {
        const stripeSub = await stripe.subscriptions.retrieve(stripeSubId);
        const period = subscriptionPeriod(stripeSub);
        await db.subscription.updateMany({
          where: { stripeSubscriptionId: stripeSubId },
          data: {
            status: stripeSubscriptionStatus(stripeSub.status),
            currentPeriodStart: new Date(period.start * 1000),
            currentPeriodEnd: new Date(period.end * 1000),
          },
        });

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
      const subscriptionId = invoiceSubscriptionId(invoice);
      if (subscriptionId) {
        const current = await stripe.subscriptions.retrieve(subscriptionId);
        await db.subscription.updateMany({ where: { stripeSubscriptionId: current.id }, data: { status: stripeSubscriptionStatus(current.status) } });
        if (current.status === "active" || current.status === "trialing") break;
      }
      after(async () => {
        try {
          const customerId = invoice.customer as string;
          const sub = await db.subscription.findUnique({
            where: { stripeCustomerId: customerId },
            include: { user: { select: { email: true, name: true } } },
          });
          if (sub?.user) {
            const planName = findPlanByPriceId(sub.stripePriceId)?.name ?? "your plan";
            await sendEmail(
              sub.user.email,
              "Payment failed — update your payment method",
              paymentFailedEmailHtml({
                name: sub.user.name ?? "there",
                plan: planName,
                updateUrl: `${APP}/billing`,
              }),
              undefined, `stripe-failed-${invoice.id}`
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
