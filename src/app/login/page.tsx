// unizik-ml-fraud-frontend/src/app/login/page.tsx
"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, Lock, User, Terminal, ArrowRight, Laptop } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

export default function LoginPage() {
  const router = useRouter();
  const [matricNumber, setMatricNumber] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [deviceId, setDeviceId] = useState("HARVESTING_FINGERPRINT...");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Harvest hardware fingerprint silently on mount
  useEffect(() => {
    generateDeviceFingerprint().then((fp) => setDeviceId(fp));
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matricNumber, password, deviceId, isAdmin }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Save user profile to local storage for quick UI rendering
        localStorage.setItem("unizik_user", JSON.stringify(data.user));
        
        // Redirect to appropriate domain
        if (data.role === "ADMIN") {
          router.push("/admin/dashboard");
        } else {
          router.push("/dashboard");
        }
      } else {
        setError(data.error || "Login attempt failed.");
      }
    } catch (err) {
      setError("Unable to connect to authentication server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 mb-4 shadow-xl">
          <Shield className="w-10 h-10 text-indigo-500" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Nnamdi Azikiwe University
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          {isAdmin ? "Bursary & ICT Administrative Command" : "Student Fee Payment & Financial Portal"}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-slate-900/80 border border-slate-800 py-8 px-6 shadow-2xl rounded-2xl sm:px-10 relative overflow-hidden">
          
          {/* Admin vs Student Mode Toggle */}
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => { setIsAdmin(false); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                !isAdmin ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Student Portal
            </button>
            <button
              type="button"
              onClick={() => { setIsAdmin(true); setError(null); }}
              className={`flex-1 py-1.5 text-xs font-semibold rounded transition-all ${
                isAdmin ? "bg-amber-600 text-white" : "text-slate-400 hover:text-white"
              }`}
            >
              Admin Command
            </button>
          </div>

          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                {isAdmin ? "Admin Username" : "Matriculation Number"}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  placeholder={isAdmin ? "e.g. admin" : "e.g. 2022/184042"}
                  value={matricNumber}
                  onChange={(e) => setMatricNumber(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300 flex items-center gap-2">
                <Terminal className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-white shadow-lg flex items-center justify-center gap-2 transition-all ${
                isAdmin
                  ? "bg-amber-600 hover:bg-amber-500 shadow-amber-900/20"
                  : "bg-indigo-600 hover:bg-indigo-500 shadow-indigo-900/20"
              } disabled:opacity-50`}
            >
              {loading ? "Authenticating & Verifying Hardware..." : "Secure Login"}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </form>

          {/* Background Telemetry Footnote */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] font-mono text-slate-500 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Laptop className="w-3.5 h-3.5 text-indigo-400" />
              SESSION FINGERPRINT:
            </span>
            <span className="text-slate-400 truncate max-w-[180px]">{deviceId}</span>
          </div>

        </div>

        {!isAdmin && (
          <p className="mt-4 text-center text-xs text-slate-400">
            Don't have a student portal account yet?{" "}
            <a href="/register" className="text-indigo-400 hover:underline font-medium">
              Register New Undergraduate Profile
            </a>
          </p>
        )}
      </div>
    </div>
  );
}