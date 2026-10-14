// Webhook payloads use the endpoint API version, independently of the SDK's
// request version. Accept Acacia and Basil/Dahlia shapes during migration.
type Reference = string | { id: string } | null | undefined;

export function stripeObjectId(value: Reference): string | null {
  return typeof value === "string" ? value : value?.id ?? null;
}

export function invoiceSubscriptionId(invoice: {
  subscription?: Reference;
  parent?: { subscription_details?: { subscription?: Reference } | null } | null;
}): string | null {
  return stripeObjectId(invoice.parent?.subscription_details?.subscription) ??
    stripeObjectId(invoice.subscription);
}

export function subscriptionPeriod(subscription: {
  current_period_start?: number;
  current_period_end?: number;
  items: { data: Array<{ id?: string; current_period_start?: number; current_period_end?: number }> };
}): { start: number; end: number } {
  const item = subscription.items.data[0];
  const start = item?.current_period_start ?? subscription.current_period_start;
  const end = item?.current_period_end ?? subscription.current_period_end;
  if (typeof start !== "number" || typeof end !== "number" ||
      !Number.isFinite(start) || !Number.isFinite(end) || end < start) {
    throw new Error("Stripe subscription has no valid billing period");
  }
  return { start, end };
}
