import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit, getIP, limiters } from "@/lib/ratelimit";

const schema = z.object({
  name:    z.string().min(1).max(100),
  email:   z.string().email(),
  subject: z.string().max(200).optional(),
  message: z.string().min(20).max(2000),
});

export async function POST(req: Request) {
  const limited = await checkRateLimit(limiters.publicWrite, getIP(req));
  if (limited) return limited;

  try {
    const body = await req.json();
    const data = schema.parse(body);
    console.info(JSON.stringify({ level: "info", message: "contact_form_received", hasSubject: !!data.subject }));
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
