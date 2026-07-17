// unizik-ml-fraud-frontend/src/app/checkout/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { ShieldAlert, ShieldCheck, CreditCard, Laptop, RefreshCw, Terminal } from "lucide-react";

// Ground-truth UUIDs from our SQLite seed script
const DEMO_PROFILES = {
  normal: {
    name: "Chinedu Okafor (400L Computer Science)",
    studentId: "a21e306f-2143-4ce7-b297-a14ec839212b",
    invoiceId: "8e7c0b5f-deb4-49d0-ab73-83c516f9ec36",
    amount: 85500.00,
    feeType: "Tuition Fee - 2025/2026 Session",
    reference: `REF_${Math.floor(100000 + Math.random() * 900000)}`,
    deviceId: "BROWSER_FP_CHINEDU_PC_CLEAN",
    ipAddress: "192.168.1.15 (Campus Wi-Fi)",
    asnNumber: 0, // Clean local ISP
    pageDwellTime: 45.2, // Normal human reading speed
    hardwareMismatch: 0, // Hardware matches login token
  },
  attacker: {
    name: "Sohail Abdel (Simulated Attack Target)",
    studentId: "499539e5-47c6-4ebe-822f-c97fb32bd63a",
    invoiceId: "cf048d5c-38bb-4ad0-b21d-a49ecf3433d9",
    amount: 45000.00,
    feeType: "Acceptance Fee - 2025/2026 Session",
    reference: `BOT_${Math.floor(100000 + Math.random() * 900000)}`,
    deviceId: "BROWSER_FP_ATTACKER_BOT_NET",
    ipAddress: "185.220.101.5 (Tor/VPN Exit Node)",
    asnNumber: 1, // Anonymized Datacenter/VPN
    pageDwellTime: 2.1, // Inhuman form completion speed
    hardwareMismatch: 1, // Hijacked session token
  },
};

export default function CheckoutPortal() {
  const [mode, setMode] = useState<"normal" | "attacker">("normal");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const currentProfile = DEMO_PROFILES[mode];

  // Reset results when toggling modes
  useEffect(() => {
    setResult(null);
    setError(null);
  }, [mode]);

  const handlePaymentInitiation = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    // Prepare strict JSON payload for our /api/checkout engine
    const payload = {
      studentId: currentProfile.studentId,
      invoiceId: currentProfile.invoiceId,
      amount: currentProfile.amount,
      reference: `UNIZIK_${Math.floor(100000 + Math.random() * 900000)}`,
      deviceId: currentProfile.deviceId,
      ipAddress: currentProfile.ipAddress.split(" ")[0], // Extract raw IP
      asnNumber: currentProfile.asnNumber,
      pageDwellTime: currentProfile.pageDwellTime,
      hardwareMismatch: currentProfile.hardwareMismatch,
    };

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.status === 200) {
        setResult(data);
      } else if (response.status === 403 && data.forensicReport) {
        // AI Interception occurred (HTTP 403 Forbidden)
        setResult({
          success: false,
          intercepted: true,
          ...data.forensicReport,
        });
      } else {
        // Standard ledger error (e.g., Invoice already paid)
        setError(data.error || "Transaction could not be processed.");
      }
    } catch (err: any) {
      setError("Network communication failure with UNIZIK payment gateway.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        
        {/* Header Banner */}
        <div className="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded border border-indigo-500/20">
              Nnamdi Azikiwe University
            </span>
            <h1 className="text-2xl font-bold tracking-tight mt-2 text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-indigo-500" />
              Student Fee Payment Gateway
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Secured by Real-Time Machine Learning Behavioral Analysis
            </p>
          </div>

          {/* Thesis Demo Switcher */}
          <div className="bg-slate-900 p-1.5 rounded-lg border border-slate-800 flex gap-1">
            <button
              onClick={() => setMode("normal")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === "normal"
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🟢 Normal Student
            </button>
            <button
              onClick={() => setMode("attacker")}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-all ${
                mode === "attacker"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              🔴 Simulate Attack Bot
            </button>
          </div>
        </div>

        {/* Grid Layout: Invoice Details vs AI Telemetry Feed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Left Column: Student & Invoice Information */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 relative overflow-hidden">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-4 border-b border-slate-800 pb-2">
              Invoice Breakdown
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <label className="text-xs text-slate-500 font-mono">STUDENT IDENTITY</label>
                <div className="font-medium text-white mt-0.5">{currentProfile.name}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-mono">PAYMENT CATEGORY</label>
                <div className="font-medium text-indigo-400 mt-0.5">{currentProfile.feeType}</div>
              </div>
              <div>
                <label className="text-xs text-slate-500 font-mono">AMOUNT DUE</label>
                <div className="text-2xl font-bold text-white mt-0.5">
                  ₦{currentProfile.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <button
              onClick={handlePaymentInitiation}
              disabled={loading}
              className={`mt-6 w-full py-3 px-4 rounded-lg font-semibold text-sm transition-all flex items-center justify-center gap-2 shadow-lg ${
                mode === "normal"
                  ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/20"
                  : "bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/20"
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Analyzing Telemetry & Executing...
                </>
              ) : (
                <>Authorize & Pay ₦{currentProfile.amount.toLocaleString()}</>
              )}
            </button>
          </div>

          {/* Right Column: Background AI Telemetry (What the Model Sees) */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-4">
              <span className="font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-indigo-400" />
                Live Telemetry Feed
              </span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                STREAMING TO FLASK ML
              </span>
            </div>

            <div className="space-y-2.5 text-slate-400">
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>page_dwell_time:</span>
                <span className={mode === "attacker" ? "text-rose-400 font-bold" : "text-emerald-400 font-bold"}>
                  {currentProfile.pageDwellTime}s
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>ip_routing_asn:</span>
                <span className={mode === "attacker" ? "text-rose-400" : "text-slate-200"}>
                  {currentProfile.asnNumber === 1 ? "1 (Datacenter / VPN)" : "0 (Local Residential)"}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/50">
                <span>hardware_mismatch:</span>
                <span className={mode === "attacker" ? "text-rose-400" : "text-slate-200"}>
                  {currentProfile.hardwareMismatch === 1 ? "TRUE (Session Hijack)" : "FALSE (Verified)"}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>device_fingerprint:</span>
                <span className="text-slate-300 truncate max-w-[150px]">{currentProfile.deviceId}</span>
              </div>
            </div>

            <div className="mt-6 p-3 bg-slate-950 rounded border border-slate-800/80 text-[11px] text-slate-500 leading-relaxed">
              <span className="text-indigo-400 font-semibold">ENGINE ARCHITECTURE:</span> When "Authorize" is clicked, this vector is aggregated against historical SQLite velocity records and evaluated by the Scikit-Learn Decision Tree binary.
            </div>
          </div>
        </div>

        {/* Standard Database Error Notice */}
        {error && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8 flex items-start gap-3 text-amber-300 text-sm">
            <Terminal className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Ledger Rejection Notice</span>
              {error}
              <div className="mt-2 text-xs text-amber-400/80">
                Tip: If this invoice is already PAID from a previous test, run <code className="bg-amber-950 px-1.5 py-0.5 rounded border border-amber-800">npx prisma db seed</code> in your terminal to reset test invoices back to PENDING.
              </div>
            </div>
          </div>
        )}

        {/* AI VERDICT DISPLAY: Cleared vs Intercepted */}
        {result && (
          <div
            className={`rounded-xl p-6 border transition-all animate-in fade-in slide-in-from-bottom-4 duration-300 ${
              result.verdict === "FRAUDULENT" || result.intercepted
                ? "bg-rose-950/20 border-rose-500/30 text-rose-200"
                : "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
            }`}
          >
            <div className="flex items-start gap-4">
              {result.verdict === "FRAUDULENT" || result.intercepted ? (
                <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/20 shrink-0">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
              ) : (
                <div className="p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shrink-0">
                  <ShieldCheck className="w-8 h-8 text-emerald-500" />
                </div>
              )}

              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3 mb-3 border-current/10">
                  <div>
                    <span className="text-xs font-mono tracking-widest uppercase opacity-75">
                      AI ENGINE VERDICT
                    </span>
                    <h3 className="text-xl font-bold tracking-tight">
                      {result.verdict === "FRAUDULENT" || result.intercepted
                        ? "TRANSACTION BLOCKED BY AI"
                        : "TRANSACTION CLEARED & AUTHORIZED"}
                    </h3>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-mono block opacity-75">CONFIDENCE SCORE</span>
                    <span className="text-lg font-mono font-bold">
                      {(result.confidence * 100).toFixed(2)}%
                    </span>
                  </div>
                </div>

                {/* White-Box Audit Explanation */}
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-xs font-mono uppercase opacity-70 block">
                      FORENSIC EXPLANATION
                    </span>
                    <p className="font-medium mt-0.5 leading-relaxed bg-black/20 p-3 rounded border border-current/10">
                      {result.explanation}
                    </p>
                  </div>
                  
                  <div className="flex justify-between items-center text-xs font-mono opacity-70 pt-2">
                    <span>TRANSACTION ID: {result.transactionId}</span>
                    <span>STATUS: {result.status}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}