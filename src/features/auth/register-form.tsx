"use client";

import { ArrowRight, KeyRound, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";

export function RegisterForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      try {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const payload = (await response.json()) as {
          error?: { message?: string };
        };

        if (!response.ok) {
          throw new Error(payload.error?.message ?? "Registration failed.");
        }

        setError(null);
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
      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
          Username
        </span>
        <Input
          onChange={(event) => setUsername(event.target.value)}
          placeholder="misal: shandy"
          required
          value={username}
        />
      </label>

      <label className="grid gap-2">
        <span className="font-mono text-[11px] uppercase tracking-[0.26em] text-emerald-50/44">
          Password
        </span>
        <Input
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimal 6 karakter"
          required
          type="password"
          value={password}
        />
      </label>

      {error ? (
        <div className="rounded-[22px] border border-emerald-200/12 bg-emerald-300/8 px-4 py-3 text-sm text-white/78">
          {error}
        </div>
      ) : null}

      <Button
        className="mt-2 w-full"
        disabled={isPending || username.trim().length < 3 || password.trim().length < 6}
        type="submit"
      >
        <UserPlus className="size-4" />
        Create account
        <ArrowRight className="size-4" />
      </Button>

      <div className="rounded-[22px] border border-emerald-300/12 bg-emerald-300/6 px-4 py-3 text-sm leading-6 text-white/64">
        <div className="inline-flex items-center gap-2 font-semibold text-white">
          <KeyRound className="size-4" />
          Demo auth note
        </div>
        <p className="mt-2">
          Untuk versi sekarang, akun disimpan lokal di frontend dan otomatis dipakai
          sebagai identitas actor ke backend Python.
        </p>
      </div>
    </form>
  );
}
