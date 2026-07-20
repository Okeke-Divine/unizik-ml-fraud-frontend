// unizik-ml-fraud-frontend/src/app/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowRight, GraduationCap } from "lucide-react";

export default function AcademicCoverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between p-6 sm:p-12 selection:bg-[#001C3D] selection:text-white">
      
      {/* Top Institutional Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-200/80 pb-6 text-center sm:text-left">
        <div className="flex items-center gap-3">
          <img 
            src="/unizik.png" 
            alt="UNIZIK Crest" 
            className="h-12 w-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center justify-center w-12 h-12 rounded-xl bg-[#001C3D] text-white shadow-sm">
            <Shield className="w-6 h-6 text-[#F58220]" />
          </div>
          <div>
            <h2 className="text-base font-extrabold tracking-tight text-[#001C3D]">
              NNAMDI AZIKIWE UNIVERSITY, AWKA
            </h2>
            <p className="text-[11px] font-bold uppercase tracking-widest text-[#F58220]">
              Faculty of Physical Sciences
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-100/80 border border-slate-200/60 px-3.5 py-1.5 rounded-full text-xs font-bold text-slate-600 font-mono">
          <GraduationCap className="w-4 h-4 text-[#001C3D]" />
          <span>B.Sc. Thesis Defense &bull; 2025/2026</span>
        </div>
      </header>

      {/* Center Content: Formal Thesis Identity */}
      <main className="my-auto py-12 flex flex-col items-center text-center max-w-4xl mx-auto space-y-8">
        
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-widest text-[#F58220] block font-mono">
            Final Year Research Project
          </span>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[#001C3D] leading-[1.15]">
            Development of a Predictive Fraud Detection System for University E-payment Portals using Decision Tree Classification
          </h1>
        </div>

        {/* Minimalist Author & Department Block */}
        <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl p-6 shadow-[0_4px_20px_rgb(0,0,0,0.03)] space-y-3 text-sm">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Researcher</span>
            <span className="font-extrabold text-[#001C3D] font-mono">Okeke Divine-Vessel</span>
          </div>
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Department</span>
            <span className="font-bold text-slate-700 font-mono">Computer Science</span>
          </div>
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-slate-400 font-medium text-xs uppercase tracking-wider">Academic Session</span>
            <span className="font-semibold text-slate-600 font-mono">2025 / 2026</span>
          </div>
        </div>

        {/* Single Launch Action */}
        <div className="pt-4">
          <button
            onClick={() => router.push("/login")}
            className="px-8 py-4 bg-[#001C3D] hover:bg-[#00152e] active:scale-[0.99] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-950/15 transition-all duration-200 flex items-center gap-3 cursor-pointer group"
          >
            <span>Enter Demonstration Portal</span>
            <ArrowRight className="w-4 h-4 text-[#F58220] group-hover:translate-x-1 transition-transform" />
          </button>
        </div>

      </main>

      {/* Bottom Academic Footer */}
      <footer className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-400 gap-2">
        <span>Department of Computer Science &bull; Nnamdi Azikiwe University</span>
        <span className="font-mono">July 2026 &bull; System Version 1.0</span>
      </footer>

    </div>
  );
}