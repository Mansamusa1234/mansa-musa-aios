import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [conversations, subscription] = await Promise.all([
    db.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { messages: true } } },
    }),
    db.subscription.findUnique({ where: { userId } }),
  ]);

  const plan = subscription?.stripePriceId ? "paid" : "free";

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {session!.user.name?.split(" ")[0] ?? "there"} 👋
        </h1>
        <p className="mt-1 text-sm text-gray-500">Here's what's happening with your account.</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total conversations", value: conversations.length },
          { label: "Plan", value: plan === "paid" ? "Paid" : "Free" },
          { label: "Status", value: subscription?.status ?? "Inactive" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-2xl font-bold text-gray-900 capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Recent conversations */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Recent conversations</h2>
          <Link href="/chat" className="text-sm font-medium text-brand-600 hover:underline">
            New chat →
          </Link>
        </div>
        {conversations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 p-12 text-center">
            <p className="text-gray-500">No conversations yet.</p>
            <Link
              href="/chat"
              className="mt-4 inline-block rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Start your first chat
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {conversations.map((c) => (
              <Link
                key={c.id}
                href={`/chat?id=${c.id}`}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm border border-gray-100 hover:border-brand-200 transition-colors"
              >
                <div>
                  <p className="font-medium text-gray-900">{c.title}</p>
                  <p className="text-xs text-gray-400">
                    {c._count.messages} messages · {new Date(c.updatedAt).toLocaleDateString()}
                  </p>
                </div>
                <span className="text-gray-300">→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
