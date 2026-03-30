"use client";

import Script from "next/script";

import { getMidtransSnapUrl } from "@/src/lib/billing/midtrans";

export function MidtransSnapScript({
  clientKey,
  enabled,
  isProduction,
  onError,
  onReady,
}: {
  clientKey: string | null;
  enabled: boolean;
  isProduction: boolean;
  onError: () => void;
  onReady: () => void;
}) {
  if (!enabled || !clientKey) {
    return null;
  }

  return (
    <Script
      data-client-key={clientKey}
      id="qony-midtrans-snap"
      onError={onError}
      onLoad={onReady}
      src={getMidtransSnapUrl(isProduction)}
      strategy="afterInteractive"
    />
  );
}
