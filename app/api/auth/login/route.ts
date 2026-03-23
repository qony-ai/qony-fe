import { NextResponse } from "next/server";

import { authenticateCredentialUser, buildSessionFromStoredUser } from "@/src/lib/auth/credentials";
import { authSessionCookieName, buildSessionCookieValue } from "@/src/lib/auth/session";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    username?: string;
    password?: string;
  } | null;
  const user = await authenticateCredentialUser({
    username: payload?.username ?? "",
    password: payload?.password ?? "",
  });

  if (!user) {
    return NextResponse.json(
      {
        error: {
          code: "invalid_credentials",
          message: "Username atau password salah.",
        },
      },
      { status: 401 },
    );
  }

  const session = buildSessionFromStoredUser(user);
  const response = NextResponse.json({ data: session });
  response.cookies.set({
    name: authSessionCookieName,
    value: buildSessionCookieValue(session),
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 14,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
