import ApprovalQueueClient, { type SocialMode } from "@/components/admin/ApprovalQueueClient";
import { isMetricoolConfigured, metricoolDraftMode, SOCIAL_NETWORKS } from "@/lib/metricool";
import { directPublishEnabled, networkConfigured, networkEnabled } from "@/lib/socialPublisher";

export const dynamic = "force-dynamic";

// The approval button must say what approving will actually do. This mirrors the order the
// approval route uses: Metricool (if configured), then direct publishing, else manual.
export default async function ApprovalQueuePage() {
  const socialMode: SocialMode = isMetricoolConfigured()
    ? (metricoolDraftMode() ? "metricool-draft" : "metricool-schedule")
    : directPublishEnabled() ? "direct" : "manual";
  const liveNetworks = socialMode === "direct"
    ? (await Promise.all(SOCIAL_NETWORKS.map(async (n) => (networkEnabled(n) && await networkConfigured(n) ? n : null)))).filter((n): n is (typeof SOCIAL_NETWORKS)[number] => !!n)
    : [];
  return <ApprovalQueueClient socialMode={socialMode} liveNetworks={liveNetworks} />;
}
