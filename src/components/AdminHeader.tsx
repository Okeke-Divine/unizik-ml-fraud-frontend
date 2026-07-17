// unizik-ml-fraud-frontend/src/components/AdminHeader.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldAlert } from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem("unizik_user");
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* Brand & Logo Section */}
        <div className="flex items-center gap-3.5">
          <img 
            src="/unizik.png" 
            alt="UNIZIK Crest" 
            className="w-12 h-12 object-contain"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              e.currentTarget.nextElementSibling?.classList.remove('hidden');
            }}
          />
          <div className="hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#001C3D] text-white shadow-md">
            <ShieldAlert className="w-5 h-5 text-[#F58220]" />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-[#001C3D] block text-base sm:text-lg leading-tight">
              NNAMDI AZIKIWE UNIVERSITY
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block mt-0.5">
              Bursary Administrative Portal
            </span>
          </div>
        </div>

        {/* Admin Clearance & Logout */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-[#001C3D] bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100">
            <ShieldAlert className="w-3.5 h-3.5 text-[#F58220]" />
            <span>Administrator Clearance</span>
          </div>
          <button
            onClick={handleLogout}
            className="px-3.5 py-2 text-slate-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-bold border border-slate-200/80 hover:border-rose-600 shadow-sm cursor-pointer"
            title="Sign Out"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
}