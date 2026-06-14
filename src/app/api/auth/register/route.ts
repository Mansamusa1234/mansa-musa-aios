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
    const dbUrl = process.env.DATABASE_URL;
    return NextResponse.json({
      error: "Internal server error.",
      _debug: {
        message: e?.message?.slice(0, 300),
        dbUrlLength: dbUrl?.length,
        dbUrlStart: dbUrl?.slice(0, 20),
        dbUrlCharCodes: dbUrl ? [...dbUrl.slice(0, 5)].map(c => c.charCodeAt(0)) : null,
      },
    }, { status: 500 });
  }
}
