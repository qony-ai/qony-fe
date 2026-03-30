export function getMidtransSnapUrl(isProduction: boolean) {
  return isProduction
    ? "https://app.midtrans.com/snap/snap.js"
    : "https://app.sandbox.midtrans.com/snap/snap.js";
}

export function isMidtransProduction() {
  return process.env.NEXT_PUBLIC_QONY_MIDTRANS_IS_PRODUCTION === "true";
}

declare global {
  interface Window {
    snap?: {
      pay: (
        token: string,
        options?: {
          onClose?: () => void;
          onError?: (result: Record<string, unknown>) => void;
          onPending?: (result: Record<string, unknown>) => void;
          onSuccess?: (result: Record<string, unknown>) => void;
        },
      ) => void;
    };
  }
}
