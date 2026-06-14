import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [totalUsers, activeSubscriptions, totalMessages, newUsersToday] = await Promise.all([
    db.user.count(),
    db.subscription.count({ where: { status: "ACTIVE" } }),
    db.message.count(),
    db.user.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
  ]);

  const stats = [
    { label: "Total users", value: totalUsers },
    { label: "Active subscriptions", value: activeSubscriptions },
    { label: "Total messages", value: totalMessages.toLocaleString() },
    { label: "New users today", value: newUsersToday },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Admin Overview</h1>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{s.label}</p>
            <p className="mt-1 text-3xl font-bold text-gray-900">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
