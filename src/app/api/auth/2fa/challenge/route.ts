import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";
import { createChallengeToken } from "@/lib/authChallenge";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.login, getIP(req));
  if (limited) return limited;

  try {
    const { email, password } = schema.parse(await req.json());

    const user = await db.user.findUnique({ where: { email } });

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

    if (!user.twoFactorEnabled) {
      return NextResponse.json({ requires2FA: false });
    }

    const challengeToken = createChallengeToken(user.id);
    return NextResponse.json({ requires2FA: true, challengeToken });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    console.error("[2fa/challenge]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
