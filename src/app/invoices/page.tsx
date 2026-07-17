// unizik-ml-fraud-frontend/src/app/invoices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, Shield, AlertCircle, RefreshCw } from "lucide-react";

const FEE_OPTIONS = [
  { id: "TUITION", label: "Tuition & Academic Fee", amount: 85500.00, desc: "Mandatory seasonal tuition for undergraduate degree programs." },
  { id: "ACCEPTANCE", label: "Student Acceptance Fee", amount: 45000.00, desc: "One-time clearance fee for newly admitted undergraduates." },
  { id: "ICT_INFRASTRUCTURE", label: "ICT & Portal Maintenance", amount: 15000.00, desc: "Covers Wi-Fi access, digital library, and student portal bandwidth." },
  { id: "EXAM_CLEARANCE", label: "Semester Exam Clearance", amount: 10000.00, desc: "Required fee to generate biometric exam hall permits." },
  { id: "LIBRARY", label: "Library Development Fee", amount: 5000.00, desc: "Access to physical and online IEEE/ACM research repositories." },
];

export default function InvoiceGeneratorPage() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [selectedCategory, setSelectedCategory] = useState("TUITION");
  const [session, setSession] = useState("2025/2026");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("unizik_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(storedUser));
  }, [router]);

  const selectedFee = FEE_OPTIONS.find((f) => f.id === selectedCategory)!;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentId: user.id,
          category: selectedCategory,
          session,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Redirect directly to the real-time telemetry checkout page
        router.push(`/checkout/${data.invoice.id}`);
      } else {
        setError(data.error || "Failed to generate invoice.");
      }
    } catch (err) {
      setError("Network error while communicating with billing server.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-2xl mx-auto">
        
        {/* Back Button */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Student Dashboard
        </button>

        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-slate-800 pb-5 mb-6">
            <div className="p-2.5 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
              <FileText className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Generate Fee Invoice
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Select your mandatory fee category for the academic session.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            
            {/* Student Identity Lock */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80 text-xs font-mono">
              <span className="text-slate-500 block mb-1">BOUND STUDENT IDENTITY:</span>
              <div className="text-white font-bold">{user.name} ({user.matricNumber})</div>
              <div className="text-indigo-400 mt-0.5">{user.department} — {user.level}L</div>
            </div>

            {/* Academic Session Selector */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Academic Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                <option value="2025/2026">2025/2026 Academic Session (Current)</option>
                <option value="2024/2025">2024/2025 Academic Session (Previous)</option>
              </select>
            </div>

            {/* Fee Category Radio Options */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-2">
                Fee Category & Schedule
              </label>
              <div className="space-y-3">
                {FEE_OPTIONS.map((option) => {
                  const isSelected = selectedCategory === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setSelectedCategory(option.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all flex items-start justify-between gap-4 ${
                        isSelected
                          ? "bg-indigo-950/20 border-indigo-500/50 shadow-sm"
                          : "bg-slate-950/50 border-slate-800/80 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full border flex items-center justify-center ${isSelected ? "border-indigo-400 bg-indigo-500" : "border-slate-600"}`}>
                            {isSelected && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                          </div>
                          {option.label}
                        </div>
                        <p className="text-xs text-slate-400 mt-1 pl-5 leading-relaxed">
                          {option.desc}
                        </p>
                      </div>
                      <div className="text-right font-mono font-bold text-sm text-slate-200 shrink-0">
                        ₦{option.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Price Tamper-Proof Notice */}
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-lg text-[11px] text-indigo-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Official prices are enforced by the database schema. Client-side modifications will be rejected by security guardrails.
              </span>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating Tamper-Proof Invoice...
                </>
              ) : (
                <>
                  Generate Invoice & Proceed to Pay — ₦{selectedFee.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </>
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}