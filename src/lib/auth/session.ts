import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import type { AuthSession } from "@/src/lib/auth/types";

export const authSessionCookieName = "qony_auth_session";

const authSessionSecret =
  process.env.QONY_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "qony-dev-session-secret";

function signPayload(payload: string) {
  return createHmac("sha256", authSessionSecret)
    .update(payload)
    .digest("base64url");
}

function hasValidActorEmailShape(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function deriveActorEmail(username: string) {
  return `${username}@qony.ai`;
}

function normalizeSessionEmail(email: string, username: string) {
  const normalized = email.trim().toLowerCase();

  if (hasValidActorEmailShape(normalized) && !normalized.endsWith("@qony.local")) {
    return normalized;
  }

  return deriveActorEmail(username);
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

function encodeSession(session: AuthSession) {
  const payload = Buffer.from(JSON.stringify(session), "utf8").toString(
    "base64url",
  );
  return `${payload}.${signPayload(payload)}`;
}

function decodeSession(value: string): AuthSession | null {
  try {
    const [payload, signature] = value.split(".");
    if (!payload || !signature || !signaturesMatch(signature, signPayload(payload))) {
      return null;
    }

    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as Partial<AuthSession>;
    if (
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      !parsed.username.trim() ||
      !parsed.email.trim() ||
      !parsed.name.trim()
    ) {
      return null;
    }

    return {
      username: parsed.username.trim().toLowerCase(),
      email: normalizeSessionEmail(
        parsed.email.trim(),
        parsed.username.trim().toLowerCase(),
      ),
      name: parsed.name.trim(),
    };
  } catch {
    return null;
  }
}

export async function getAuthSession() {
  const cookieStore = await cookies();
  const raw = cookieStore.get(authSessionCookieName)?.value;
  if (!raw) {
    return null;
  }

  return decodeSession(raw);
}

export async function requireAuthSession(nextPath: string) {
  const session = await getAuthSession();
  if (!session) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return session;
}

export async function redirectIfAuthenticated(destination = "/dashboard") {
  const session = await getAuthSession();
  if (session) {
    redirect(destination);
  }
}

export function buildSessionCookieValue(session: AuthSession) {
  return encodeSession(session);
}
