import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const url = new URL(req.url);

  const affiliate = await db.affiliate.findUnique({ where: { code }, select: { id: true } });
  if (affiliate) {
    await db.affiliate.update({ where: { id: affiliate.id }, data: { clicks: { increment: 1 } } });
  }

  const res = NextResponse.redirect(new URL("/", url.origin));
  if (affiliate) {
    res.cookies.set("mm_aff", code, {
      maxAge: 60 * 60 * 24 * 30,
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return res;
}
