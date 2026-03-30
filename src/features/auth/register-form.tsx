"use client";

import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  KeyRound,
  Mail,
  UserPlus,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { authClient } from "@/src/lib/auth/client";
import { buildAuthRedirectPath } from "@/src/lib/auth/navigation";
import type { OAuthProviderConfig } from "@/src/lib/auth/oauth";

import { OAuthButtons } from "./oauth-buttons";

export function RegisterForm({
  nextPath,
  providers,
}: {
  nextPath: string;
  providers: OAuthProviderConfig[];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        const response = await authClient.signUp.email({
          email,
          name,
          password,
        });

        if (response.error) {
          throw new Error(response.error.message || "Registration failed.");
        }

        router.push(nextPath);
        router.refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Registration failed.",
        );
      }
    });
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <OAuthButtons
        mode="register"
        nextPath={nextPath}
        onError={setError}
        providers={providers}
      />

      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-white/10" />
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/36">
          or create with email
        </span>
        <div className="h-px flex-1 bg-white/10" />
      </div>

      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
          Full name
        </span>
        <div className="relative">
          <UserPlus className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/32" />
          <Input
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            placeholder="Shandy Kusuma"
            required
            value={name}
            className="pl-11"
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
          Work email
        </span>
        <div className="relative">
          <Mail className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/32" />
          <Input
            autoComplete="email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@company.com"
            required
            type="email"
            value={email}
            className="pl-11"
          />
        </div>
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
          Password
        </span>
        <div className="relative">
          <KeyRound className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-white/32" />
          <Input
            autoComplete="new-password"
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Use at least 8 characters"
            required
            type={showPassword ? "text" : "password"}
            value={password}
            className="pl-11 pr-14"
          />
          <button
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/42 transition hover:text-white"
            onClick={() => setShowPassword((value) => !value)}
            type="button"
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        </div>
      </label>

      {error ? (
        <div
          className="rounded-[22px] border border-rose-400/18 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"
          role="alert"
        >
          {error}
        </div>
      ) : null}

      <Button
        className="mt-2 w-full"
        disabled={
          isPending ||
          name.trim().length < 2 ||
          !email.trim() ||
          password.trim().length < 8
        }
        type="submit"
      >
        <UserPlus className="size-4" />
        {isPending ? "Creating account..." : "Create Qony account"}
        <ArrowRight className="size-4" />
      </Button>

      <div className="rounded-[22px] border border-emerald-300/12 bg-emerald-300/6 px-4 py-3 text-sm leading-6 text-white/64">
        <p className="font-semibold text-white">What happens next</p>
        <p className="mt-2">
          New accounts land on the Free plan immediately. Pricing and billing
          stay available inside the app when you are ready to upgrade.
        </p>
      </div>

      <p className="text-sm leading-6 text-white/58">
        Already have an account?{" "}
        <Link
          className="font-semibold text-emerald-100 transition hover:text-white"
          href={`/login?next=${buildAuthRedirectPath(nextPath)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
