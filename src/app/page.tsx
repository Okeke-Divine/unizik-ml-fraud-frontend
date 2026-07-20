// unizik-ml-fraud-frontend/src/app/page.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Shield, ArrowUpRight, GraduationCap, Award, BookOpen } from "lucide-react";

export default function AcademicCoverPage() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col justify-between p-6 sm:p-12 lg:p-16 selection:bg-[#001C3D] selection:text-white">
      
      {/* Minimalist Top Bar */}
      <header className="flex items-center justify-between border-b border-slate-200/80 pb-6">
        <div className="flex items-center gap-3">
          <img 
            src="/unizik.png" 
            alt="UNIZIK Crest" 
            className="h-10 w-10 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#001C3D] text-white shadow-sm">
            <Shield className="w-5 h-5 text-[#F58220]" />
          </div>
          <span className="font-extrabold tracking-tight text-[#001C3D] text-sm sm:text-base">
            NNAMDI AZIKIWE UNIVERSITY
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">
          <span>Awka, Nigeria</span>
          <span>&bull;</span>
          <span className="text-[#F58220]">2026</span>
        </div>
      </header>

      {/* Center Widescreen Asymmetric Split */}
      <main className="my-auto py-12 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center max-w-7xl mx-auto w-full">
        
        {/* Left Column (7 Spans): Widescreen Editorial Typography */}
        <div className="lg:col-span-7 space-y-6 pl-0 lg:pl-4 border-l-4 border-[#F58220]">
          <div className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-[#001C3D] bg-blue-50/80 px-3 py-1 rounded-md border border-blue-100">
            <Award className="w-3.5 h-3.5 text-[#F58220]" />
            <span>B.Sc. Project Defense Presentation</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#001C3D] tracking-tight leading-[1.15]">
            Development of a Predictive Fraud Detection System for University E-payment Portals using Decision Tree Classification
          </h1>

          <p className="text-md sm:text-xl text-slate-600 font-medium leading-relaxed max-w-2xl">
            A smart security AI built to stop online fee fraud before it happens, while giving university staff full control to review and unblock genuine student payments.
          </p>
        </div>

        {/* Right Column (5 Spans): Executive Presentation Brief Card */}
        <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-8 shadow-[0_12px_40px_rgb(0,0,0,0.04)] space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/50 rounded-bl-full pointer-events-none" />
          
          <div className="border-b border-slate-100 pb-4 relative z-10">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block font-mono">
              Presentation Metadata
            </span>
            <h3 className="text-lg font-extrabold text-[#001C3D] mt-0.5">
              Project Defense Brief
            </h3>
          </div>

          <div className="space-y-4 text-xs relative z-10">
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Researcher</span>
              <span className="font-extrabold text-[#001C3D] text-sm font-mono">Okeke Divine-Vessel</span>
            </div>
            
            <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Department</span>
              <span className="font-bold text-slate-700">Computer Science</span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Faculty</span>
              <span className="font-bold text-slate-700">Physical Sciences</span>
            </div>

            <div className="flex justify-between items-center py-1 border-t border-slate-100 pt-3">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[11px]">Core Architecture</span>
              <span className="font-mono text-slate-600 font-semibold bg-slate-100 px-2 py-0.5 rounded">
                White-Box ML / Python
              </span>
            </div>
          </div>

          <div className="pt-2 relative z-10">
            <button
              onClick={() => router.push("/login")}
              className="w-full py-4 px-6 bg-[#001C3D] hover:bg-[#00152e] active:scale-[0.99] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-blue-950/20 transition-all duration-200 flex items-center justify-between cursor-pointer group"
            >
              <span>Launch Live Portal</span>
              <ArrowUpRight className="w-4 h-4 text-[#F58220] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </div>

      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200/80 pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] font-medium text-slate-400 gap-2 font-mono">
        <span>NNAMDI AZIKIWE UNIVERSITY &bull; DEPARTMENT OF COMPUTER SCIENCE</span>
        <span>SYSTEM DEFENSE &bull; VERSION 1.0</span>
      </footer>

    </div>
  );
}