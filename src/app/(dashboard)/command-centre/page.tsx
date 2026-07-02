import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import CommandCentreClient from "./CommandCentreClient";

export const metadata = { title: "Command Centre — MansaMusaAI" };

export default async function CommandCentrePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  return <CommandCentreClient />;
}
