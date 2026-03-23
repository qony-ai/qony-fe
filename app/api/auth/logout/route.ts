import { NextResponse } from "next/server";

import { authSessionCookieName } from "@/src/lib/auth/session";

export async function POST() {
  const response = NextResponse.json({ data: { success: true } });
  response.cookies.set({
    name: authSessionCookieName,
    value: "",
    expires: new Date(0),
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
