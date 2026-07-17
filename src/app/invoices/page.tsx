// unizik-ml-fraud-frontend/src/app/invoices/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FileText, ArrowLeft, Shield, AlertCircle, RefreshCw, Lock, Check } from "lucide-react";
import StudentHeader from "@/components/StudentHeader";

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

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-8 h-8 border-3 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide text-[#001C3D]">
          Loading Billing Engine...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      
      {/* Reusable Institutional Header Component */}
      <StudentHeader user={user} />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Back Navigation */}
        <button
          onClick={() => router.push("/dashboard")}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#001C3D] hover:text-[#F58220] mb-6 transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span>Return to Dashboard</span>
        </button>

        {/* Main Vercel-Style Form Card */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
          
          {/* Header Section */}
          <div className="flex items-center gap-3.5 border-b border-slate-100 pb-6 mb-6">
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-[#001C3D] shrink-0">
              <FileText className="w-6 h-6 text-[#F58220]" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#001C3D] tracking-tight">
                Generate Official Fee Invoice
              </h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Select your mandatory institutional fee category for the active academic session.
              </p>
            </div>
          </div>

          <form onSubmit={handleCreateInvoice} className="space-y-6">
            
            {/* Registered Student Profile Box */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#001C3D]" /> Registered Student Profile
                </span>
                <div className="text-[#001C3D] font-extrabold text-sm sm:text-base">
                  {user.name} <span className="font-mono text-slate-500 font-semibold">({user.matricNumber})</span>
                </div>
                <div className="text-xs font-bold text-[#F58220] mt-0.5 font-mono">
                  {user.department} — Level {user.level}
                </div>
              </div>
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-white text-emerald-700 border border-emerald-200/80 px-2.5 py-1 rounded-md shadow-2xs font-mono">
                VERIFIED IDENTITY
              </span>
            </div>

            {/* Academic Session Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Academic Session
              </label>
              <select
                value={session}
                onChange={(e) => setSession(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-3 text-sm text-slate-900 font-medium focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 transition-all cursor-pointer"
              >
                <option value="2025/2026">2025/2026 Academic Session (Current &amp; Active)</option>
                <option value="2024/2025">2024/2025 Academic Session (Previous Session Archive)</option>
              </select>
            </div>

            {/* Fee Category Interactive Cards */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                Fee Schedule &amp; Category Selection
              </label>
              <div className="space-y-3">
                {FEE_OPTIONS.map((option) => {
                  const isSelected = selectedCategory === option.id;
                  return (
                    <div
                      key={option.id}
                      onClick={() => setSelectedCategory(option.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all duration-150 flex items-start justify-between gap-4 ${
                        isSelected
                          ? "bg-blue-50/60 border-[#001C3D] shadow-sm ring-1 ring-[#001C3D]/20"
                          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-[#001C3D] bg-[#001C3D]" : "border-slate-300 bg-white"
                        }`}>
                          {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                        <div>
                          <div className={`font-bold text-sm ${isSelected ? "text-[#001C3D]" : "text-slate-800"}`}>
                            {option.label}
                          </div>
                          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                            {option.desc}
                          </p>
                        </div>
                      </div>
                      <div className={`text-right font-mono font-extrabold text-sm shrink-0 ${
                        isSelected ? "text-[#001C3D]" : "text-slate-700"
                      }`}>
                        ₦{option.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Institutional Billing Notice */}
            {/* <div className="p-3.5 bg-amber-50/80 border border-amber-200/80 rounded-xl text-xs text-amber-900 flex items-start gap-2.5 shadow-2xs font-medium">
              <Shield className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span className="leading-relaxed">
                <strong className="font-bold">Official University Schedule:</strong> Fee amounts are standardized by the university administration. All billing records are verified against central portal records during checkout.
              </span>
            </div> */}

            {/* Error Banner */}
            {error && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 font-semibold animate-in fade-in duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Execution Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#F58220] hover:bg-[#d97016] active:scale-[0.99] text-white rounded-xl font-bold text-sm shadow-lg shadow-orange-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Generating Billing Invoice...</span>
                </>
              ) : (
                <>
                  <span>Generate Invoice &amp; Pay (₦{selectedFee.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })})</span>
                </>
              )}
            </button>
          </form>

        </div>
      </main>
    </div>
  );
}