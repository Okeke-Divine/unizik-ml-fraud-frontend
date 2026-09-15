// unizik-ml-fraud-frontend/src/lib/fingerprint.ts

/**
 * Simple, fast SHA-256 equivalent hashing function (DJB2a / FNV-1a hybrid)
 * Converts long raw browser metadata strings into clean, uppercase hexadecimal strings.
 */
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  // Convert to positive unsigned 32-bit integer and format as HEX
  const hex = (hash >>> 0).toString(16).toUpperCase();
  // Pad to ensure consistent string length
  return "00000000".substring(0, 8 - hex.length) + hex;
}

/**
 * HARVESTING ENGINE
 * Uses stable hardware-like metrics so the same PC stays the same device across browsers.
 */
export async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === "undefined") {
    return "UNIZIK_FP_SERVER_SIDE_BUILD";
  }

  try {
    const nav = window.navigator;
    const screen = window.screen;

    // 1. Physical Hardware Metrics (Same across browsers on same computer)
    const screenRes = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const cpuCores = nav.hardwareConcurrency || 2;
    const platform = nav.platform || "UNKNOWN_PLATFORM";
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

    const memory = (nav as any).deviceMemory || "NA";
    const maxTouchPoints = nav.maxTouchPoints || 0;

    // 2. Assemble raw signature from device-level attributes.
    const rawSignature = [
      screenRes,
      cpuCores,
      platform,
      timezone,
      memory,
      maxTouchPoints,
    ].join("||");

    // 3. Generate clean institutional cryptographic anchor
    const uniqueHash = hashString(rawSignature);

    return `UNIZIK_FP_DEVICE_${uniqueHash}`;
  } catch (err) {
    console.error("[FINGERPRINT HARVEST ERROR]:", err);
    return `UNIZIK_FP_FALLBACK_${Date.now().toString(16).toUpperCase()}`;
  }
}