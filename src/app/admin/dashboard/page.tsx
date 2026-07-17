// unizik-ml-fraud-frontend/src/app/admin/dashboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { Shield, TrendingUp, AlertTriangle, CheckCircle, Search } from "lucide-react";

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(res => setData(res.stats));
  }, []);

  if (!data) return <div className="text-white p-12">Loading Bursary Ledger...</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-8 font-sans">
      <h1 className="text-2xl font-bold text-white mb-6">Bursary Command Center</h1>
      
      {/* Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-xs uppercase font-bold">Total Cleared Revenue</p>
          <p className="text-3xl font-bold text-emerald-400 mt-2">₦{data.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-xs uppercase font-bold">Fraud Intercepts</p>
          <p className="text-3xl font-bold text-rose-400 mt-2">{data.fraudCount}</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
          <p className="text-slate-400 text-xs uppercase font-bold">System Health</p>
          <p className="text-3xl font-bold text-indigo-400 mt-2">Operational</p>
        </div>
      </div>

      {/* Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold">
            <tr>
              <th className="p-4">Timestamp</th>
              <th className="p-4">Student</th>
              <th className="p-4">Amount</th>
              <th className="p-4">Status</th>
              <th className="p-4">Explanation</th>
            </tr>
          </thead>
          <tbody className="text-slate-200">
            {data.transactions.map((tx: any) => (
              <tr key={tx.id} className="border-t border-slate-800 hover:bg-slate-800/50">
                <td className="p-4 font-mono">{new Date(tx.createdAt).toLocaleTimeString()}</td>
                <td className="p-4">{tx.student.matricNumber}</td>
                <td className="p-4">₦{tx.amount.toLocaleString()}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold ${tx.status === 'BLOCKED' ? 'bg-rose-500/10 text-rose-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {tx.status}
                  </span>
                </td>
                <td className="p-4 text-[10px] max-w-[300px] truncate">
                  {tx.auditLog?.explanation || "Legitimate Transaction"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}