import { CONNECTORS } from "@/lib/connectors";
import ConnectorsClient from "@/components/admin/ConnectorsClient";

export const dynamic = "force-dynamic";

export default function AdminConnectorsPage() {
  const connectors = CONNECTORS.map((c) => ({
    key: c.key,
    name: c.name,
    category: c.category,
    description: c.description,
    configured: c.isConfigured(),
    notConfiguredReason: c.notConfiguredReason,
  }));

  return <ConnectorsClient connectors={connectors} />;
}
