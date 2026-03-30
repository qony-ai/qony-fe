import "server-only";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { mapRawAuthSession } from "@/src/lib/auth/shared";

import { auth, ensureAuthReady } from "@/src/lib/auth/server";

export async function getAuthSessionFromHeaders(requestHeaders: Headers) {
  await ensureAuthReady();

  const session = await auth.api.getSession({
    headers: requestHeaders,
  });

  if (!session) {
    return null;
  }

  return mapRawAuthSession(session);
}

export async function getAuthSession() {
  const requestHeaders = await headers();
  return getAuthSessionFromHeaders(requestHeaders);
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
