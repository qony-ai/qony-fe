import { requireAuthSession } from "@/src/lib/auth/session";
import { ProjectNewClient } from "@/src/features/project-new/project-new-client";

export const dynamic = "force-dynamic";

export default async function ProjectNewPage() {
  await requireAuthSession("/project/new");
  return <ProjectNewClient />;
}
