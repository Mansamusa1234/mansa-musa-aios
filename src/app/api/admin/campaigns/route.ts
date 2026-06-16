import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit, limiters } from "@/lib/ratelimit";
import { sendEmail } from "@/lib/email";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [campaigns, subscriberCount] = await Promise.all([
    db.emailCampaign.findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
    db.newsletterSubscriber.count({ where: { status: "SUBSCRIBED" } }),
  ]);

  return NextResponse.json({ campaigns, subscriberCount });
}

export async function POST(req: Request) {
  const session = await auth();
  if (session?.user?.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const limited = await checkRateLimit(limiters.admin, session.user.id);
  if (limited) return limited;

  const { subject, bodyHtml } = await req.json();
  if (!subject || !bodyHtml) {
    return NextResponse.json({ error: "Subject and body are required." }, { status: 400 });
  }

  const subscribers = await db.newsletterSubscriber.findMany({ where: { status: "SUBSCRIBED" } });

  const campaign = await db.emailCampaign.create({
    data: { subject, bodyHtml, status: "SENDING", recipientCount: subscribers.length },
  });

  let sentCount = 0;
  let failedCount = 0;

  await Promise.all(
    subscribers.map(async (sub) => {
      const unsubscribeUrl = `${process.env.NEXTAUTH_URL}/api/newsletter/unsubscribe?token=${sub.unsubscribeToken}`;
      const html = `${bodyHtml}<p style="margin-top:32px;color:#9ca3af;font-size:11px">
        <a href="${unsubscribeUrl}" style="color:#9ca3af">Unsubscribe</a>
      </p>`;
      const result = await sendEmail(sub.email, subject, html);
      if (result.sent) sentCount++; else failedCount++;
    })
  );

  const updated = await db.emailCampaign.update({
    where: { id: campaign.id },
    data: { status: "SENT", sentCount, failedCount, sentAt: new Date() },
  });

  return NextResponse.json({ success: true, campaign: updated });
}
