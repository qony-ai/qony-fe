import type { UserPlan } from "@/src/lib/auth/types";

export type BillingPlanCode = UserPlan;
export type BillingProviderMode = "auto" | "midtrans" | "mock";
export type BillingProviderName = "midtrans" | "mock";
export type BillingSubscriptionStatus =
  | "inactive"
  | "active"
  | "pending"
  | "canceled"
  | "past_due";
export type PaymentFlowStatus =
  | "initial"
  | "loading"
  | "redirecting"
  | "success"
  | "pending"
  | "failed"
  | "canceled";

export interface BillingSummary {
  plan: BillingPlanCode;
  planLabel: string;
  provider: BillingProviderName;
  subscriptionStatus: BillingSubscriptionStatus;
  entitlements: string[];
  customerEmail: string;
  renewsAt?: string | null;
  nextBillingAt?: string | null;
  isMock?: boolean;
}

export interface BillingCheckoutRequest {
  plan: BillingPlanCode;
  source?: "billing" | "pricing";
}

export interface BillingCheckoutResponse {
  clientKey?: string | null;
  message?: string | null;
  orderId: string;
  paymentId: string;
  plan: BillingPlanCode;
  provider: BillingProviderName;
  redirectUrl?: string | null;
  snapToken?: string | null;
  status: PaymentFlowStatus;
}

export interface PaymentStatusSnapshot {
  amount?: number | null;
  currency?: string | null;
  message?: string | null;
  orderId: string;
  paymentId: string;
  plan: BillingPlanCode;
  provider: BillingProviderName;
  providerStatus?: string | null;
  status: PaymentFlowStatus;
  updatedAt?: string | null;
}
