import type { ComponentPropsWithoutRef } from "react";

import { cn } from "@/src/lib/utils";

type ButtonVariant =
  | "primary"
  | "secondary"
  | "ghost"
  | "outline"
  | "danger";

interface ButtonProps extends ComponentPropsWithoutRef<"button"> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-[linear-gradient(135deg,var(--accent),#0fd6c1)] text-[#06261d] shadow-[0_18px_38px_rgba(14,214,193,0.26)] hover:brightness-105",
  secondary:
    "border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(84,146,121,0.24),rgba(21,75,58,0.32))] text-white hover:bg-[linear-gradient(180deg,rgba(98,168,140,0.28),rgba(24,88,67,0.36))]",
  ghost:
    "text-white/78 hover:bg-emerald-300/8 hover:text-white",
  outline:
    "border border-emerald-200/12 bg-transparent text-white hover:border-emerald-200/20 hover:bg-emerald-300/8",
  danger:
    "border border-emerald-200/12 bg-[linear-gradient(180deg,rgba(69,113,94,0.24),rgba(23,64,50,0.3))] text-white hover:bg-[linear-gradient(180deg,rgba(81,129,108,0.28),rgba(28,74,58,0.34))]",
};

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold tracking-[-0.02em] transition duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        variantClasses[variant],
        className,
      )}
      type={type}
      {...props}
    />
  );
}
