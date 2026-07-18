// src/components/AdminBackButton.tsx
"use client";

import { ArrowLeft } from "lucide-react";

interface BackButtonProps {
  label?: string;
  className?: string;
}

export default function BackButton({ 
  label = "Return to Previous Page", 
  className = "" 
}: BackButtonProps) {
  return (
    <button
      onClick={() => window.history.back()}
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-[#001C3D] hover:text-[#F58220] transition-colors cursor-pointer group mb-6 ${className}`}
    >
      <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
      <span>{label}</span>
    </button>
  );
}