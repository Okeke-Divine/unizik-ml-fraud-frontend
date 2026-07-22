// unizik-ml-fraud-frontend/src/components/DefenseTelemetrySwitch.tsx
"use client";

import React from "react";
import { Cpu, ShieldCheck, Bot, Laptop } from "lucide-react";

export type SimulationMode = "NORMAL" | "BOT" | "SPOOF";

interface DefenseTelemetrySwitchProps {
  simMode: SimulationMode;
  onModeChange: (mode: SimulationMode) => void;
  disabled?: boolean;
}

export default function DefenseTelemetrySwitch({
  simMode,
  onModeChange,
  disabled = false,
}: DefenseTelemetrySwitchProps) {
  const options: {
    id: SimulationMode;
    label: string;
    description: string;
    icon: React.ElementType;
    badgeColor: string;
    borderColor: string;
    bgColor: string;
  }[] = [
    {
      id: "NORMAL",
      label: "Standard Student Session",
      description: "Sends real browser dwell-time and clean hardware fingerprint. Results in 100% verified clearance.",
      icon: ShieldCheck,
      badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
      borderColor: "border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-50/30",
      bgColor: "hover:bg-slate-50",
    },
    {
      id: "BOT",
      label: "Simulate Script / Bot Attack",
      description: "Injects 0.12s checkout dwell-time and script identifier. Results in immediate AI security interception.",
      icon: Bot,
      badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
      borderColor: "border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/30",
      bgColor: "hover:bg-slate-50",
    },
    {
      id: "SPOOF",
      label: "Simulate Hardware Spoofing",
      description: "Injects mismatched device fingerprint against baseline login token. Triggers session variance hold.",
      icon: Laptop,
      badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
      borderColor: "border-purple-500 ring-2 ring-purple-500/20 bg-purple-50/30",
      bgColor: "hover:bg-slate-50",
    },
  ];

  return (
    <div className="border border-slate-200/80 rounded-xl p-4 bg-slate-50/50 space-y-3 shadow-2xs">
      <div className="flex items-center justify-between border-b border-slate-200/60 pb-2.5">
        <span className="text-[11px] font-extrabold uppercase tracking-widest text-[#001C3D] flex items-center gap-1.5">
          <Cpu className="w-3.5 h-3.5 text-[#F58220]" />
          <span>Academic Defense: Live Telemetry Simulation</span>
        </span>
        <span className="text-[10px] font-mono font-semibold text-slate-400 bg-white px-2 py-0.5 rounded border border-slate-200">
          SELECT VECTOR
        </span>
      </div>

      <div className="grid grid-cols-1 gap-2.5 pt-0.5">
        {options.map((opt) => {
          const Icon = opt.icon;
          const isSelected = simMode === opt.id;

          return (
            <button
              key={opt.id}
              type="button"
              disabled={disabled}
              onClick={() => onModeChange(opt.id)}
              className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 cursor-pointer disabled:opacity-50 ${
                isSelected ? opt.borderColor : `border-slate-200 bg-white ${opt.bgColor}`
              }`}
            >
              <div
                className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                  isSelected ? "bg-[#001C3D] text-white" : "bg-slate-100 text-slate-600"
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5 flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-xs text-slate-900 truncate">{opt.label}</span>
                  {isSelected && (
                    <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border ${opt.badgeColor}`}>
                      ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{opt.description}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}