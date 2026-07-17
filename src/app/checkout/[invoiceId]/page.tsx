// unizik-ml-fraud-frontend/src/app/checkout/[invoiceId]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react"; // Added 'use'
import { useRouter } from "next/navigation";
import { CreditCard, AlertTriangle, Loader2 } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

export default function CheckoutPage({ params }: { params: Promise<{ invoiceId: string }> }) {
  const router = useRouter();
  const { invoiceId } = use(params); // Unwrapping the Promise
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [deviceId, setDeviceId] = useState("");
  const [mismatch, setMismatch] = useState(0);

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
    const payload = {
      studentId: JSON.parse(localStorage.getItem("unizik_user")!).id,
      invoiceId: invoiceId, // Correctly passed now
      amount: invoice?.amount || 0,
      reference: `PAY_${Math.random().toString(36).substring(7)}`,
      deviceId: deviceId,
      ipAddress: "192.168.43.1",
      asnNumber: 0, 
      pageDwellTime: 45.0,
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

  if (loading || !invoice) return <div className="p-12 text-center text-slate-400">Loading invoice...</div>;

  return (
    <div className="max-w-xl mx-auto mt-12 bg-slate-900 p-8 rounded-2xl border border-slate-800">
      <h2 className="text-xl font-bold text-white mb-6">Confirm Payment</h2>
      <div className="space-y-4 mb-8">
        <div className="flex justify-between text-sm text-slate-400">
          <span>Fee:</span>
          <span className="text-white">{invoice.category}</span>
        </div>
        <div className="flex justify-between text-sm text-slate-400">
          <span>Total:</span>
          <span className="text-white font-bold">₦{invoice.amount.toLocaleString()}</span>
        </div>
      </div>
      <button onClick={handlePay} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-3 rounded-lg font-bold transition-all">
        Pay ₦{invoice.amount.toLocaleString()}
      </button>
    </div>
  );
}