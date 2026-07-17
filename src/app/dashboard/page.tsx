// unizik-ml-fraud-frontend/src/app/dashboard/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, FileText, Plus, CheckCircle, Clock, LogOut, User, ShieldCheck, AlertCircle } from "lucide-react";

interface Invoice {
  id: string;
  category: string;
  amount: number;
  session: string;
  status: "PENDING" | "PAID" | "CANCELLED";
  createdAt: string;
  transactions: Array<{ status: string }>;
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

  const handleLogout = () => {
    localStorage.removeItem("unizik_user");
    router.push("/login");
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400 font-mono text-sm">
        Synchronizing academic ledger...
      </div>
    );
  }

  const totalPaid = invoices
    .filter((inv) => inv.status === "PAID")
    .reduce((sum, inv) => sum + inv.amount, 0);

  const pendingCount = invoices.filter((inv) => inv.status === "PENDING").length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-12">
      
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white block text-sm sm:text-base">
                Nnamdi Azikiwe University
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-400 block">
                Student Financial Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span>{user.name} ({user.matricNumber})</span>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Academic Standing & Financial Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Academic Standing
            </span>
            <div className="text-lg font-bold text-white truncate">{user.department}</div>
            <div className="text-xs text-indigo-400 font-mono mt-2 flex items-center justify-between border-t border-slate-800/80 pt-2">
              <span>LEVEL: {user.level}L</span>
              <span>SESSION: 2025/2026</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-1">
              Total Fees Cleared
            </span>
            <div className="text-2xl font-bold text-emerald-400 font-mono">
              ₦{totalPaid.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
              <span>Verified in university SQLite ledger</span>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs font-mono uppercase tracking-wider text-slate-500 block mb-1">
                Pending Bills
              </span>
              <div className="text-2xl font-bold text-amber-400 font-mono">
                {pendingCount} Invoice{pendingCount !== 1 ? "s" : ""} Due
              </div>
            </div>
            <button
              onClick={() => router.push("/invoices")}
              className="mt-4 w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Generate New Fee Invoice
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-4 mb-6 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Invoices Ledger Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-400" />
                Student Billing Ledger
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                All generated invoices are bound to your student UUID and monitored by ML fraud guardrails.
              </p>
            </div>
          </div>

          {invoices.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-sm font-mono">
              No invoices generated yet. Click "Generate New Fee Invoice" above to begin.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-950/50 text-xs font-mono text-slate-400 uppercase">
                    <th className="py-3 px-6">Fee Category</th>
                    <th className="py-3 px-6">Session</th>
                    <th className="py-3 px-6">Amount</th>
                    <th className="py-3 px-6">Status</th>
                    <th className="py-3 px-6 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-xs">
                  {invoices.map((inv) => {
                    const isPaid = inv.status === "PAID";
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 px-6 font-semibold text-white">
                          {inv.category.replace("_", " ")}
                        </td>
                        <td className="py-4 px-6 text-slate-300">{inv.session}</td>
                        <td className="py-4 px-6 font-bold text-slate-200">
                          ₦{inv.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          {isPaid ? (
                            <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-sans text-[11px] font-medium">
                              <CheckCircle className="w-3 h-3" /> PAID
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-sans text-[11px] font-medium">
                              <Clock className="w-3 h-3" /> PENDING
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-right font-sans">
                          {isPaid ? (
                            <span className="text-slate-500 text-xs italic">Cleared</span>
                          ) : (
                            <button
                              onClick={() => router.push(`/checkout/${inv.id}`)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-semibold text-xs transition-all shadow-sm flex items-center gap-1 ml-auto"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              Pay Now
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