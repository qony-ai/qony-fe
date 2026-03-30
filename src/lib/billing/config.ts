import type { BillingPlanCode } from "@/src/lib/billing/types";

export interface PricingPlan {
  badge?: string;
  billing: string;
  code: BillingPlanCode;
  cta: string;
  description: string;
  eyebrow: string;
  featured?: boolean;
  price: string;
  summary: string;
  bullets: string[];
}

export const pricingPlans: PricingPlan[] = [
  {
    billing: "For individual analysts exploring structured case work",
    bullets: [
      "Core six-rank workspace and project dashboard",
      "Standard ingest, graph editing, and protected routes",
      "Basic export preview for one-account workflows",
      "Pricing and billing visibility inside the app",
    ],
    code: "free",
    cta: "Create free account",
    description:
      "The best way to experience the full product flow before your team upgrades.",
    eyebrow: "Explorer",
    price: "Free",
    summary: "Full product onboarding without billing friction.",
  },
  {
    badge: "Recommended",
    billing: "Monthly subscription handled through Midtrans checkout",
    bullets: [
      "Priority upgrade flow and paid subscription status",
      "Premium export experience for client-ready output",
      "Plan-aware navigation, billing states, and support affordances",
      "Future-ready foundation for more team and payment features",
    ],
    code: "pro",
    cta: "Upgrade to Pro",
    description:
      "For teams that want a more polished delivery layer and a production-grade billing path.",
    eyebrow: "Operator",
    featured: true,
    price: "Rp 299k",
    summary: "Serious workflow polish plus premium billing and export posture.",
  },
];

export const pricingComparison = [
  {
    feature: "Protected workspace and dashboard",
    free: "Included",
    pro: "Included",
  },
  {
    feature: "Structured ingest and graph editing",
    free: "Included",
    pro: "Included",
  },
  {
    feature: "Premium export layer",
    free: "Standard preview only",
    pro: "Premium-ready",
  },
  {
    feature: "Billing and upgrade controls",
    free: "Upgrade entry",
    pro: "Full subscription state",
  },
];

export const pricingFaq = [
  {
    answer:
      "The Free plan gives you the core structured workflow. Pro is the paid path surfaced through Midtrans when you need a stronger billing and premium-export posture.",
    question: "What is the difference between Free and Pro?",
  },
  {
    answer:
      "The checkout UI is opened from the frontend, but the transaction token and subscription status are expected to come from the backend billing endpoints.",
    question: "How does Midtrans fit into the flow?",
  },
  {
    answer:
      "When the payment flow finishes, the frontend routes you into a dedicated success, pending, failed, or canceled state so there is no dead end.",
    question: "What happens after payment?",
  },
];
