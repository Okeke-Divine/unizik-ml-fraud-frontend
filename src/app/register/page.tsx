// unizik-ml-fraud-frontend/src/app/register/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, Mail, BookOpen, GraduationCap, ArrowRight, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    matricNumber: "",
    email: "",
    department: "Computer Science",
    level: "100",
    password: "",
    confirmPassword: ""
  });

  const [deviceId, setDeviceId] = useState("HARVESTING_BASELINE_FINGERPRINT...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Harvest baseline hardware fingerprint silently on mount
  useEffect(() => {
    generateDeviceFingerprint().then((fp) => setDeviceId(fp));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Frontend validation guardrails
    if (formData.password !== formData.confirmPassword) {
      setError("The passwords entered do not match. Please re-verify your credential.");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("To ensure account security, passwords must be at least 6 characters long.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: formData.firstName,
          lastName: formData.lastName,
          matricNumber: formData.matricNumber,
          email: formData.email,
          department: formData.department,
          level: Number(formData.level),
          password: formData.password,
          deviceId: deviceId
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/login");
        }, 2000);
      } else {
        setError(data.error || "Registration attempt failed. Please check your inputs.");
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
        
        {/* Brand & Logo Section */}
        <div className="text-center mb-6">
          <div className="flex justify-center items-center mb-3">
            <img 
              src="/unizik.png" 
              alt="UNIZIK Crest" 
              className="h-14 object-contain"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden flex items-center justify-center w-12 h-12 rounded-2xl bg-[#001C3D] text-white shadow-lg shadow-blue-900/20">
              <Shield className="w-6 h-6 text-[#F58220]" />
            </div>
          </div>
          
          <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#001C3D]">
            NNAMDI AZIKIWE UNIVERSITY
          </h1>
          <p className="text-[11px] font-bold uppercase tracking-widest text-[#F58220] mt-0.5">
            Undergraduate Onboarding Portal
          </p>
          <p className="text-xs text-slate-600 mt-1.5 font-medium">
            Create your verifiable student profile to access fee invoicing and secure checkout gateways.
          </p>
        </div>

        {/* Main Onboarding Card */}
        <div className="bg-white border border-slate-200/80 py-8 px-6 shadow-sm rounded-2xl sm:px-10 relative">
          
          {success ? (
            <div className="py-12 text-center space-y-4 animate-in zoom-in-95 duration-300">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto border border-emerald-200 shadow-2xs">
                <CheckCircle2 className="w-8 h-8 stroke-[2.5]" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-extrabold text-[#001C3D]">Profile Created Successfully</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
                  Redirecting to login...
                </p>
              </div>
              <div className="pt-4 flex justify-center">
                <div className="w-6 h-6 border-2 border-[#001C3D]/20 border-t-[#001C3D] rounded-full animate-spin" />
              </div>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleRegister}>
              
              {/* Row 1: Names */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    First Name
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="e.g. Sohail"
                      value={formData.firstName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Last Name (Surname)
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <User className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      name="lastName"
                      required
                      placeholder="e.g. Abdel"
                      value={formData.lastName}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-medium transition-all"
                    />
                  </div>
                </div>
              </div>

              {/* Row 2: Matric Number & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Matriculation Number
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      name="matricNumber"
                      required
                      placeholder="e.g. 2022514009"
                      value={formData.matricNumber}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-mono font-bold transition-all uppercase"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    University Email
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="e.g. s.abdel@unizik.edu.ng"
                      value={formData.email}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-medium transition-all lowercase"
                    />
                  </div>
                </div>
              </div>

              {/* Row 3: Department & Level */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Department / Faculty
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                    <select
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 transition-all"
                    >
                      <option value="Computer Science">Computer Science</option>
                      <option value="Information Technology">Information Technology</option>
                      <option value="Software Engineering">Software Engineering</option>
                      <option value="Cybersecurity">Cybersecurity</option>
                      <option value="Electrical Engineering">Electrical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Accounting">Accounting</option>
                      <option value="Business Administration">Business Administration</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Academic Level
                  </label>
                  <select
                    name="level"
                    value={formData.level}
                    onChange={handleChange}
                    className="block w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 transition-all font-mono"
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                    <option value="500">500 Level</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Passwords */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Create Password
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-medium transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative rounded-xl shadow-2xs">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="password"
                      name="confirmPassword"
                      required
                      placeholder="••••••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:bg-white focus:border-[#001C3D] focus:ring-2 focus:ring-[#001C3D]/10 font-medium transition-all"
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

              {/* Submit Action Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3.5 px-4 bg-[#001C3D] hover:bg-[#00152e] text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-950/20 flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Registering Academic Profile...</span>
                  </div>
                ) : (
                  <>
                    <span>Complete Undergraduate Onboarding</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Device Telemetry Baseline Indicator */}
          {/* <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span className="flex items-center gap-1 font-sans font-semibold text-slate-500">
              <Cpu className="w-3 h-3 text-[#F58220]" />
              <span>Hardware Anchor Hash:</span>
            </span>
            <span className="truncate max-w-[200px] sm:max-w-[280px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200/60 font-semibold text-slate-600">
              {deviceId}
            </span>
          </div> */}

        </div>

        {/* Login Redirect */}
        <p className="mt-5 text-center text-xs text-slate-600 font-medium">
          Already have an active student account?{" "}
          <a href="/login" className="text-[#001C3D] hover:text-[#F58220] font-bold hover:underline transition-colors cursor-pointer">
            Login Here
          </a>
        </p>

      </div>

    </div>
  );
}