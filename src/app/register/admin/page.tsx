// unizik-ml-fraud-frontend/src/app/register/admin/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, ShieldAlert, ArrowRight, CheckCircle2, AlertCircle, Building2, Key } from "lucide-react";

export default function AdminRegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    role: "BURSARY_OFFICER",
    password: "",
    confirmPassword: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Strict executive password validation
    if (formData.password !== formData.confirmPassword) {
      setError("The administrative passwords entered do not match. Please re-verify.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError("To enforce institutional clearance security, executive passwords must be at least 8 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: formData.fullName,
          username: formData.username,
          role: formData.role,
          password: formData.password
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Executive onboarding failed. Please verify institutional clearance.");
      }
    } catch (err) {
      setError("Unable to communicate with the central university authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col justify-between py-10 px-4 sm:px-6 lg:px-8 font-sans selection:bg-[#001C3D] selection:text-white">

      <div className="sm:mx-auto sm:w-full sm:max-w-xl my-auto">
        
        {/* Brand & Logo Section matching Login Modal */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-3">
            <img 
              src="/unizik.png" 
              alt="UNIZIK Crest" 
              className="h-16 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center w-14 h-14 rounded-2xl bg-[#001C3D] text-white shadow-lg shadow-blue-900/20">
              <ShieldAlert className="w-8 h-8 text-[#F58220]" />
            </div>
          </div>
          
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#001C3D]">
            NNAMDI AZIKIWE UNIVERSITY
          </h2>
          <p className="text-xs font-bold uppercase tracking-widest text-[#F58220] mt-1 flex items-center justify-center gap-1.5">
            <Key className="w-3.5 h-3.5" />
            <span>Bursary &amp; ICT Administrative Command</span>
          </p>
          <p className="text-xs text-slate-600 mt-2 font-medium max-w-md mx-auto leading-relaxed">
            Register an authorized executive clearance account for the e-payment fraud governance and dispute portal.
          </p>
        </div>

        {/* Vercel-Style Glass Card matching Login & Student Onboarding */}
        <div className="bg-white border border-slate-200/80 py-8 px-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-2xl sm:px-10 relative">
          
          {success ? (
            <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#001C3D]">Executive Clearance Established</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Administrative credentials synchronized. Redirecting to secure login gateway...
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              
              {/* Row 1: Full Name */}
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Officer Full Name &amp; Title
                </label>
                <div className="relative rounded-xl shadow-2xs">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    required
                    placeholder="e.g. Dr. Prof. B.O. Ekeh"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/10 font-bold transition-all"
                  />
                </div>
              </div>

              {/* Row 2: Username & Role */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Staff Username / ID
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Shield className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="e.g. admin_bursary"
                      value={formData.username}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/10 font-mono font-bold transition-all lowercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Directorate Role
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Building2 className="w-4 h-4" />
                    </div>
                    <select
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-[#001C3D] focus:outline-none focus:bg-white focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/10 transition-all"
                    >
                      <option value="BURSARY_OFFICER">Bursary Officer</option>
                      <option value="BURSARY_DIRECTOR">Chief Bursary Director</option>
                      <option value="ICT_DIRECTOR">ICT Systems Director</option>
                      <option value="AUDIT_OFFICER">Forensic Audit Officer</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Row 3: Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Executive Password
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/10 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#F58220] focus:ring-2 focus:ring-[#F58220]/10 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Error Notification Badge */}
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2 animate-in fade-in duration-200">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span className="font-semibold leading-relaxed">{error}</span>
                </div>
              )}

              {/* Submit Action Button matching Admin Login Orange Palette */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-3 py-3.5 px-4 bg-[#F58220] hover:bg-[#d97016] text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Synchronizing Clearance...</span>
                  </div>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4" />
                    <span>Authorize &amp; Create Executive Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

        </div>

        {/* Login Redirect */}
        <p className="mt-6 text-center text-xs text-slate-600 font-medium">
          Already possess an authorized administrative credential?{" "}
          <a href="/login" className="text-[#001C3D] hover:text-[#F58220] font-bold hover:underline transition-colors cursor-pointer">
            Login Here
          </a>
        </p>

      </div>

    </div>
  );
}