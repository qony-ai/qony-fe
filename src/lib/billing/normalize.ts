import type { AuthSession } from "@/src/lib/auth/types";
import type {
  BillingCheckoutResponse,
  BillingPlanCode,
  BillingProviderName,
  BillingSubscriptionStatus,
  BillingSummary,
  PaymentFlowStatus,
  PaymentStatusSnapshot,
} from "@/src/lib/billing/types";

function readString(
  source: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function readNumber(
  source: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readStringArray(
  source: Record<string, unknown>,
  ...keys: string[]
) {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value.filter((item): item is string => typeof item === "string");
    }
  }

  return null;
}

function normalizePlan(value: unknown, fallback: BillingPlanCode = "free") {
  return value === "pro" ? "pro" : fallback;
}

export function normalizePaymentFlowStatus(
  value: unknown,
  fallback: PaymentFlowStatus = "initial",
): PaymentFlowStatus {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value.toLowerCase();
  if (
    normalized === "capture" ||
    normalized === "paid" ||
    normalized === "settlement" ||
    normalized === "success"
  ) {
    return "success";
  }
  if (
    normalized === "authorize" ||
    normalized === "challenge" ||
    normalized === "pending" ||
    normalized === "processing"
  ) {
    return "pending";
  }
  if (normalized === "cancel" || normalized === "canceled") {
    return "canceled";
  }
  if (
    normalized === "deny" ||
    normalized === "error" ||
    normalized === "expire" ||
    normalized === "expired" ||
    normalized === "failed"
  ) {
    return "failed";
  }
  if (normalized === "loading") {
    return "loading";
  }
  if (normalized === "redirecting") {
    return "redirecting";
  }

  return fallback;
}

function normalizeProvider(
  value: unknown,
  fallback: BillingProviderName = "midtrans",
) {
  return value === "mock" ? "mock" : fallback;
}

export function normalizeCheckoutResponse(
  raw: unknown,
  plan: BillingPlanCode,
  clientKey: string | null,
): BillingCheckoutResponse {
  const source =
    raw && typeof raw === "object"
      ? "data" in raw && raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>)
        : (raw as Record<string, unknown>)
      : {};

  const orderId =
    readString(source, "orderId", "order_id", "transactionId", "transaction_id") ||
    `qony-${plan}-${Date.now()}`;
  const paymentId =
    readString(source, "paymentId", "payment_id", "transactionId", "transaction_id") ||
    orderId;

  return {
    clientKey,
    message: readString(source, "message", "statusMessage", "status_message"),
    orderId,
    paymentId,
    plan: normalizePlan(source.plan, plan),
    provider: normalizeProvider(source.provider),
    redirectUrl: readString(
      source,
      "redirectUrl",
      "redirect_url",
      "paymentUrl",
      "payment_url",
      "checkoutUrl",
      "checkout_url",
    ),
    snapToken: readString(
      source,
      "snapToken",
      "snap_token",
      "transactionToken",
      "transaction_token",
      "token",
    ),
    status: normalizePaymentFlowStatus(
      readString(source, "status", "transactionStatus", "transaction_status"),
      "initial",
    ),
  };
}

export function normalizeBillingSummary(
  raw: unknown,
  session: AuthSession,
  provider: BillingProviderName,
  isMock = false,
): BillingSummary {
  const source =
    raw && typeof raw === "object"
      ? "data" in raw && raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>)
        : (raw as Record<string, unknown>)
      : {};
  const planValue = source.plan ?? source.plan_id ?? source.currentPlan;
  const normalizedPlan = normalizePlan(planValue, session.plan);
  const subscriptionStatus = (
    readString(
      source,
      "subscriptionStatus",
      "subscription_status",
      "status",
    ) || (normalizedPlan === "pro" ? "active" : "inactive")
  ).toLowerCase() as BillingSubscriptionStatus;

  return {
    customerEmail:
      readString(source, "customerEmail", "customer_email", "email") ||
      session.email,
    entitlements:
      readStringArray(source, "entitlements") || session.entitlements,
    isMock,
    nextBillingAt: readString(
      source,
      "nextBillingAt",
      "next_billing_at",
      "renewsAt",
      "renews_at",
      "current_period_end",
    ),
    plan: normalizedPlan,
    planLabel: normalizedPlan === "pro" ? "Qony Pro" : "Qony Free",
    provider,
    renewsAt: readString(
      source,
      "renewsAt",
      "renews_at",
      "nextBillingAt",
      "next_billing_at",
      "current_period_end",
    ),
    subscriptionStatus,
  };
}

export function normalizePaymentStatus(
  raw: unknown,
  fallback: {
    orderId?: string | null;
    paymentId?: string | null;
    plan: BillingPlanCode;
    provider?: BillingProviderName;
    status?: PaymentFlowStatus;
  },
): PaymentStatusSnapshot {
  const source =
    raw && typeof raw === "object"
      ? "data" in raw && raw.data && typeof raw.data === "object"
        ? (raw.data as Record<string, unknown>)
        : (raw as Record<string, unknown>)
      : {};

  const status = normalizePaymentFlowStatus(
    readString(
      source,
      "status",
      "paymentStatus",
      "payment_status",
      "transactionStatus",
      "transaction_status",
    ),
    fallback.status || "pending",
  );

  return {
    amount: readNumber(source, "amount", "gross_amount"),
    currency: readString(source, "currency"),
    message: readString(source, "message", "statusMessage", "status_message"),
    orderId:
      readString(source, "orderId", "order_id", "transactionId", "transaction_id") ||
      fallback.orderId ||
      `qony-${fallback.plan}-${Date.now()}`,
    paymentId:
      readString(source, "paymentId", "payment_id", "transactionId", "transaction_id") ||
      fallback.paymentId ||
      fallback.orderId ||
      `qony-${fallback.plan}-${Date.now()}`,
    plan: normalizePlan(source.plan ?? source.plan_id, fallback.plan),
    provider: normalizeProvider(source.provider, fallback.provider || "midtrans"),
    providerStatus: readString(
      source,
      "providerStatus",
      "provider_status",
      "transactionStatus",
      "transaction_status",
      "status",
    ),
    status,
    updatedAt: readString(source, "updatedAt", "updated_at"),
  };
}
