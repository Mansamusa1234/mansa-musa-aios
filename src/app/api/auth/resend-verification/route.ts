import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { createAndSendVerificationEmail } from "@/lib/email";
import { logAuditEvent } from "@/lib/audit";

const schema = z.object({ email: z.string().email() });
const GENERIC_MESSAGE = "If an account exists for that email and isn't yet verified, a new verification link has been sent.";

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.resendVerification, getIP(req));
  if (limited) return limited;

  try {
    const { email } = schema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) {
      await createAndSendVerificationEmail(user.id, user.email);
      await logAuditEvent({ userId: user.id, event: "EMAIL_VERIFICATION_SENT", ip: getIP(req) });
    }

    return NextResponse.json({ message: GENERIC_MESSAGE });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[resend-verification]", err);
    return NextResponse.json({ message: GENERIC_MESSAGE });
  }
}
