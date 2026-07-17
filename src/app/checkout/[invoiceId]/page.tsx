"use client";

import React, { useState, useEffect, useRef, use } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

export default function CheckoutPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const { invoiceId } = use(params);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [mismatch, setMismatch] = useState(0);
  
  // RUTHLESS FIX: Use useRef for the timer so it persists across renders without hardcoding
  const startTime = useRef(performance.now());

  useEffect(() => {
    // 1. Fetch Invoice
    fetch(`/api/invoices?studentId=null&invoiceId=${invoiceId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setInvoice(data.invoice);
      });

    // 2. Telemetry
    const initTelemetry = async () => {
      const currentFP = await generateDeviceFingerprint();
      setDeviceId(currentFP);
      const storedUser = localStorage.getItem("unizik_user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.loginDeviceId && user.loginDeviceId !== currentFP) setMismatch(1);
      }
      setLoading(false);
    };
    initTelemetry();
  }, [invoiceId]);

  const handlePay = async () => {
    // Calculate REAL dwell time
    const dwellTime = (performance.now() - startTime.current) / 1000;
    
    const payload = {
      studentId: JSON.parse(localStorage.getItem("unizik_user")!).id,
      invoiceId: invoiceId,
      amount: invoice?.amount || 0,
      reference: `PAY_${Math.random().toString(36).substring(7)}`,
      deviceId: deviceId,
      // REMOVED HARDCODED IP/ASN. The API will detect these server-side.
      pageDwellTime: dwellTime,
      hardwareMismatch: mismatch,
    };

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) router.push("/dashboard");
    else alert("Payment Blocked by Security Engine");
  };

  if (loading || !invoice) return <div className="p-12 text-center text-slate-400">Loading secure tunnel...</div>;

  return (
    <div className="max-w-xl mx-auto mt-12 bg-slate-900 p-8 rounded-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-6">Confirm Payment</h2>
      {/* ... Rest of UI (same as before) ... */}
      <button onClick={handlePay} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-all">
        Pay ₦{invoice.amount.toLocaleString()}
      </button>
    </div>
  );
}