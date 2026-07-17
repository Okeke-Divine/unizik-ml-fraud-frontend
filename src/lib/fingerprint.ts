// unizik-ml-fraud-frontend/src/lib/fingerprint.ts

/**
 * HARDWARE FINGERPRINT GENERATOR
 * Silently extracts immutable browser and machine characteristics,
 * compiling them into a SHA-256 cryptographic hardware signature.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "SERVER_SIDE_EXECUTION_FALLBACK";
  }

  try {
    const nav = window.navigator;
    const screen = window.screen;

    // Compile hardware and OS signals
    const components = [
      nav.userAgent || "UNKNOWN_USER_AGENT",
      nav.language || "UNKNOWN_LANGUAGE",
      screen.colorDepth || "0",
      `${screen.width}x${screen.height}`,
      `${screen.availWidth}x${screen.availHeight}`,
      new Date().getTimezoneOffset().toString(),
      nav.maxTouchPoints || "0",
      nav.hardwareConcurrency || "2", // CPU core count
      // @ts-ignore - Device memory in GB (if supported by browser)
      nav.deviceMemory || "4",
      Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
    ];

    const rawString = components.join("||");

    // Execute SHA-256 cryptographic hashing via native browser Web Crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(rawString);
    const hashBuffer = await window.crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

    return `UNIZIK_FP_${hashHex.substring(0, 32).toUpperCase()}`;
  } catch (error) {
    console.warn("[FINGERPRINT ERROR] Falling back to timestamp entropy:", error);
    return `UNIZIK_FP_FALLBACK_${Math.random().toString(36).substring(2, 15).toUpperCase()}`;
  }
}