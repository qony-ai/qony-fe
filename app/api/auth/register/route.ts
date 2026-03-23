import { NextResponse } from "next/server";

import { registerCredentialUser, buildSessionFromStoredUser } from "@/src/lib/auth/credentials";
import { authSessionCookieName, buildSessionCookieValue } from "@/src/lib/auth/session";

export async function POST(request: Request) {
  const payload = (await request.json()) as {
    username?: string;
    password?: string;
  } | null;

  try {
    const user = await registerCredentialUser({
      username: payload?.username ?? "",
      password: payload?.password ?? "",
    });
    const session = buildSessionFromStoredUser(user);
    const response = NextResponse.json({ data: session }, { status: 201 });
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
  } catch (error) {
    return NextResponse.json(
      {
        error: {
          code: "registration_failed",
          message:
            error instanceof Error ? error.message : "Registration failed.",
        },
      },
      { status: 400 },
    );
  }
}
