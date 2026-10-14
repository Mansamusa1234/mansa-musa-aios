import crypto from "crypto";
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { createChallengeToken } from "@/lib/authChallenge";
import { loginCodeEmailHtml, sendEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().trim().email().transform((value) => value.toLowerCase()),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.login, getIP(req));
  if (limited) return limited;

  try {
    const { email, password } = schema.parse(await req.json());

    const user = await db.user.findFirst({ where: { email: { equals: email, mode: "insensitive" } } });

    if (!user?.passwordHash) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return NextResponse.json({ error: "Account temporarily locked. Please try again later." }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      const lock = attempts >= 5;
      await db.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil: lock ? new Date(Date.now() + 15 * 60 * 1000) : null,
        },
      });
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    // Reset failure counter on successful password check
    if (user.failedLoginAttempts > 0) {
      await db.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }

    const challengeToken = createChallengeToken(user.id);

    if (user.twoFactorEnabled) {
      return NextResponse.json({ requires2FA: true, challengeToken, method: "totp" });
    }

    // Every password sign-in requires a second factor. Users without an
    // authenticator app receive a one-time code at their verified account email.
    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
    const identifier = `login:${user.id}`;
    const token = crypto.createHash("sha256").update(code).digest("hex");

    await db.verificationToken.deleteMany({ where: { identifier } });
    await db.verificationToken.create({
      data: {
        identifier,
        token,
        expires: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    const sent = await sendEmail(
      user.email,
      "Your MansaMusaAI sign-in code",
      loginCodeEmailHtml(code)
    );

    if (!sent.sent) {
      await db.verificationToken.deleteMany({ where: { identifier } });
      return NextResponse.json(
        { error: "We couldn't send your sign-in code. Please try again." },
        { status: 503 }
      );
    }

    return NextResponse.json({ requires2FA: true, challengeToken, method: "email" });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[2fa/challenge]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
