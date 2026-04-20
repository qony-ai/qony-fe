import { AppShell } from "@/src/components/layout/app-shell";
import { UserTable } from "@/components/admin/UserTable";
import { requireAuthSession } from "@/src/lib/auth/session";
import { serverApi } from "@/src/lib/api/server";
import { QonyApiError } from "@/src/lib/api/core";
import type { AdminUserRead } from "@/src/lib/types/api";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await requireAuthSession("/admin/users");
  let users: AdminUserRead[] = [];

  try {
    users = await serverApi.listAdminUsers();
  } catch (error) {
    if (!(error instanceof QonyApiError && error.status === 403)) {
      throw error;
    }
  }

  return (
    <AppShell eyebrow="Admin" title="Users" description="Inspect the latest platform users and their roles." initialSession={session}>
      <UserTable users={users} />
    </AppShell>
  );
}
