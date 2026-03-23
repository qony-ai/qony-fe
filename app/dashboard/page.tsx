import { requireAuthSession } from "@/src/lib/auth/session";
import { DashboardClient } from "@/src/features/dashboard/dashboard-client";
import { serverApi } from "@/src/lib/api/server";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await requireAuthSession("/dashboard");
  const response = await serverApi.listProjects();
  return <DashboardClient initialProjects={response.items} initialSession={session} />;
}
