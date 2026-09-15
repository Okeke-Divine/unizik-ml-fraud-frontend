// unizik-ml-fraud-frontend/src/app/checkout/[invoiceId]/page.tsx
"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, AlertCircle, RefreshCw, Lock, Building2, AlertTriangle, CheckCircle2 } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";
import StudentHeader from "@/components/StudentHeader";
import BackButton from "@/components/BackButton";
import DiagnosticsPanel from "@/components/DiagnosticsPanel";
import useRequireStudent from '@/lib/useRequireStudent';

export default function CheckoutPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const { invoiceId } = use(params);

  const [user, setUser] = useState<any | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [deviceId, setDeviceId] = useState("");
  const [mismatch, setMismatch] = useState(0);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  
  // Diagnostics panel persisted values (read from localStorage to avoid provider coupling)
  const getDiag = () => {
    try {
      const raw = localStorage.getItem('unizik_diag_values');
      const editedRaw = localStorage.getItem('unizik_diag_edited');
      return { values: raw ? JSON.parse(raw) : {}, isEdited: editedRaw ? JSON.parse(editedRaw) : false };
    } catch (e) {
      return { values: {}, isEdited: false };
    }
  };

  const { values: diagValues, isEdited } = getDiag();

  useRequireStudent();

  // High-precision timer for behavioral dwell-time telemetry
  const startTime = useRef(performance.now());

  useEffect(() => {
    // 1. Retrieve authenticated student session
    const storedUser = localStorage.getItem("unizik_user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      setUser(parsed);
    } else {
      router.push("/login");
      return;
    }

    // 2. Fetch Invoice Details
    fetch(`/api/invoices?studentId=null&invoiceId=${invoiceId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoice(data.invoice);
        } else {
          setPaymentError("Unable to load billing details for this invoice.");
        }
      })
      .catch(() => setPaymentError("Network communication error with the central ledger."));

    // 3. Initialize background telemetry
    const initTelemetry = async () => {
      const currentFP = await generateDeviceFingerprint();
      setDeviceId(currentFP);
      try { localStorage.setItem('unizik_device_id', currentFP); } catch (e) {}

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.loginDeviceId && parsedUser.loginDeviceId !== currentFP) {
          setMismatch(1);
        }
      }
      setLoading(false);
    };

    initTelemetry();
    // reset dwell timer when invoice changes / on navigation
    startTime.current = performance.now();
  }, [invoiceId, router]);

  const handlePay = async () => {
    if (!user || !invoice) return;

    setProcessing(true);
    setPaymentError(null);

    // Build payload using Diagnostics panel values when available. Read diagnostics snapshot fresh.
    const currentDiagRaw = localStorage.getItem('unizik_diag_values');
    const currentEditedRaw = localStorage.getItem('unizik_diag_edited');
    const currentDiag = currentDiagRaw ? JSON.parse(currentDiagRaw) : {};
    const currentEdited = currentEditedRaw ? JSON.parse(currentEditedRaw) : false;
    const runtimeDeviceId = localStorage.getItem('unizik_device_id') || deviceId;

    const realDwellTime = (performance.now() - startTime.current) / 1000;
    const liveOffPeak = (() => {
      const now = new Date();
      const hour = now.getHours();
      const minute = now.getMinutes();
      if (hour >= 1 && hour < 4) return 1;
      if (hour === 4 && minute <= 30) return 1;
      return 0;
    })();

    const payload = {
      studentId: user.id,
      invoiceId: invoiceId,
      amount: invoice.amount || 0,
      reference: `PAY_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
      deviceId: runtimeDeviceId,
      pageDwellTime: currentDiag.page_dwell_time_seconds ?? realDwellTime,
      hardwareMismatch: currentDiag.session_hardware_mismatch ?? mismatch,
      clientOffPeakHour: currentDiag.is_off_peak_hour ?? liveOffPeak,
      // If the diagnostics panel has edits, include explicit feature overrides and mark source SIMULATED
      overrideFeatures: currentEdited ? {
        device_student_count_24h: currentDiag.device_student_count_24h,
        page_dwell_time_seconds: currentDiag.page_dwell_time_seconds,
        is_high_risk_asn: currentDiag.is_high_risk_asn,
        failed_attempts_1h: currentDiag.failed_attempts_1h,
        session_hardware_mismatch: currentDiag.session_hardware_mismatch,
        is_off_peak_hour: currentDiag.is_off_peak_hour,
      } : undefined,
      telemetry_source: currentEdited ? 'SIMULATED' : 'LIVE',
    };

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const txId = data.data.id;
        router.push(`/receipt/${txId}`);
      } else if (res.status === 403 || data.message === "Blocked" || data.verdict === "FRAUDULENT") {
        setInvoice((prev: any) => ({ ...prev, status: "BLOCKED" }));
      } else {
        setPaymentError(data.error || data.message || "Transaction declined by payment review.");
      }
    } catch (err) {
      setPaymentError("A network error occurred while processing your transaction.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading || !invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-8 h-8 border-3 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide text-[#001C3D]">
          Loading Billing Details...
        </span>
      </div>
    );
  }

  if (invoice.status === "PAID") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
        <StudentHeader user={user} />
        <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <BackButton />
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block">
                Nnamdi Azikiwe University Bursary
              </span>
              <h1 className="text-xl font-extrabold text-[#001C3D]">Payment Cleared</h1>
              <p className="text-xs text-slate-500 font-medium">
                This fee invoice has already been processed and verified in the university records.
              </p>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-left space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Fee Category:</span>
                <span className="font-bold text-[#001C3D]">{invoice.category.replace("_", " ")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Academic Session:</span>
                <span className="font-semibold text-slate-700 font-mono">{invoice.session}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200/60 pt-2">
                <span className="text-slate-500 font-medium">Amount Settled:</span>
                <span className="font-extrabold text-emerald-600 font-mono">
                  ₦{invoice.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full py-3.5 bg-[#001C3D] hover:bg-[#00152e] text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (invoice.status === "BLOCKED") {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
        <StudentHeader user={user} />
        <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <BackButton />
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-sm text-center space-y-5">
            <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
              <AlertTriangle className="w-8 h-8 stroke-[2]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-rose-700 block">
                Security Verification Required
              </span>
              <h1 className="text-xl font-extrabold text-[#001C3D]">Payment Attempt Blocked</h1>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md mx-auto">
                Our security system paused this payment because it detected unusual activity from your device or internet connection. This is a safety measure to protect student accounts from unauthorized access or cybercafe fraud.
              </p>
            </div>
            <div className="pt-2">
              <button
                onClick={() => router.push(`/support/appeal?invoiceId=${invoiceId}`)}
                className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <span>Request Review from Bursary</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      <StudentHeader user={user} />
      
      <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <BackButton />

        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <div className="bg-[#001C3D] p-6 text-white flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block mb-0.5">
                Central Bursary Gateway
              </span>
              <h1 className="text-lg font-extrabold tracking-tight">Payment Authorization</h1>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/15">
              <Building2 className="w-6 h-6 text-[#F58220]" />
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-400 font-bold uppercase tracking-wider block text-[10px] mb-0.5">
                  Payer Identification
                </span>
                <span className="font-extrabold text-[#001C3D] text-sm">{user?.name}</span>
                <span className="text-slate-500 font-mono ml-1.5 font-semibold">({user?.matricNumber})</span>
              </div>
              <div className="text-right font-mono text-[11px] font-bold text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
                {user?.department}
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-sm">
              <div className="p-4 bg-slate-50/50 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Fee Category</span>
                <span className="font-bold text-[#001C3D]">{invoice.category.replace("_", " ")}</span>
              </div>
              <div className="p-4 flex justify-between items-center">
                <span className="text-slate-500 font-medium">Academic Session</span>
                <span className="font-semibold text-slate-700 font-mono">{invoice.session}</span>
              </div>
              <div className="p-4 bg-blue-50/40 flex justify-between items-center border-t border-slate-100">
                <span className="font-bold text-slate-700">Total Amount Due</span>
                <span className="text-lg font-extrabold text-[#001C3D] font-mono">
                  ₦{invoice.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <DiagnosticsPanel />

            <div className="space-y-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Payment Processing Channel
              </span>
              <div className="p-3.5 border border-slate-200 rounded-xl flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-xs">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-xs text-slate-800 block">
                      Institutional E-Payment Gateway
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Remita / Paystack Educational Channel
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                  ACTIVE
                </span>
              </div>
            </div>

            {paymentError && (
              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-3 font-semibold animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="block font-bold text-rose-900">Transaction Notice</span>
                  <span className="leading-relaxed font-normal">{paymentError}</span>
                </div>
              </div>
            )}

            <button
              onClick={handlePay}
              disabled={processing}
              className="w-full py-4 bg-[#F58220] hover:bg-[#d97016] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer mt-4"
            >
              {processing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Authorization...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>Complete Payment (₦{invoice.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</span>
                </>
              )}
            </button>
            
            <div className="text-center">
              <span className="text-[11px] text-slate-400 font-medium flex items-center justify-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Encrypted transaction verified by central university records.</span>
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}