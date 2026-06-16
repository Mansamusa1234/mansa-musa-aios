import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const ROLE_STYLES: Record<string, string> = {
  ADMIN: "bg-brand-500/15 text-brand-300",
  USER:  "bg-gray-500/10 text-gray-400",
};

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscription: true, _count: { select: { conversations: true } } },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-white">Users</h1>
      <p className="mt-1 text-sm text-gray-500">{users.length} total users</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-white/8 bg-white/3">
        <table className="w-full text-sm">
          <thead className="border-b border-white/6 bg-white/3">
            <tr>
              {["Name", "Email", "Role", "Plan", "Conversations", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/4">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/3 transition-colors">
                <td className="px-4 py-3 font-medium text-white">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${ROLE_STYLES[u.role] ?? ROLE_STYLES.USER}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-500/15 px-2 py-0.5 text-xs font-semibold text-brand-300">
                    {u.subscription?.status ?? "Free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u._count.conversations}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
