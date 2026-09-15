import { sendEmail } from "@/lib/email";
import { withCron } from "@/lib/cronUtils";
import { db } from "@/lib/db";

const ADMIN_EMAIL = process.env.REPORT_EMAIL ?? "ai@mansamusainitiative.com";

export const GET = withCron(async () => {
  const igUserId = process.env.INSTAGRAM_USER_ID;
  const storedAccount = igUserId
    ? await db.account.findUnique({
        where: { provider_providerAccountId: { provider: "instagram-social", providerAccountId: igUserId } },
        select: { access_token: true, userId: true },
      })
    : null;
  const currentToken = storedAccount?.access_token ?? process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!currentToken) {
    return { skipped: true, reason: "INSTAGRAM_ACCESS_TOKEN not configured" };
  }
  if (!igUserId) {
    return { skipped: true, reason: "INSTAGRAM_USER_ID not configured" };
  }

  const url = `https://graph.facebook.com/v19.0/oauth/access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(currentToken)}`;

  const res = await fetch(url);
  const data = await res.json() as { access_token?: string; token_type?: string; expires_in?: number };

  if (!res.ok || !data.access_token) {
    throw new Error(`Instagram API error: ${JSON.stringify(data)}`);
  }

  const newToken = data.access_token;
  const expiresInSeconds = data.expires_in ?? 5184000;
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  const expiresAtStr = expiresAt.toISOString().split("T")[0];

  const owner = storedAccount?.userId
    ? { id: storedAccount.userId }
    : await db.user.findFirst({ where: { role: "ADMIN" }, select: { id: true } });
  if (!owner) {
    throw new Error("No administrator account is available to store the Instagram token");
  }

  await db.account.upsert({
    where: { provider_providerAccountId: { provider: "instagram-social", providerAccountId: igUserId } },
    update: {
      access_token: newToken,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      token_type: data.token_type ?? "Bearer",
    },
    create: {
      userId: owner.id,
      type: "oauth",
      provider: "instagram-social",
      providerAccountId: igUserId,
      access_token: newToken,
      expires_at: Math.floor(expiresAt.getTime() / 1000),
      token_type: data.token_type ?? "Bearer",
    },
  });

  const html = `
    <div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;color:#1a1a2e">
      <p style="font-weight:700;font-size:18px;margin:0 0 24px">MansaMusaAI</p>
      <h2 style="font-size:20px;margin:0 0 12px">Instagram Token Refreshed Automatically</h2>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        Your Instagram long-lived access token has been automatically refreshed and expires on
        <strong>${expiresAtStr}</strong>.
      </p>
      <p style="color:#4b5563;font-size:14px;line-height:1.6">
        The new token has been stored securely and will be used automatically. No Vercel update or redeployment is required.
      </p>
      <p style="color:#9ca3af;font-size:12px;margin-top:32px">Sent automatically by the monthly Instagram token refresh cron.</p>
    </div>
  `;

  await sendEmail(
    ADMIN_EMAIL,
    `Instagram token refreshed automatically — valid until ${expiresAtStr}`,
    html
  );

  return { refreshed: true, expiresAt: expiresAtStr, notifiedTo: ADMIN_EMAIL };
});
