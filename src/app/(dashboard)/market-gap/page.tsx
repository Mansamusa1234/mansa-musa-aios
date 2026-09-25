import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import MarketGapContent from "./MarketGapContent";

export const metadata: Metadata = {
  title: "Market Gap Intelligence | MansaMusaAI",
  description: "Validate ideas with competitor, market-gap, YouTube and social research.",
};

export const dynamic = "force-dynamic";

export default async function MarketGapPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <MarketGapContent />;
}
