import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rec = await db.receptionist.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({ receptionist: rec });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name, greeting, persona, businessHours, widgetColor, isActive } = await req.json();
  const rec = await db.receptionist.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, name: name || "AI Assistant", greeting: greeting || "Hello! How can I help you today?", persona: persona || "professional, friendly", businessHours, widgetColor: widgetColor || "#6366f1", isActive: isActive !== false },
    update: { name, greeting, persona, businessHours, widgetColor, isActive, updatedAt: new Date() },
  });
  return NextResponse.json({ receptionist: rec });
}
