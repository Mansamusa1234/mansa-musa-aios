import type { Metadata } from "next";
import { auth } from "@/lib/auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { canUseBusinessResearch } from "@/lib/researchAccess";
import ResearchDesk from "./ResearchDesk";

export const metadata: Metadata = {
  title: "Business Research Desk | MansaMusaAI",
  description: "Evidence-led due diligence and source verification for business decisions.",
};

export default async function ResearchPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const unlocked = await canUseBusinessResearch(session.user.id, session.user.role);
  if (!unlocked) {
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-brand-500/25 bg-brand-500/5 p-7">
        <p className="text-xs font-bold uppercase tracking-widest text-brand-400">Professional feature</p>
        <h1 className="mt-2 text-3xl font-extrabold text-white">Business Research Desk</h1>
        <p className="mt-3 text-sm leading-relaxed text-gray-300">
          Build source-backed business cases, supplier checks, competitor reports, compliance files and investment due diligence. Available on Professional and Enterprise plans.
        </p>
        <Link href="/billing" className="mt-5 inline-flex rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-brand-600">
          Compare paid plans
        </Link>
      </div>
    );
  }
  return <ResearchDesk />;
}
