import "server-only";

import type { AuthSession } from "@/src/lib/auth/types";
import { buildInternalActorToken } from "@/src/lib/auth/internal-actor";
import {
  normalizeBillingSummary,
  normalizeCheckoutResponse,
  normalizePaymentStatus,
} from "@/src/lib/billing/normalize";
import type {
  BillingCheckoutRequest,
  BillingCheckoutResponse,
  BillingProviderName,
  BillingProviderMode,
  BillingSummary,
  PaymentFlowStatus,
  PaymentStatusSnapshot,
} from "@/src/lib/billing/types";

const PLAN_AMOUNT: Record<string, number> = {
  free: 0,
  pro: 299000,
};

function backendBaseUrl() {
  return (
    process.env.QONY_API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL ??
    "http://127.0.0.1:8000"
  );
}

function readBillingProviderMode(): BillingProviderMode {
  const raw = (
    process.env.QONY_BILLING_PROVIDER ??
    process.env.NEXT_PUBLIC_QONY_BILLING_PROVIDER ??
    "auto"
  ).trim();

  if (raw === "mock" || raw === "midtrans") {
    return raw;
  }

  return "auto";
}

function midtransClientKey() {
  return process.env.NEXT_PUBLIC_QONY_MIDTRANS_CLIENT_KEY?.trim() || null;
}

function buildAuthHeaders(session: AuthSession) {
  const internalToken = buildInternalActorToken(session);

  if (internalToken) {
    return {
      Authorization: `Bearer ${internalToken}`,
    };
  }

  return {
    "X-User-Email": session.email,
    "X-User-Name": session.name,
  };
}

async function fetchBackend(
  path: string,
  session: AuthSession,
  init: RequestInit = {},
) {
  const headers = new Headers(init.headers);
  if (!(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  for (const [key, value] of Object.entries(buildAuthHeaders(session))) {
    headers.set(key, value);
  }

  const response = await fetch(`${backendBaseUrl()}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as unknown) : null;

  if (!response.ok) {
    throw new Error(
      (payload &&
        typeof payload === "object" &&
        "error" in payload &&
        payload.error &&
        typeof payload.error === "object" &&
        "message" in payload.error &&
        typeof payload.error.message === "string"
          ? payload.error.message
          : null) || `Billing request failed with status ${response.status}.`,
    );
  }

  return payload;
}

function buildMockSummary(session: AuthSession): BillingSummary {
  return normalizeBillingSummary(null, session, "mock", true);
}

export async function getBillingSummary(
  session: AuthSession,
): Promise<BillingSummary> {
  const mode = readBillingProviderMode();
  if (mode === "mock") {
    return buildMockSummary(session);
  }

  try {
    const response = await fetchBackend("/api/v1/payment/subscription", session);
    return normalizeBillingSummary(
      response,
      session,
      "midtrans",
    );
  } catch (error) {
    if (mode === "auto") {
      return buildMockSummary(session);
    }

    throw error;
  }
}

export async function createBillingCheckout(
  session: AuthSession,
  request: BillingCheckoutRequest,
): Promise<BillingCheckoutResponse> {
  const mode = readBillingProviderMode();
  const clientKey = midtransClientKey();

  if (mode === "mock") {
    return {
      clientKey,
      message: "Mock billing flow enabled.",
      orderId: `mock-order-${Date.now()}`,
      paymentId: `mock-payment-${Date.now()}`,
      plan: request.plan,
      provider: "mock",
      redirectUrl: `/billing/success?payment_id=mock-payment-${Date.now()}&plan=${request.plan}&provider=mock`,
      status: "success",
    };
  }

  try {
    const payload = await fetchBackend("/api/v1/payment/checkout", session, {
      body: JSON.stringify({
        amount: PLAN_AMOUNT[request.plan] ?? PLAN_AMOUNT.pro,
        currency: "IDR",
        customer_email: session.email,
        customer_name: session.name,
        plan_id: request.plan,
      }),
      method: "POST",
    });

    return normalizeCheckoutResponse(payload, request.plan, clientKey);
  } catch (error) {
    if (mode === "auto") {
      return {
        clientKey,
        message:
          error instanceof Error
            ? `${error.message} Falling back to mock billing for local development.`
            : "Falling back to mock billing for local development.",
        orderId: `mock-order-${Date.now()}`,
        paymentId: `mock-payment-${Date.now()}`,
        plan: request.plan,
        provider: "mock",
        redirectUrl: `/billing/success?payment_id=mock-payment-${Date.now()}&plan=${request.plan}&provider=mock`,
        status: "success",
      };
    }

    throw error;
  }
}

export async function getBillingPaymentStatus(
  session: AuthSession,
  searchParams: URLSearchParams,
): Promise<PaymentStatusSnapshot> {
  const mode = readBillingProviderMode();
  const fallback = {
    orderId: searchParams.get("order_id"),
    paymentId: searchParams.get("payment_id"),
    plan:
      searchParams.get("plan") === "pro"
        ? "pro"
        : session.plan,
    provider: (searchParams.get("provider") === "mock"
      ? "mock"
      : "midtrans") as BillingProviderName,
    status:
      (searchParams.get("status") as PaymentFlowStatus | null | undefined) ??
      undefined,
  };

  if (mode === "mock" || fallback.provider === "mock") {
    return normalizePaymentStatus(null, fallback);
  }

  try {
    const response = await fetchBackend("/api/v1/payment/subscription", session);
    return normalizePaymentStatus(response, fallback);
  } catch (error) {
    if (mode === "auto") {
      return normalizePaymentStatus(null, fallback);
    }

    throw error;
  }
}
