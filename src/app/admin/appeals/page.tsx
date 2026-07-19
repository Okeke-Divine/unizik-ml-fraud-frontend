// unizik-ml-fraud-frontend/src/app/admin/appeals/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, XCircle, CheckCircle2, AlertTriangle, RefreshCw, Cpu, FileText } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import BackButton from "@/components/BackButton";

export default function AdminAppealsPage() {
  const router = useRouter();
  const [appeals, setAppeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchAppeals = () => {
    setLoading(true);
    fetch("/api/appeals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setAppeals(data.appeals);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
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
    fetchAppeals();
  }, [router]);

  const handleAction = async (appealId: string, status: "APPROVED" | "REJECTED") => {
    setActionLoading(appealId);
    try {
      const res = await fetch("/api/appeals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appealId, status, adminNotes: `Manual executive override executed by Chief Bursar on ${new Date().toLocaleDateString()}` })
      });
      if (res.ok) fetchAppeals();
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      <AdminHeader />
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <BackButton />

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#001C3D]">
              Executive Override &amp; Dispute Queue
            </h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Human-in-the-loop review of automated security holds. Unblocking restores student gateway routing.
            </p>
          </div>
          <button
            onClick={fetchAppeals}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Queue</span>
          </button>
        </div>

        <div className="space-y-4">
          {loading ? (
            <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border">Querying dispute registry...</div>
          ) : appeals.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium bg-white rounded-2xl border">No active verification appeals pending institutional review.</div>
          ) : (
            appeals.map((item) => {
              const isPending = item.status === "PENDING";
              const auditLog = item.transaction?.auditLog;

              return (
                <div key={item.id} className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block">
                        {item.transaction?.invoice?.category?.replace("_", " ")} — ₦{item.transaction?.invoice?.amount?.toLocaleString()}
                      </span>
                      <h3 className="text-base font-extrabold text-[#001C3D] mt-0.5">
                        {item.student?.lastName} {item.student?.firstName} ({item.student?.matricNumber})
                      </h3>
                      <span className="text-xs text-slate-500">{item.student?.department}</span>
                    </div>
                    <div>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase ${
                        item.status === "APPROVED" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
                        item.status === "REJECTED" ? "bg-rose-50 text-rose-700 border border-rose-200" :
                        "bg-amber-50 text-amber-800 border border-amber-200"
                      }`}>
                        {item.status}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    {/* Student Explanation */}
                    <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-1">
                      <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-blue-600" />
                        <span>Student Explanation</span>
                      </span>
                      <p className="text-slate-800 font-medium leading-relaxed italic">&ldquo;{item.reason}&rdquo;</p>
                    </div>

                    {/* White-Box XAI Telemetry Summary */}
                    <div className="p-3.5 bg-rose-50/50 border border-rose-200/80 rounded-xl space-y-1 font-mono">
                      <span className="font-sans font-bold text-rose-900 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-rose-600" />
                        <span>ML Forensic Intercept Log</span>
                      </span>
                      <p className="text-rose-950 font-semibold text-[11px]">{auditLog?.explanation || "Anomalous hardware fingerprint or routing detected."}</p>
                    </div>
                  </div>

                  {/* Administrative Action Bar */}
                  {isPending && (
                    <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleAction(item.id, "REJECTED")}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                      >
                        Reject Dispute
                      </button>
                      <button
                        disabled={actionLoading === item.id}
                        onClick={() => handleAction(item.id, "APPROVED")}
                        className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-sm shadow-emerald-600/20 cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>Approve Override &amp; Unblock Invoice</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}