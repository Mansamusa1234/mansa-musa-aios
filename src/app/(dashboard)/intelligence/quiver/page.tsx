import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getActivePlan, hasFeature } from "@/lib/subscription";
import QuiverContent from "./QuiverContent";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mansa Market Intelligence | MansaMusaAI",
  description:
    "Congressional trading, insider transactions, government contracts & lobbying data powered by Quiver Quantitative.",
};

export default async function QuiverPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const plan = await getActivePlan(session.user.id);

  if (!hasFeature(plan, "quiver_intel")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5 text-center px-4">
        <div className="text-5xl">📊</div>
        <h1 className="text-2xl font-bold text-white">Mansa Market Intelligence</h1>
        <p className="text-gray-400 max-w-md text-sm leading-relaxed">
          Access congressional trading disclosures, insider transactions, government contracts, and
          lobbying data — all in one dashboard powered by Quiver Quantitative.
          <br />
          Available on the <strong className="text-white">Starter plan</strong> and above.
        </p>
        <Link
          href="/billing"
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-500 transition-colors"
        >
          Upgrade Now
        </Link>
      </div>
    );
  }

  return <QuiverContent />;
}
