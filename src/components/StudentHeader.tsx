// unizik-ml-fraud-frontend/src/components/StudentHeader.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, User, LogOut, Cpu } from "lucide-react";

interface StudentHeaderProps {
  user?: {
    name?: string;
    matricNumber?: string;
    department?: string;
    level?: number;
  } | null;
}

export default function StudentHeader({ user: propUser }: StudentHeaderProps) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(propUser || null);

  // Silently read from localStorage if prop wasn't passed directly
  useEffect(() => {
    if (!user) {
      const storedUser = localStorage.getItem("unizik_user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    }
  }, [user]);

  const handleLogout = () => {
    localStorage.removeItem("unizik_user");
    router.push("/login");
  };

  return (
    <>
      {/* Top Academic Research Notice Bar */}
      <div className="bg-[#001C3D] text-white px-4 py-1.5 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-2">
        <Cpu className="w-3.5 h-3.5 text-[#F58220] shrink-0" />
        <span>Predictive Fraud Detection System for University E-payment Portals | OKEKE DIVINE-VESSEL</span>
      </div>

      {/* Institutional Navigation Header */}
      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-[0_2px_15px_rgb(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Clickable Brand & Logo Section */}
          <div 
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-3.5 cursor-pointer group"
          >
            <img 
              src="/unizik.png" 
              alt="UNIZIK Crest" 
              className="w-12 h-12 object-contain group-hover:scale-105 transition-transform duration-200"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#001C3D] text-white shadow-md">
              <Shield className="w-5 h-5 text-[#F58220]" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-[#001C3D] block text-base sm:text-lg leading-tight group-hover:text-[#F58220] transition-colors">
                NNAMDI AZIKIWE UNIVERSITY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block mt-0.5">
                Undergraduate Financial Hub
              </span>
            </div>
          </div>

          {/* User Profile & Logout Controls */}
          <div className="flex items-center gap-3">
            {user && (
              <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-slate-700 bg-slate-100/80 px-3.5 py-2 rounded-xl border border-slate-200/80">
                <User className="w-3.5 h-3.5 text-[#001C3D]" />
                <span>{user.name}</span>
                <span className="text-slate-400 font-mono">({user.matricNumber})</span>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-slate-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-200 flex items-center gap-1.5 text-xs font-bold border border-slate-200/80 hover:border-rose-600 shadow-sm"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
}