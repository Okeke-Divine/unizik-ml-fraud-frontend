"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Filter, RefreshCw, AlertTriangle, CheckCircle2, XCircle, ArrowUpRight } from "lucide-react";
import AdminHeader from "@/components/AdminHeader";
import BackButton from "@/components/BackButton";

const FEE_CATEGORIES = [
  { id: "ALL", label: "All Fee Categories" },
  { id: "TUITION", label: "Tuition & Academic Fee" },
  { id: "ACCEPTANCE", label: "Student Acceptance Fee" },
  { id: "ICT_INFRASTRUCTURE", label: "ICT & Portal Maintenance" },
  { id: "LIBRARY", label: "Library Development Fee" },
  { id: "EXAM_CLEARANCE", label: "Semester Exam Clearance" },
];

const STATUS_OPTIONS = [
  { id: "ALL", label: "All Statuses" },
  { id: "CLEARED", label: "Cleared" },
  { id: "BLOCKED", label: "Blocked" },
];

export default function AdminTransactionsPage() {
  const router = useRouter();

  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [selectedCategory, setSelectedCategory] = useState("ALL");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchLedger = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams({ page: currentPage.toString(), limit: "15" });
      if (selectedStatus !== "ALL") queryParams.append("status", selectedStatus);
      if (selectedCategory !== "ALL") queryParams.append("category", selectedCategory);
      if (searchTerm.trim() !== "") queryParams.append("search", searchTerm.trim());

      const res = await fetch(`/api/admin/transactions?${queryParams.toString()}`);
      const data = await res.json();

      if (res.ok && data.success) {
        setTransactions(data.transactions || []);
        setTotalPages(data.pages || 1);
        setTotalRecords(data.total || 0);
      } else {
        setError(data.error || "Failed to retrieve records.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedStatus, selectedCategory, searchTerm, currentPage]);

  useEffect(() => {
    // Authorization Check
    const storedUser = localStorage.getItem("unizik_user");
    if (!storedUser) {
      router.push("/login");
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    const userRole = parsedUser.role || (parsedUser.username ? "BURSARY_DIRECTOR" : "STUDENT");

    if (userRole !== "ADMIN" && userRole !== "BURSARY_DIRECTOR") {
      router.push("/dashboard");
      return;
    }

    fetchLedger();
  }, [fetchLedger, router]);

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedStatus("ALL");
    setSelectedCategory("ALL");
    setCurrentPage(1);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLedger();
  };

  // Dynamic Metrics based on current retrieved records
  const totalClearedRevenue = transactions
    .filter((tx) => tx.status === "CLEARED" || tx.status === "PAID")
    .reduce((sum, tx) => sum + (tx.amount || tx.invoice?.amount || 0), 0);

  const blockedCount = transactions.filter((tx) => tx.status === "BLOCKED" || tx.status === "DECLINED").length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white">
      <AdminHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        {/* Navigation Back Button */}
        <BackButton />

        {/* Page Title & Context Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#001C3D] tracking-tight">
              Bursary Financial Ledger &amp; Audit Engine
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
              Comprehensive audit trail of undergraduate payment authorizations and decision-tree fraud intercepts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCurrentPage(1);
                fetchLedger();
              }}
              disabled={loading}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Refresh Ledger</span>
            </button>
          </div>
        </div>

        {/* Dynamic Ledger Summary Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Count</span>
            <span className="text-lg font-extrabold text-[#001C3D] font-mono">{totalRecords}</span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Page Cleared Revenue</span>
            <span className="text-lg font-extrabold text-emerald-600 font-mono">
              ₦{totalClearedRevenue.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="bg-white border border-slate-200/80 p-4 rounded-xl shadow-2xs flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Page Interceptions</span>
            <span className="text-lg font-extrabold text-rose-600 font-mono">{blockedCount}</span>
          </div>
        </div>

        {/* Filtering Engine Toolbar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] mb-8 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#001C3D] flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-[#F58220]" />
              <span>Ledger Filtering Parameters</span>
            </span>
            {(searchTerm || selectedStatus !== "ALL" || selectedCategory !== "ALL") && (
              <button
                onClick={handleResetFilters}
                className="text-xs font-bold text-rose-600 hover:underline cursor-pointer"
              >
                Reset All Filters
              </button>
            )}
          </div>

          <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* Search Box */}
            <div className="md:col-span-6 relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </div>
              <input
                type="text"
                placeholder="Search by Matric No., Student Name, or Payment Ref..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] transition-all"
              />
            </div>

            {/* Status Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#001C3D] transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Fee Category Dropdown */}
            <div className="md:col-span-3">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="block w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:bg-white focus:border-[#001C3D] transition-all cursor-pointer"
              >
                {FEE_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>{cat.label}</option>
                ))}
              </select>
            </div>
          </form>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 mb-6 text-xs font-semibold text-rose-700 flex items-center gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Tabular Financial Ledger */}
        <div className="bg-white border border-slate-200/80 rounded-2xl shadow-[0_4px_20px_rgb(0,0,0,0.03)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200/80 bg-slate-50/80 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-6">Timestamp</th>
                  <th className="py-3.5 px-6">Student Identification</th>
                  <th className="py-3.5 px-6">Fee Category</th>
                  <th className="py-3.5 px-6">Reference No.</th>
                  <th className="py-3.5 px-6 text-right">Amount (₦)</th>
                  <th className="py-3.5 px-6 text-center">Clearance Status</th>
                  <th className="py-3.5 px-6">Audit Verdict &amp; Remarks</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-medium">
                {loading && transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      Querying Bursary database...
                    </td>
                  </tr>
                ) : transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 font-medium">
                      No transaction records match the specified filtering parameters.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => {
                    const isSuccess = tx.status === "CLEARED" || tx.status === "PAID";
                    const isBlocked = tx.status === "BLOCKED" || tx.status === "DECLINED";
                    const isPending = tx.status === "PENDING";

                    return (
                      <tr key={tx.id} className="hover:bg-blue-50/40 transition-colors duration-150">
                        <td className="py-4 px-6 text-slate-500 font-mono whitespace-nowrap">
                          {new Date(tx.createdAt).toLocaleString("en-NG", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-4 px-6">
                          <div className="font-bold text-[#001C3D]">
                            {tx.student?.lastName} {tx.student?.firstName}
                          </div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {tx.student?.matricNumber || "N/A"} ({tx.student?.department || "General"})
                          </div>
                        </td>

                        <td className="py-4 px-6 font-semibold text-slate-700 whitespace-nowrap">
                          {tx.invoice?.category?.replace(/_/g, " ") || "General Fee"}
                        </td>

                        <td className="py-4 px-6 font-mono text-slate-600 font-bold whitespace-nowrap">
                          {tx.reference || `TRX-${tx.id.substring(0, 8).toUpperCase()}`}
                        </td>

                        <td className="py-4 px-6 font-extrabold text-slate-900 font-mono text-right whitespace-nowrap">
                          ₦{(tx.amount || tx.invoice?.amount || 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                        </td>

                        <td className="py-4 px-6 text-center whitespace-nowrap">
                          {isSuccess && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Cleared</span>
                            </span>
                          )}
                          {isBlocked && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider">
                              <XCircle className="w-3 h-3 text-rose-600" />
                              <span>Blocked</span>
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>Pending</span>
                            </span>
                          )}
                        </td>

                        {/* Remark Cell */}
                        <td className="py-4 px-6 text-slate-600 max-w-[220px] truncate" title={tx.auditLog?.explanation || (isPending ? "Awaiting Gateway Processing" : "Standard Clearance Processed")}>
                          <span className={isBlocked ? "font-semibold text-rose-700" : isPending ? "font-medium text-amber-600" : ""}>
                            {tx.auditLog?.explanation || (isPending ? "Awaiting Gateway Processing" : "Standard Clearance Processed")}
                          </span>
                        </td>

                        {/* Action Cell */}
                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isSuccess && (
                              <button
                                onClick={() => router.push(`/receipt/${tx.id}`)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-[#001C3D] font-bold rounded-lg text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer"
                                title="Inspect Official e-Receipt"
                              >
                                <span>Receipt</span>
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/admin/forensics/${tx.id}`)}
                              className={`px-3 py-1.5 font-bold rounded-lg text-[11px] transition-all inline-flex items-center gap-1 cursor-pointer shadow-2xs ${
                                isBlocked
                                  ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-500/20"
                                  : "bg-[#001C3D] hover:bg-[#00152e] text-white"
                              }`}
                              title="Inspect White-Box AI Forensics"
                            >
                              <span>Forensics</span>
                              <ArrowUpRight className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between p-4 border-t border-slate-100">
              <button
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Previous
              </button>
              <span className="text-xs font-bold text-slate-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="px-4 py-2 border border-slate-200 hover:border-slate-300 rounded-xl text-xs font-bold disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}