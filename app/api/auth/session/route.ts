import { NextResponse } from "next/server";

import {
  authSessionCookieName,
  buildSessionCookieValue,
  getAuthSession,
} from "@/src/lib/auth/session";

export async function GET() {
  const session = await getAuthSession();
  const response = NextResponse.json({ data: session });

  if (session) {
    response.cookies.set({
      name: authSessionCookieName,
      value: buildSessionCookieValue(session),
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 14,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
  }

  return response;
}
