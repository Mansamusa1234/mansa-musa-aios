import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";

const COOKIE_NAME = "mm_aff";
const COOKIE_DAYS = 90;

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const dest = req.nextUrl.searchParams.get("dest") ?? "/";

  const affiliate = await db.affiliate.findUnique({
    where: { code, status: "APPROVED" },
    select: { id: true },
  });

  const response = NextResponse.redirect(new URL(dest, req.url));

  if (affiliate) {
    // Set 90-day tracking cookie
    response.cookies.set(COOKIE_NAME, code, {
      maxAge: COOKIE_DAYS * 24 * 60 * 60,
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    });

    // Log the click (fire-and-forget)
    void db.affiliateClick.create({
      data: {
        affiliateId: affiliate.id,
        ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
        userAgent: req.headers.get("user-agent") ?? null,
        referrer: req.headers.get("referer") ?? null,
      },
    }).then(() =>
      db.affiliate.update({
        where: { id: affiliate.id },
        data: { clicks: { increment: 1 } },
      })
    ).catch(() => {});
  }

  return response;
}
