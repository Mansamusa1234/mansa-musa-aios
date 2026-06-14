import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";

const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.register, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const { name, email, password } = schema.parse(body);

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "Email already in use." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    await db.user.create({
      data: { name, email, passwordHash },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    const e = err as any;
    console.error("[register] message:", e?.message);
    console.error("[register] code:", e?.code);
    console.error("[register] meta:", JSON.stringify(e?.meta));
    console.error("[register] DB_URL prefix:", process.env.DATABASE_URL?.slice(0, 30));
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
