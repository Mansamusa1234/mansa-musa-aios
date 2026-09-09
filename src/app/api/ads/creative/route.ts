import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { generateCreativeSuggestions } from "@/lib/ads/optimizer";

const schema = z.object({
  brand: z.string().min(1).max(120),
  offer: z.string().min(1).max(1000),
  audience: z.string().max(500).optional(),
  platform: z.enum(["META", "GOOGLE", "TIKTOK"]).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });

  const fallback = generateCreativeSuggestions(parsed.data.brand, parsed.data.offer);
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({ source: "rules", creatives: fallback });

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.ADS_CREATIVE_MODEL || "gpt-5-mini",
        temperature: 0.7,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: "You are a performance advertising creative strategist. Return JSON only: {\"creatives\":[{\"angle\":\"\",\"hook\":\"\",\"body\":\"\",\"cta\":\"\"}]}. Produce exactly 5 distinct, compliant, testable creative concepts. Do not invent performance claims or guarantees.",
          },
          {
            role: "user",
            content: `Brand: ${parsed.data.brand}\nOffer: ${parsed.data.offer}\nAudience: ${parsed.data.audience || "General"}\nPlatform: ${parsed.data.platform || "Cross-platform"}`,
          },
        ],
      }),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json?.error?.message || `Creative model error ${res.status}`);
    const text = json.choices?.[0]?.message?.content;
    const output = JSON.parse(text || "{}");
    if (!Array.isArray(output.creatives) || output.creatives.length === 0) throw new Error("Creative model returned no creatives");
    return NextResponse.json({ source: "openai", creatives: output.creatives });
  } catch (error) {
    return NextResponse.json({ source: "rules", warning: error instanceof Error ? error.message : String(error), creatives: fallback });
  }
}
