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
// Note: The above code assumes that the Midtrans Snap.js library is loaded and available on the window object. The getMidtransSnapUrl function returns the appropriate URL for the Snap.js library based on whether the environment is production or sandbox. The isMidtransProduction function checks the environment variable to determine if it's in production mode.
