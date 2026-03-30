"use client";

import { useTransition } from "react";

import { authClient } from "@/src/lib/auth/client";
import { buildAuthRedirectPath } from "@/src/lib/auth/navigation";
import type { OAuthProviderConfig } from "@/src/lib/auth/oauth";
import { Button } from "@/src/components/ui/button";

function GoogleMark() {
  return (
    <svg
      aria-hidden="true"
      className="size-4"
      viewBox="0 0 24 24"
    >
      <path
        d="M21.8 12.23c0-.77-.07-1.5-.2-2.2H12v4.17h5.5a4.7 4.7 0 0 1-2.03 3.08v2.57h3.3c1.94-1.78 3.03-4.4 3.03-7.62Z"
        fill="#4285F4"
      />
      <path
        d="M12 22c2.74 0 5.03-.9 6.7-2.45l-3.3-2.57c-.92.62-2.1.99-3.4.99-2.62 0-4.84-1.77-5.63-4.16H2.95v2.64A10 10 0 0 0 12 22Z"
        fill="#34A853"
      />
      <path
        d="M6.37 13.81A5.98 5.98 0 0 1 6.05 12c0-.63.11-1.24.32-1.81V7.55H2.95A10 10 0 0 0 2 12c0 1.62.39 3.16 1.08 4.45l3.29-2.64Z"
        fill="#FBBC04"
      />
      <path
        d="M12 6.03c1.49 0 2.82.5 3.87 1.49l2.9-2.9A9.7 9.7 0 0 0 12 2 10 10 0 0 0 2.95 7.55l3.42 2.64C7.16 7.8 9.38 6.03 12 6.03Z"
        fill="#EA4335"
      />
    </svg>
  );
}

export function OAuthButtons({
  mode,
  nextPath,
  onError,
  providers,
}: {
  mode: "login" | "register";
  nextPath: string;
  onError?: (message: string | null) => void;
  providers: OAuthProviderConfig[];
}) {
  const [isPending, startTransition] = useTransition();

  if (providers.length === 0) {
    return null;
  }

  function handleProvider(providerId: OAuthProviderConfig["id"]) {
    onError?.(null);

    startTransition(async () => {
      try {
        const response = await authClient.signIn.social({
          callbackURL: nextPath,
          errorCallbackURL: `/${
            mode === "login" ? "login" : "register"
          }?next=${buildAuthRedirectPath(nextPath)}`,
          provider: providerId,
          requestSignUp: mode === "register",
        });

        if (response.error) {
          throw new Error(response.error.message || "OAuth sign-in failed.");
        }
      } catch (error) {
        onError?.(
          error instanceof Error ? error.message : "OAuth sign-in failed.",
        );
      }
    });
  }

  return (
    <div className="grid gap-3">
      {providers.map((provider) => (
        <Button
          className="w-full justify-between rounded-2xl border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(255,255,255,0.09),rgba(130,214,178,0.05))] px-4 py-3 text-white hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(130,214,178,0.09))]"
          disabled={isPending}
          key={provider.id}
          onClick={() => handleProvider(provider.id)}
          type="button"
          variant="ghost"
        >
          <span className="inline-flex items-center gap-3">
            <GoogleMark />
            {provider.label}
          </span>
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-50/56">
            OAuth
          </span>
        </Button>
      ))}
    </div>
  );
}
