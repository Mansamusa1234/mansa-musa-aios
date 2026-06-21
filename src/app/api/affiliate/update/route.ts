import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json() as {
    socialHandle?: string;
    paypalEmail?: string;
    bankDetails?: string;
  };

  const affiliate = await db.affiliate.findUnique({ where: { userId: session.user.id } });
  if (!affiliate) return NextResponse.json({ error: "No affiliate account" }, { status: 404 });

  const updated = await db.affiliate.update({
    where: { id: affiliate.id },
    data: {
      socialHandle: body.socialHandle ?? affiliate.socialHandle,
      paypalEmail:  body.paypalEmail  ?? affiliate.paypalEmail,
      bankDetails:  body.bankDetails  ?? affiliate.bankDetails,
    },
  });

  return NextResponse.json({ success: true, affiliate: updated });
}
