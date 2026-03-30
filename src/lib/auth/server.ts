import "server-only";

import { betterAuth } from "better-auth";
import { memoryAdapter } from "better-auth/adapters/memory";
import { nextCookies } from "better-auth/next-js";
import { Pool } from "pg";

import type { OAuthProviderConfig } from "@/src/lib/auth/oauth";
import type { UserPlan } from "@/src/lib/auth/types";

const authDatabaseUrl = process.env.QONY_AUTH_DATABASE_URL?.trim();
const authSecret =
  process.env.QONY_AUTH_SECRET ??
  process.env.BETTER_AUTH_SECRET ??
  process.env.AUTH_SECRET ??
  "qony-dev-session-secret";

const globalForAuth = globalThis as typeof globalThis & {
  qonyAuthPool?: Pool;
  qonyAuthMemory?:
    | Record<string, Array<Record<string, unknown>>>
    | undefined;
  qonyAuthReadyPromise?: Promise<void>;
};

function collectTrustedOrigins() {
  const values = [
    process.env.QONY_APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    ...(process.env.QONY_TRUSTED_ORIGINS?.split(",") ?? []),
  ];

  return values
    .map((value) => value?.trim())
    .filter((value): value is string => Boolean(value));
}

function getPool() {
  if (!authDatabaseUrl) {
    return null;
  }

  if (!globalForAuth.qonyAuthPool) {
    globalForAuth.qonyAuthPool = new Pool({
      connectionString: authDatabaseUrl,
    });
  }

  return globalForAuth.qonyAuthPool;
}

function getMemoryAuthStore() {
  if (!globalForAuth.qonyAuthMemory) {
    globalForAuth.qonyAuthMemory = {
      user: [],
      account: [],
      session: [],
      verification: [],
    };
  }

  return globalForAuth.qonyAuthMemory;
}

function isGoogleOAuthConfigured() {
  return Boolean(
    process.env.QONY_GOOGLE_CLIENT_ID?.trim() &&
      process.env.QONY_GOOGLE_CLIENT_SECRET?.trim(),
  );
}

function buildSocialProviders() {
  if (!isGoogleOAuthConfigured()) {
    return undefined;
  }

  return {
    google: {
      accessType: "offline" as const,
      clientId: process.env.QONY_GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.QONY_GOOGLE_CLIENT_SECRET as string,
    },
  };
}

export const auth = betterAuth({
  appName: "Qony AI",
  basePath: "/api/auth",
  baseURL:
    process.env.QONY_APP_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    undefined,
  secret: authSecret,
  trustedOrigins: collectTrustedOrigins(),
  database:
    getPool() ??
    memoryAdapter(getMemoryAuthStore(), {
      debugLogs: false,
    }),
  emailAndPassword: {
    autoSignIn: true,
    enabled: true,
    maxPasswordLength: 128,
    minPasswordLength: 8,
  },
  plugins: [nextCookies()],
  socialProviders: buildSocialProviders(),
  user: {
    additionalFields: {
      entitlements: {
        defaultValue: () => [],
        input: false,
        required: false,
        type: "string[]",
      },
      plan: {
        defaultValue: "free" satisfies UserPlan,
        input: false,
        required: false,
        type: "string",
      },
    },
  },
});

export async function ensureAuthReady() {
  if (!authDatabaseUrl || process.env.QONY_AUTH_AUTO_MIGRATE !== "true") {
    return;
  }

  if (!globalForAuth.qonyAuthReadyPromise) {
    globalForAuth.qonyAuthReadyPromise = auth.$context.then(async (context) => {
      await context.runMigrations();
    });
  }

  await globalForAuth.qonyAuthReadyPromise;
}

export function getConfiguredOAuthProviders() {
  return [
    isGoogleOAuthConfigured()
      ? {
          id: "google" as const,
          label: "Continue with Google",
          shortLabel: "Google",
        }
      : null,
  ].filter((provider): provider is OAuthProviderConfig => provider !== null);
}
