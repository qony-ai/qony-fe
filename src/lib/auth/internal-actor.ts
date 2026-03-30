import "server-only";

import { createHmac } from "node:crypto";

import type { AuthSession } from "@/src/lib/auth/types";

const internalActorSecret = process.env.QONY_INTERNAL_ACTOR_SECRET?.trim();
const internalActorIssuer =
  process.env.QONY_INTERNAL_ACTOR_ISSUER?.trim() || "qony-fe";
const internalActorAudience =
  process.env.QONY_INTERNAL_ACTOR_AUDIENCE?.trim() || "qony-be";

function encodeSegment(value: Record<string, unknown>) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

export function buildInternalActorToken(session: AuthSession) {
  if (!internalActorSecret) {
    return null;
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const header = encodeSegment({
    alg: "HS256",
    typ: "JWT",
  });
  const payload = encodeSegment({
    aud: internalActorAudience,
    email: session.email,
    entitlements: session.entitlements,
    exp: issuedAt + 60 * 5,
    iat: issuedAt,
    iss: internalActorIssuer,
    name: session.name,
    plan: session.plan,
    sub: session.id,
  });
  const signature = createHmac(
    "sha256",
    internalActorSecret,
  ).update(`${header}.${payload}`).digest("base64url");

  return `${header}.${payload}.${signature}`;
}
