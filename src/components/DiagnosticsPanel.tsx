"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { Settings, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { generateDeviceFingerprint } from "@/lib/fingerprint";

type DiagnosticsValues = {
  device_student_count_24h?: number | null;
  page_dwell_time_seconds?: number | null;
  is_high_risk_asn?: number | null;
  failed_attempts_1h?: number | null;
  session_hardware_mismatch?: number | null;
  is_off_peak_hour?: number | null;
  deviceId?: string | null;
};

type DiagnosticsContextType = {
  values: DiagnosticsValues;
  isEdited: boolean;
  setField: (k: keyof DiagnosticsValues, v: any) => void;
  clearEdits: () => void;
};

const defaultValues: DiagnosticsValues = {
  device_student_count_24h: 1,
  page_dwell_time_seconds: 65.0,
  is_high_risk_asn: 0,
  failed_attempts_1h: 0,
  session_hardware_mismatch: 0,
  is_off_peak_hour: 0,
  deviceId: null,
};

const DiagnosticsContext = createContext<DiagnosticsContextType>({
  values: defaultValues,
  isEdited: false,
  setField: () => {},
  clearEdits: () => {},
});

export function useDiagnostics() {
  return useContext(DiagnosticsContext);
}

export default function DiagnosticsPanel() {
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState<DiagnosticsValues>(defaultValues);
  const editedRef = useRef<Record<string, boolean>>({});
  const [isEditedFlag, setIsEditedFlag] = useState(false);

  // Helper to set field and mark edited
  const setField = (k: keyof DiagnosticsValues, v: any) => {
    setValues((s) => ({ ...s, [k]: v }));
    editedRef.current[k as string] = true;
    setIsEditedFlag(true);
  };

  // Persist immediately when a field is changed to avoid race where checkout reads stale localStorage
  const setFieldAndPersist = (k: keyof DiagnosticsValues, v: any) => {
    setField(k, v);
    try {
      const next = { ...values, [k]: v } as DiagnosticsValues;

      // If user toggles hardware mismatch, reflect that in the stored device id so both UI and checkout use it
      if (k === 'session_hardware_mismatch') {
        try {
          if (Number(v) === 1) {
            const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
            const spoof = `UNIZIK_FP_${rand}`;
            localStorage.setItem('unizik_device_id', spoof);
            next.deviceId = spoof;
          } else {
            const baseline = localStorage.getItem('unizik_login_device') || localStorage.getItem('unizik_device_id') || next.deviceId || undefined;
            if (baseline) localStorage.setItem('unizik_device_id', baseline);
            next.deviceId = baseline as any;
          }
        } catch (e) {}
      }

      localStorage.setItem('unizik_diag_values', JSON.stringify(next));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(true));
    } catch (e) {}
  };

  const clearEdits = async () => {
    editedRef.current = {};
    setIsEditedFlag(false);
    try { localStorage.removeItem('unizik_diag_edited'); } catch (e) {}
    // refresh server telemetry immediately and persist
    await fetchServerTelemetry();
    try {
      localStorage.setItem('unizik_diag_values', JSON.stringify(values));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(false));
    } catch (e) {}
  };

  // Fetch server-side telemetry for the current device/student
  const fetchServerTelemetry = async () => {
    try {
      const deviceId = localStorage.getItem('unizik_device_id') || undefined;
      const userRaw = localStorage.getItem('unizik_user');
      const user = userRaw ? JSON.parse(userRaw) : undefined;
      const studentId = user?.id;

      const params = new URLSearchParams();
      if (deviceId) params.set('deviceId', deviceId);
      if (studentId) params.set('studentId', studentId);

      const res = await fetch(`/api/telemetry?${params.toString()}`);
      if (!res.ok) return;
      const d = await res.json();
      // Only apply server values to fields that are not edited
      setValues((s) => ({
        ...s,
        device_student_count_24h: editedRef.current['device_student_count_24h'] ? s.device_student_count_24h : d.device_student_count_24h,
        failed_attempts_1h: editedRef.current['failed_attempts_1h'] ? s.failed_attempts_1h : d.failed_attempts_1h,
        is_high_risk_asn: editedRef.current['is_high_risk_asn'] ? s.is_high_risk_asn : d.is_high_risk_asn,
      }));
    } catch (e) {
      // ignore
    }
  };

  // Fetch client-side telemetry (deviceId, dwell time, hardware mismatch)
  const fetchClientTelemetry = async () => {
    try {
      const fp = await generateDeviceFingerprint();
      const stored = localStorage.getItem('unizik_device_id');
      if (!stored) localStorage.setItem('unizik_device_id', fp);
      // Simple dwell-time estimate based on performance
      const dwell = Math.max(0.1, ((performance.now() - (window as any).__unizik_page_start_ms || performance.now())) / 1000);

      // Attempt to detect public ISP (client-side) so Diagnostics shows ASN risk immediately when VPN changes
      let clientIsHighRisk = 0;
      try {
        const resp = await fetch('http://ip-api.com/json/?fields=status,isp,query');
        if (resp.ok) {
          const info = await resp.json();
          const ispName = (info.isp || '').toUpperCase();
          const telcos = ["MTN", "GLOBACOM", "AIRTEL", "9MOBILE", "ETISALAT"];
          const isLocalTelco = telcos.some(t => ispName.includes(t));
          clientIsHighRisk = isLocalTelco ? 0 : 1;
        }
      } catch (e) {
        // ignore client-side lookup failures
      }

      setValues((s) => ({
        ...s,
        deviceId: fp,
        page_dwell_time_seconds: editedRef.current['page_dwell_time_seconds'] ? s.page_dwell_time_seconds : Number(dwell.toFixed(2)),
        session_hardware_mismatch: editedRef.current['session_hardware_mismatch'] ? s.session_hardware_mismatch : (localStorage.getItem('unizik_login_device') && localStorage.getItem('unizik_login_device') !== fp ? 1 : 0),
        // only apply client-side ASN decision when user hasn't edited the server-aggregated ASN field
        is_high_risk_asn: editedRef.current['is_high_risk_asn'] ? s.is_high_risk_asn : clientIsHighRisk,
      }));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    // always reset page start marker on panel mount (checkout dwell should reset per navigation)
    (window as any).__unizik_page_start_ms = performance.now();

    // initial fetch
    fetchClientTelemetry();
    fetchServerTelemetry();

    // client telemetry (dwell + hardware) every 1s for responsive dwell updates
    // Persist initial snapshot so checkout reads a stable object even before edits
    try {
      localStorage.setItem('unizik_diag_values', JSON.stringify(values));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(isEditedFlag));
    } catch (e) {}
    const clientId = setInterval(() => {
      fetchClientTelemetry();
    }, 1000);

    // server telemetry every 5s
    const serverId = setInterval(() => {
      fetchServerTelemetry();
    }, 5000);

    return () => {
      clearInterval(clientId);
      clearInterval(serverId);
    };
  }, []);

  // Persist diagnostics to localStorage so checkout can read current panel values
  useEffect(() => {
    try {
      localStorage.setItem('unizik_diag_values', JSON.stringify(values));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(isEditedFlag));
    } catch (e) {}
  }, [values, isEditedFlag]);

  const handleReset = async () => {
    try {
      const deviceId = localStorage.getItem('unizik_device_id');
      const userRaw = localStorage.getItem('unizik_user');
      const user = userRaw ? JSON.parse(userRaw) : undefined;
      const res = await fetch('/api/demo/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId, studentId: user?.id }),
      });
      if (res.ok) {
        // refresh telemetry
        editedRef.current = {};
        setIsEditedFlag(false);
        await fetchServerTelemetry();
      }
    } catch (e) {
      // ignore
    }
      // persisted
  };

  return (
    <DiagnosticsContext.Provider value={{ values, isEdited: isEditedFlag, setField, clearEdits }}>
      {/* Toggle handle: now part of the sliding panel so it moves with the panel */}

      {/* Slide-out panel */}
      <div
        className={`fixed top-0 right-0 h-full z-40 transform transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ width: 360 }}
      >
        <div className="h-full bg-white border-l shadow-lg p-4 flex flex-col relative">
          {/* slide-handle */}
          <div className="absolute left-[-44px] top-1/2 -translate-y-1/2">
            <button
              aria-label="Toggle Diagnostics"
              onClick={() => setOpen((s) => !s)}
              className="w-10 h-10 rounded-full bg-[#001C3D] text-white flex items-center justify-center shadow-md border-2 border-white"
            >
              {open ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4 text-slate-600" />
              <h3 className="text-sm font-bold">Diagnostics</h3>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { fetchServerTelemetry(); }} className="p-1 rounded bg-slate-50 border"><RefreshCw className="w-4 h-4"/></button>
              <button onClick={() => setOpen(false)} className="p-1 rounded bg-transparent text-slate-500 border border-transparent"><ChevronLeft className="w-4 h-4"/></button>
            </div>
          </div>

          <div className="space-y-3 overflow-auto">
            <div className="text-xs text-slate-500">Client Observed</div>
            <div className="space-y-2">
              <div className="text-sm font-mono break-all">Device ID: {values.deviceId}</div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">Page Dwell (s)</label>
                <input className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.page_dwell_time_seconds ?? ''} onChange={(e) => setFieldAndPersist('page_dwell_time_seconds', Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">Hardware Mismatch</label>
                <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.session_hardware_mismatch ?? 0} onChange={(e) => setFieldAndPersist('session_hardware_mismatch', Number(e.target.value))}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
            </div>

            <div className="pt-3 text-xs text-slate-500">Server Aggregates (refreshed every 5s)</div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">Device Student Count (24h)</label>
                <input className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.device_student_count_24h ?? ''} onChange={(e) => setFieldAndPersist('device_student_count_24h', Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">Failed Attempts (1h)</label>
                <input className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.failed_attempts_1h ?? ''} onChange={(e) => setFieldAndPersist('failed_attempts_1h', Number(e.target.value))} />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">High-Risk ASN</label>
                <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.is_high_risk_asn ?? 0} onChange={(e) => setFieldAndPersist('is_high_risk_asn', Number(e.target.value))}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-xs w-44">Off-Peak</label>
                <select className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm" value={values.is_off_peak_hour ?? 0} onChange={(e) => setFieldAndPersist('is_off_peak_hour', Number(e.target.value))}>
                  <option value={0}>0</option>
                  <option value={1}>1</option>
                </select>
              </div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t flex items-center justify-between">
            <div className="text-xs text-slate-500">Mode: {isEditedFlag ? 'SIMULATED' : 'LIVE'}</div>
            <div className="flex items-center gap-2">
              <button onClick={clearEdits} className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm">Clear Edits</button>
              <button onClick={handleReset} className="px-3 py-2 bg-[#F58220] text-white rounded-lg text-sm">Reset Counters</button>
            </div>
          </div>
        </div>
      </div>
    </DiagnosticsContext.Provider>
  );
}
