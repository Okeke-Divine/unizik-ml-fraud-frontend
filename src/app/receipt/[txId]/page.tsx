// unizik-ml-fraud-frontend/src/app/receipt/[txId]/page.tsx
"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer, CheckCircle2, Building2, QrCode, ShieldCheck, AlertCircle } from "lucide-react";
import StudentHeader from "@/components/StudentHeader";
import BackButton from "@/components/BackButton";
import useRequireStudent from '@/lib/useRequireStudent';

export default function ReceiptVerificationPage({ params }: { params: Promise<{ txId: string }> }) {
  const router = useRouter();
  const { txId } = use(params);

  const [user, setUser] = useState<any | null>(null);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useRequireStudent();

  useEffect(() => {
    const storedUser = localStorage.getItem("unizik_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Fetch verified receipt record from SQLite
    fetch(`/api/receipt/${txId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.invoice) {
          setInvoice(data.invoice);
        } else {
          setError(data.error || "Unable to verify this transaction record.");
        }
      })
      .catch(() => setError("Network error while verifying bursary records."))
      .finally(() => setLoading(false));
  }, [txId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center text-slate-600 font-sans">
        <div className="w-8 h-8 border-3 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin mb-3" />
        <span className="text-sm font-semibold tracking-wide text-[#001C3D]">
          Retrieving Verified e-Receipt...
        </span>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16">
        <div className="print:hidden">
          <StudentHeader user={user} />
        </div>
        <main className="max-w-xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
          <div className="bg-white border border-rose-200 rounded-2xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center space-y-4">
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Receipt Verification Failed</h2>
            <p className="text-sm text-slate-600 max-w-sm mx-auto">{error}</p>
            <button
              onClick={() => router.push("/dashboard")}
              className="mt-4 px-6 py-2.5 bg-[#001C3D] hover:bg-[#00152e] text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Return to Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Generate zero-dependency QR code pointing to this exact verification URL
  const verificationUrl = typeof window !== "undefined" ? window.location.href : `https://portal.unizik.edu.ng/receipt/${txId}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(verificationUrl)}&color=001C3D`;

  const paymentDate = new Date(invoice.createdAt || Date.now()).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const receiptNumber = `REC-${invoice.id.substring(0, 8).toUpperCase()}`;
  const transactionRef = invoice.transactions?.[0]?.reference || `TRX-${txId.substring(0, 10).toUpperCase()}`;

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-16 selection:bg-[#001C3D] selection:text-white print:bg-white print:pb-0">
      
      {/* Header is automatically hidden during print */}
      <div className="print:hidden">
        <StudentHeader user={user} />
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 print:mt-0 print:max-w-none print:px-0">
        
        {/* Navigation & Print Control Bar (Hidden on Print) */}
        <div className="flex items-center justify-between mb-6 print:hidden">
          <BackButton />

          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-[#001C3D] hover:bg-[#00152e] active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-[#F58220]" />
            <span>Print Official Receipt</span>
          </button>
        </div>

        {/* A4 Printable Receipt Card Container */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-8 sm:p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden print:border-none print:shadow-none print:rounded-none print:p-6">
          
          {/* Institutional Document Header */}
          <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#001C3D] pb-6 mb-8 gap-4 text-center sm:text-left">
            <div className="flex items-center gap-4">
              <img 
                src="/unizik.png" 
                alt="UNIZIK Crest" 
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  e.currentTarget.nextElementSibling?.classList.remove('hidden');
                }}
              />
              <div className="hidden w-14 h-14 bg-[#001C3D] text-white rounded-xl flex items-center justify-center font-bold text-xl">
                NAU
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[#001C3D]">
                  NNAMDI AZIKIWE UNIVERSITY, AWKA
                </h1>
                <span className="text-xs font-bold uppercase tracking-widest text-[#F58220] block mt-0.5">
                  Office of the Bursar
                  <br />
                  Student Financial Services
                </span>
                <span className="text-[11px] text-slate-500 font-medium block mt-1">
                  PMB 5025, Awka, Anambra State, Nigeria
                </span>
              </div>
            </div>

            <div className="sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 w-full sm:w-auto">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Verified</span>
              </span>
              <div className="text-xs font-mono font-bold text-slate-700">
                Receipt No: <span className="text-[#001C3D]">{receiptNumber}</span>
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Date: {paymentDate}
              </div>
            </div>
          </div>

          {/* Title Banner */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-center mb-8 font-bold text-xs uppercase tracking-widest text-[#001C3D] print:bg-slate-100">
            Official Student Fee e-Receipt
          </div>

          {/* Student Profile Tabular Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 text-xs">
            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-200 pb-1">
                Student Information
              </span>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Student Name:</span>
                <span className="font-bold text-slate-900">{user?.name || "Verified Student"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Matriculation No:</span>
                <span className="font-mono font-bold text-[#001C3D]">{user?.matricNumber || "N/A"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Department:</span>
                <span className="font-semibold text-slate-700">{user?.department || "Computer Science"}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Academic Level:</span>
                <span className="font-semibold text-slate-700">{user?.level ? `${user.level} Level` : "Undergraduate"}</span>
              </div>
            </div>

            <div className="space-y-3 bg-slate-50/60 p-4 rounded-xl border border-slate-200/60">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block border-b border-slate-200 pb-1">
                Payment Metadata
              </span>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Academic Session:</span>
                <span className="font-mono font-bold text-slate-900">{invoice.session}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Payment Channel:</span>
                <span className="font-semibold text-slate-700">Remita Educational Gateway</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Payment Reference:</span>
                <span className="font-mono font-bold text-slate-800">{transactionRef}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 font-medium">Audit Status:</span>
                <span className="font-bold text-emerald-700">VERIFIED IN LEDGER</span>
              </div>
            </div>
          </div>

          {/* Tabular Financial Ledger Section */}
          <div className="border border-slate-200 rounded-xl overflow-hidden mb-8">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#001C3D] text-white uppercase tracking-wider text-[11px] font-bold">
                  <th className="py-3 px-4">Description / Fee Category</th>
                  <th className="py-3 px-4 text-center">Session</th>
                  <th className="py-3 px-4 text-right">Amount Settled (₦)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr>
                  <td className="py-4 px-4 font-bold text-slate-900 text-sm">
                    {invoice.category.replace("_", " ")}
                  </td>
                  <td className="py-4 px-4 text-center font-mono text-slate-600">
                    {invoice.session}
                  </td>
                  <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-900 text-sm">
                    ₦{invoice.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-slate-300 font-bold text-sm">
                  <td colSpan={2} className="py-3 px-4 text-right text-slate-700">
                    Total Amount Cleared:
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-extrabold text-[#001C3D] text-base">
                    ₦{invoice.amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* QR Code Verification & Stamp Section */}
          <div className="border-t border-slate-200 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="p-2 bg-white border border-slate-200 rounded-xl shadow-xs shrink-0">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Verification Code" 
                  className="w-24 h-24 object-contain"
                />
              </div>
              <div className="space-y-1 max-w-xs">
                <span className="text-xs font-bold text-[#001C3D] flex items-center justify-center sm:justify-start gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[#F58220]" />
                  <span>Online Verification Code</span>
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Scan this code to verify document authenticity directly against central university records.
                </p>
                <div className="text-[10px] font-mono text-slate-400 truncate pt-1">
                  HASH: {invoice.id}
                </div>
              </div>
            </div>

            {/* Official Stamp / Sign-off Block */}
            <div className="text-center sm:text-right border-t sm:border-t-0 pt-4 sm:pt-0 border-slate-100 w-full sm:w-auto">
              <div className="inline-block px-4 py-2 border-2 border-dashed border-emerald-600/60 rounded-xl bg-emerald-50/40 text-emerald-800 mb-2">
                <span className="block font-extrabold text-[11px] tracking-widest uppercase">
                  BURSARY DEPARTMENT
                </span>
                <span className="block font-mono text-[9px] text-emerald-700">
                  ELECTRONICALLY CLEARED
                </span>
              </div>
              <span className="block text-[11px] font-bold text-slate-700">
                Authorized Bursary Officer
              </span>
              <span className="block text-[10px] text-slate-400 italic">
                Valid without physical signature
              </span>
            </div>
          </div>

          {/* Footer Note */}
          {/* <div className="mt-8 pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 font-mono">
            This e-receipt is generated by the Nnamdi Azikiwe University Bursary portal. Any forgery or alteration of this document is a serious academic offense.
          </div> */}

        </div>

      </main>
    </div>
  );
}