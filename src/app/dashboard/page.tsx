// unizik-ml-fraud-frontend/src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileText, Plus, CheckCircle, Clock, LogOut, User, ShieldCheck, AlertCircle, Shield, Cpu } from "lucide-react";
import StudentHeader from "@/components/StudentHeader";

interface Invoice {
  id: string;
  category: string;
  amount: number;
  session: string;
  status: "PENDING" | "PAID" | "CANCELLED" | "BLOCKED";
  createdAt: string;
  transactions: Array<{ id: string; status: string; reference?: string }>;
}

export default function StudentDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Retrieve authenticated session
    const storedUser = localStorage.getItem("unizik_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }

    const parsedUser = JSON.parse(storedUser);
    setUser(parsedUser);

    // Fetch student ledger
    fetch(`/api/invoices?studentId=${parsedUser.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          setInvoices(data.invoices);
        } else {
          setError(data.error);
        }
      })
      .catch(() => setError("Failed to synchronize with university ledger."))
      .finally(() => setLoading(false));
  }, [router]);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-8 h-8 border-3 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide text-[#001C3D]">
          Synchronizing Academic Ledger &amp; Security Guardrails...
        </span>
      </div>
    );
  }

  const totalPaid = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingCount = invoices.filter((inv) => inv.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      
      <StudentHeader user={user} />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Academic Standing & Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Card 1: Academic Profile */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -z-0 opacity-50 pointer-events-none" />
            <div className="relative z-10">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Academic Standing
              </span>
              <div className="text-lg font-extrabold text-[#001C3D] truncate mt-1">
                {user.department}
              </div>
            </div>
            <div className="text-xs font-bold text-slate-600 mt-4 flex items-center justify-between border-t border-slate-100 pt-3 relative z-10 font-mono">
              <span className="bg-slate-100 px-2.5 py-1 rounded-md text-[#001C3D]">LEVEL: {user.level}L</span>
              <span className="text-slate-500">SESSION: 2025/2026</span>
            </div>
          </div>

          {/* Card 2: Revenue Cleared */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Total Fees Cleared
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono tracking-tight mt-1">
                ₦{totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
              </div>
            </div>
            <div className="text-[11px] font-semibold text-slate-500 mt-4 flex items-center gap-1.5 border-t border-slate-100 pt-3">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span>Verified in Bursary records</span>
            </div>
          </div>

          {/* Card 3: Pending Invoices Action Card */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pending Obligations
              </span>
              <div className="text-2xl sm:text-3xl font-extrabold text-[#F58220] font-mono tracking-tight mt-1">
                {pendingCount} Invoice{pendingCount !== 1 ? "s" : ""} Due
              </div>
            </div>
            <button
              onClick={() => router.push("/invoices")}
              className="mt-4 w-full py-2.5 bg-[#001C3D] hover:bg-[#00152e] active:scale-[0.99] text-white rounded-xl text-xs font-bold transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-blue-950/10"
            >
              <Plus className="w-4 h-4 text-[#F58220]" />
              <span>Generate New Fee Invoice</span>
            </button>
          </div>
        </div>

        {/* Error Notification Banner */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-8 text-xs font-semibold text-rose-700 flex items-center gap-2.5 shadow-sm animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoices Ledger Table Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          
          {/* Ledger Table Header */}
          <div className="p-6 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <h2 className="text-base font-extrabold text-[#001C3D] flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#F58220]" />
                <span>Student Billing &amp; Transaction Ledger</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                All invoices are linked to your student profile and monitored by the fraud detection system.
              </p>
            </div>
          </div>

          {/* Table Content */}
          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">
              No fee invoices generated for the 2025/2026 academic session yet. Click &ldquo;Generate New Fee Invoice&rdquo; above to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-6">Fee Category</th>
                    <th className="py-3.5 px-6">Academic Session</th>
                    <th className="py-3.5 px-6">Amount Due</th>
                    <th className="py-3.5 px-6">Payment Status</th>
                    <th className="py-3.5 px-6 text-right">Action</th>
                  </tr>
                </thead>
                                <tbody className="divide-y divide-slate-100 text-xs font-medium">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    const isBlocked = inv.status === "BLOCKED";

                    return (
                      <tr key={inv.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                        <td className="py-4 px-6 font-bold text-[#001C3D] text-sm">
                          {inv.category.replace("_", " ")}
                        </td>
                        <td className="py-4 px-6 text-slate-600 font-mono font-semibold">{inv.session}</td>
                        <td className="py-4 px-6 font-extrabold text-slate-900 font-mono text-sm">
                          ₦{inv.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full font-sans text-[11px] font-bold shadow-2xs">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>PAID &amp; CLEARED</span>
                            </span>
                          ) : isBlocked ? (
                            /* Institutional Wording: No robotic terms */
                            <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-800 border border-rose-200 px-3 py-1 rounded-full font-sans text-[11px] font-bold shadow-2xs">
                              <Shield className="w-3.5 h-3.5 text-rose-600" />
                              <span>SECURITY HOLD</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-800 border border-amber-200/80 px-3 py-1 rounded-full font-sans text-[11px] font-bold shadow-2xs">
                              <Clock className="w-3.5 h-3.5 text-amber-600" />
                              <span>PENDING CLEARANCE</span>
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-sans">
                          {isPaid ? (
                            <button
                              onClick={() => {
                                const clearedTx = inv.transactions?.find(tx => tx.status === "CLEARED" || tx.status === "SUCCESS");
                                const txId = clearedTx?.id || (inv as any).reference || inv.id;
                                router.push(`/receipt/${txId}`);
                              }}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:scale-[0.98] text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-2xs flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>View Receipt</span>
                            </button>
                          ) : isBlocked ? (
                            /* Hides Pay Now button. Replaced with administrative appeal routing */
                            <button
                              onClick={() => router.push(`/support/appeal?invoiceId=${inv.id}`)}
                              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-sm shadow-rose-500/20 flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span>Request Review</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => router.push(`/checkout/${inv.id}`)}
                              className="px-4 py-2 bg-[#F58220] hover:bg-[#d97016] active:scale-[0.98] text-white rounded-xl font-bold text-xs transition-all duration-200 shadow-sm shadow-orange-500/20 flex items-center gap-1.5 ml-auto cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay Now</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </main>
    </div>
  );
}