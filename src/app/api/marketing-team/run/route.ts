import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTodaysScript, MANSA_INTRO_SCRIPT } from "@/lib/social-automation";
import { isAbacusWorkerConfigured, runAbacusMarketingWorker } from "@/lib/abacusWorker";

const PLATFORMS = [
  "twitter",
  "linkedin",
  "facebook",
  "threads",
  "instagram",
  "tiktok",
  "youtube",
  "pinterest",
] as const;

const VIDEO_PLATFORMS = new Set(["instagram", "tiktok", "youtube", "pinterest"]);

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({})) as { campaign?: "intro" | "daily"; brief?: string };
  const script = body.campaign === "intro" ? MANSA_INTRO_SCRIPT : getTodaysScript();
  const batchId = `marketing-${Date.now()}`;

  const abacus = await runAbacusMarketingWorker({
    campaign: body.campaign ?? "daily",
    brief: body.brief?.trim() || undefined,
    fallbackTitle: script.title,
    fallbackScript: script.script,
    fallbackCaption: script.caption,
    fallbackHashtags: script.hashtags,
  });

  const rows = abacus?.drafts?.length
    ? abacus.drafts.map((draft) => ({
        type: "social_post",
        platform: draft.platform,
        title: draft.title,
        content: draft.content,
        metadata: JSON.stringify({
          batchId,
          source: "abacus-supercomputer",
          abacusRunId: abacus.runId ?? null,
          requiresVideo: Boolean(draft.requiresVideo),
          ...draft.metadata,
        }),
      }))
    : PLATFORMS.map((platform) => ({
        type: "social_post",
        platform,
        title: `${script.title} — ${platform}`,
        content: platform === "linkedin" || platform === "facebook"
          ? `${script.script}\n\n${script.hashtags.join(" ")}\n\nhttps://mansamusainitiative.com`
          : `${script.caption}\n\n${script.hashtags.join(" ")}`,
        metadata: JSON.stringify({
          batchId,
          source: "native-marketing-team",
          brief: body.brief?.trim() || null,
          requiresVideo: VIDEO_PLATFORMS.has(platform),
          script,
        }),
      }));

  const created = await db.contentQueue.createMany({ data: rows });

  return NextResponse.json({
    ok: true,
    batchId,
    queued: created.count,
    title: script.title,
    source: abacus?.drafts?.length ? "abacus-supercomputer" : "native",
    abacusConfigured: isAbacusWorkerConfigured(),
    approvalUrl: "/command-centre",
  });
}
