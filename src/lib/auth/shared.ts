import type { AuthSession, UserPlan } from "@/src/lib/auth/types";

export interface RawAuthSession {
  session: {
    userId: string;
  };
  user: {
    email: string;
    emailVerified: boolean;
    entitlements?: unknown;
    id: string;
    image?: string | null;
    name: string;
    plan?: unknown;
  };
}

export function normalizePlan(value: unknown): UserPlan {
  return value === "pro" ? "pro" : "free";
}

export function normalizeEntitlements(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

export function deriveUsername(email: string, name: string) {
  const localPart = email.split("@")[0]?.trim().toLowerCase();
  if (localPart) {
    return localPart.replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "");
  }

  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "qony-user"
  );
}

export function mapRawAuthSession(session: RawAuthSession): AuthSession {
  const userId = session.user.id || session.session.userId;
  const email = session.user.email.trim().toLowerCase();
  const name = session.user.name.trim();

  return {
    email,
    emailVerified: session.user.emailVerified,
    entitlements: normalizeEntitlements(session.user.entitlements),
    id: userId,
    image: session.user.image ?? null,
    name,
    plan: normalizePlan(session.user.plan),
    username: deriveUsername(email, name),
  };
}
