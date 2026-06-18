import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="dark flex h-screen bg-[#070712] overflow-hidden">
      <Sidebar user={session.user} />
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        <Navbar user={session.user} />
        <main className="flex-1 overflow-auto p-4 sm:p-6 pb-20 md:pb-6">
          {children}
        </main>
      </div>
    </div>
  );
}
