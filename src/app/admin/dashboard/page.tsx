// unizik-ml-fraud-frontend/src/app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TrendingUp, AlertTriangle, FileText, Activity, ArrowUpRight } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";

export default function AdminDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    // Basic admin session check
    const storedUser = localStorage.getItem("unizik_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    
    const parsedUser = JSON.parse(storedUser);
    if (parsedUser.role !== "ADMIN" && parsedUser.role !== "BURSARY_DIRECTOR") {
      router.push("/dashboard");
      return;
    }

    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(res => setData(res.stats))
      .catch(err => console.error("Failed to fetch admin stats", err));
  }, [router]);

  if (!data) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-8 h-8 border-3 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide text-[#001C3D]">
          Loading Administrative Ledger...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        
        {/* Top-Level Financial Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Total Cleared Revenue
              </span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#001C3D] font-mono tracking-tight mt-1">
              ₦{data.totalRevenue?.toLocaleString("en-NG", { minimumFractionDigits: 2 }) || "0.00"}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Blocked Transactions
              </span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-rose-600 font-mono tracking-tight mt-1">
              {data.fraudCount || 0}
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Audit Engine Status
              </span>
              <Activity className="w-4 h-4 text-emerald-500" />
            </div>
            <div className="text-xl font-extrabold text-[#001C3D] mt-2">
              Active &amp; Monitoring
            </div>
          </div>

        </div>

        {/* Global Transaction Ledger */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          
     <div className="p-6 border-b border-slate-200/80 bg-slate-50/50 flex justify-between items-center">
  <div className="flex flex-col gap-0.5">
    <h2 className="text-base font-extrabold text-[#001C3D] flex items-center gap-2">
      <FileText className="w-4 h-4 text-[#F58220]" />
      <span>Student Payment Registry &amp; Audit Records</span>
    </h2>
    <p className="text-xs text-slate-500 font-medium">
      Monitoring student financial status and automated bursary verification logs.
    </p>
  </div>
  
  <button 
    onClick={() => router.push("/admin/transactions")}
    className="px-4 py-2 bg-white border border-slate-200 hover:border-[#F58220] hover:text-[#F58220] text-[#001C3D] rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
  >
    <span>View Full Registry</span>
    <ArrowUpRight className="w-3.5 h-3.5" />
  </button>
</div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Matriculation No.</th>
                  <th className="py-3.5 px-6">Amount (₦)</th>
                  <th className="py-3.5 px-6">Clearance Status</th>
                  <th className="py-3.5 px-6">Audit Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {data.transactions?.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                      No transaction records found in the current audit period.
                    </td>
                  </tr>
                ) : (
                  data.transactions?.map((tx: any) => {
                    const isBlocked = tx.status === 'BLOCKED' || tx.status === 'DECLINED';
                    return (
                      <tr 
                        key={tx.id} 
                        onClick={() => router.push(`/admin/forensics/${tx.id}`)}
                        className="hover:bg-blue-50/60 transition-colors duration-150 cursor-pointer group"
                        title="Click row to inspect White-Box XAI forensic report"
                      >
                        <td className="py-4 px-6 text-slate-500 font-mono group-hover:text-[#001C3D] transition-colors">
                          {new Date(tx.createdAt).toLocaleString("en-NG", { 
                            month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" 
                          })}
                        </td>
                        <td className="py-4 px-6 font-bold text-[#001C3D]">
                          {tx.student?.matricNumber || "N/A"}
                        </td>
                        <td className="py-4 px-6 font-extrabold text-slate-900 font-mono">
                          ₦{tx.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-md font-sans text-[10px] font-bold uppercase tracking-wider border ${
                            isBlocked 
                              ? "bg-rose-50 text-rose-700 border-rose-200" 
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}>
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-slate-500 max-w-[250px] truncate group-hover:text-slate-800 transition-colors">
                          <span className="flex items-center justify-between">
                            <span className="truncate">{tx.auditLog?.explanation || "Standard Clearance"}</span>
                            <ArrowUpRight className="w-4 h-4 opacity-0 group-hover:opacity-100 text-[#F58220] transition-opacity shrink-0 ml-2" />
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>
    </div>
  );
}