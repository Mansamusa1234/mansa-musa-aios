import { db } from "@/lib/db";

export default async function AdminUsersPage() {
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { subscription: true, _count: { select: { conversations: true } } },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-gray-900">Users</h1>
      <p className="mt-1 text-sm text-gray-500">{users.length} total users</p>

      <div className="mt-6 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-gray-100 bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Plan", "Conversations", "Joined"].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900">{u.name ?? "—"}</td>
                <td className="px-4 py-3 text-gray-500">{u.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${u.role === "ADMIN" ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-600"}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-700">
                    {u.subscription?.status ?? "Free"}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{u._count.conversations}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
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
