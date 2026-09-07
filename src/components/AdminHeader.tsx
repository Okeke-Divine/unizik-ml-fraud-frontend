// unizik-ml-fraud-frontend/src/components/AdminHeader.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, ShieldAlert, LayoutDashboard, FileText, AlertCircle, ShieldCheck, Laptop } from "lucide-react";

export default function AdminHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [pendingAppealsCount, setPendingAppealsCount] = useState<number>(0);

  // Silently fetch pending appeals count for the navigation badge
  useEffect(() => {
    fetch("/api/appeals")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.appeals)) {
          const count = data.appeals.filter((a: any) => a.status === "PENDING").length;
          setPendingAppealsCount(count);
        }
      })
      .catch(() => {}); // Silent fail in background
  }, [pathname]); // Refreshes badge count whenever admin changes pages

  const handleLogout = () => {
    localStorage.removeItem("unizik_user");
    router.push("/login");
  };

  const navLinks = [
    { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
    { label: "All Transactions", href: "/admin/transactions", icon: FileText },
    { 
      label: "Dispute Queue", 
      href: "/admin/appeals", 
      icon: AlertCircle, 
      badge: pendingAppealsCount > 0 ? pendingAppealsCount : null 
    },
    // NEW: Simple, non-technical label for the Bursar
    // { label: "Campus Computers", href: "/admin/velocity", icon: Laptop },
  ];

  return (
    <>
      {/* Top Academic Research Notice Bar */}
      <div className="bg-[#001C3D] text-white px-4 py-1.5 text-center text-[11px] font-medium tracking-wide flex items-center justify-center gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#F58220] shrink-0" />
        <span>Predictive Fraud Detection System for University E-payment Portals | OKEKE DIVINE-VESSEL</span>
      </div>

      <header className="bg-white border-b border-slate-200/80 sticky top-0 z-20 shadow-2xs">
        {/* Main Branding & Clearance Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          
          {/* Brand & Logo Section */}
          <div className="flex items-center gap-3">
            <img
              src="/unizik.png"
              alt="UNIZIK Crest"
              className="w-10 h-10 object-contain shrink-0"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center w-10 h-10 rounded-xl bg-[#001C3D] text-white shadow-sm shrink-0">
              <ShieldAlert className="w-5 h-5 text-[#F58220]" />
            </div>
            <div>
              <span className="font-extrabold tracking-tight text-[#001C3D] block text-sm sm:text-base leading-tight">
                NNAMDI AZIKIWE UNIVERSITY
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#F58220] block mt-0.5">
                Bursary Administrative Portal
              </span>
            </div>
          </div>

          {/* Admin Clearance & Sign Out */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs font-bold text-[#001C3D] bg-blue-50/80 px-3 py-1.5 rounded-xl border border-blue-100">
              <ShieldAlert className="w-3.5 h-3.5 text-[#F58220]" />
              <span>Bursary Officer</span>
            </div>
            <button
              onClick={handleLogout}
              className="px-3.5 py-2 text-slate-600 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-150 flex items-center gap-1.5 text-xs font-bold border border-slate-200 hover:border-rose-600 shadow-2xs cursor-pointer"
              title="Sign Out of Portal"
            >
              <LogOut className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>

        {/* Responsive Institutional Navigation Strip */}
        <nav className="bg-slate-50/80 border-t border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`);
            
            return (
              <button
                key={link.href}
                onClick={() => router.push(link.href)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#001C3D] text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-200/60 hover:text-slate-900"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#F58220]" : "text-slate-400"}`} />
                <span>{link.label}</span>
                {link.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold ${
                    isActive ? "bg-[#F58220] text-white" : "bg-rose-600 text-white animate-pulse"
                  }`}>
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </header>
    </>
  );
}