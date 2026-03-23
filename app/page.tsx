import { LandingPage } from "@/src/features/landing/landing-page";
import { getAuthSession } from "@/src/lib/auth/session";

export default async function HomePage() {
  const session = await getAuthSession();
  return <LandingPage initialSession={session} />;
}
