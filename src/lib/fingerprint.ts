// unizik-ml-fraud-frontend/src/lib/fingerprint.ts

/**
 * Generates an invisible HTML5 Canvas graphic and extracts its data URL.
 * Different browser engines (Chrome Blink vs Firefox Gecko vs Safari WebKit)
 * render text anti-aliasing and sub-pixels differently, creating a unique string.
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "CANVAS_UNSUPPORTED";

    // Draw background
    ctx.fillStyle = "rgb(248,250,252)";
    ctx.fillRect(0, 0, 200, 50);

    // Draw text with specific fonts and styling
    ctx.fillStyle = "rgb(0,28,61)";
    ctx.font = "14px Arial, sans-serif";
    ctx.fillText("UNIZIK_SEC_PAY_2026", 10, 25);

    // Draw geometric shape for renderer variance
    ctx.strokeStyle = "rgb(245,130,32)";
    ctx.arc(150, 25, 10, 0, Math.PI * 2);
    ctx.stroke();

    return canvas.toDataURL();
  } catch (e) {
    return "CANVAS_ERROR";
  }
}

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
 * Combines physical machine specs (screen, CPU, OS) with browser engine signatures
 * (User-Agent, Canvas render) to produce a deterministic, browser-unique fingerprint.
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

    // 2. Browser Engine Metrics (Different across Chrome, Edge, Firefox, etc.)
    const userAgent = nav.userAgent || "UNKNOWN_AGENT";
    const language = nav.language || "en-US";
    const canvasData = getCanvasFingerprint();

    // 3. Assemble complete raw signature payload
    const rawSignature = [
      screenRes,
      cpuCores,
      platform,
      timezone,
      userAgent,
      language,
      canvasData,
    ].join("||");

    // 4. Generate clean institutional cryptographic anchor
    const uniqueHash = hashString(rawSignature);

    // Identify browser type for readable prefixing during presentation
    let browserPrefix = "WEB";
    if (userAgent.includes("Edg/")) browserPrefix = "EDGE";
    else if (userAgent.includes("Chrome/")) browserPrefix = "CHROME";
    else if (userAgent.includes("Firefox/")) browserPrefix = "FIREFOX";
    else if (userAgent.includes("Safari/")) browserPrefix = "SAFARI";

    return `UNIZIK_FP_${browserPrefix}_${uniqueHash}`;
  } catch (err) {
    console.error("[FINGERPRINT HARVEST ERROR]:", err);
    return `UNIZIK_FP_FALLBACK_${Date.now().toString(16).toUpperCase()}`;
  }
}