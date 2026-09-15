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
  asn_debug_ip?: string | null;
  asn_debug_isp?: string | null;
  asn_debug_source?: string | null;
};

type DiagnosticsContextType = {
  values: DiagnosticsValues;
  isEdited: boolean;
  setField: (k: keyof DiagnosticsValues, v: any) => void;
  clearEdits: () => void;
};

const defaultValues: DiagnosticsValues = {
  device_student_count_24h: 1,
  page_dwell_time_seconds: 0.1,
  is_high_risk_asn: 0,
  failed_attempts_1h: 0,
  session_hardware_mismatch: 0,
  is_off_peak_hour: 0,
  deviceId: null,
  asn_debug_ip: null,
  asn_debug_isp: null,
  asn_debug_source: null,
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
  const valuesRef = useRef<DiagnosticsValues>(defaultValues);
  const pageStartRef = useRef<number>(0);
  const serverFetchIdRef = useRef<number>(0);
  const [isEditedFlag, setIsEditedFlag] = useState(false);

  const getBaselineLoginDeviceId = () => {
    try {
      const explicit = localStorage.getItem('unizik_login_device');
      if (explicit) return explicit;
      const userRaw = localStorage.getItem('unizik_user');
      const user = userRaw ? JSON.parse(userRaw) : undefined;
      return user?.loginDeviceId || null;
    } catch (e) {
      return null;
    }
  };

  const getClientOffPeakFlag = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    if (hour >= 1 && hour < 4) return 1;
    if (hour === 4 && minute <= 30) return 1;
    return 0;
  };

  // Helper to set field and mark edited
  const setField = (k: keyof DiagnosticsValues, v: any) => {
    setValues((s) => ({ ...s, [k]: v }));
    editedRef.current[k as string] = true;
    setIsEditedFlag(true);
  };

  // Persist immediately when a field is changed to avoid race where checkout reads stale localStorage
  const setFieldAndPersist = (k: keyof DiagnosticsValues, v: any) => {
    editedRef.current[k as string] = true;
    setIsEditedFlag(true);
    try {
      const next = { ...valuesRef.current, [k]: v } as DiagnosticsValues;

      // If user toggles hardware mismatch, reflect that in the stored device id so both UI and checkout use it
      if (k === 'session_hardware_mismatch') {
        try {
          if (Number(v) === 1) {
            const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
            const spoof = `UNIZIK_FP_${rand}`;
            localStorage.setItem('unizik_device_id', spoof);
            next.deviceId = spoof;
          } else {
            const baseline = getBaselineLoginDeviceId() || localStorage.getItem('unizik_device_id') || next.deviceId || undefined;
            if (baseline) localStorage.setItem('unizik_device_id', baseline);
            next.deviceId = baseline as any;
          }
        } catch (e) {}
      }

      setValues(next);
      valuesRef.current = next;
      localStorage.setItem('unizik_diag_values', JSON.stringify(next));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(true));
    } catch (e) {}
  };

  const clearEdits = async () => {
    editedRef.current = {};
    setIsEditedFlag(false);
    try {
      localStorage.setItem('unizik_diag_edited', JSON.stringify(false));
      const baseline = getBaselineLoginDeviceId();
      if (baseline) localStorage.setItem('unizik_device_id', baseline);
    } catch (e) {}
    // refresh server telemetry immediately and persist
    refreshClientTelemetry();
    await fetchServerTelemetry();
  };

  // Fetch server-side telemetry for the current device/student
  const fetchServerTelemetry = async () => {
    try {
      const requestId = ++serverFetchIdRef.current;
      const deviceId = localStorage.getItem('unizik_device_id') || valuesRef.current.deviceId || undefined;
      const userRaw = localStorage.getItem('unizik_user');
      const user = userRaw ? JSON.parse(userRaw) : undefined;
      const studentId = user?.id;

      const params = new URLSearchParams();
      if (deviceId) params.set('deviceId', deviceId);
      if (studentId) params.set('studentId', studentId);

      const res = await fetch(`/api/telemetry?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return;
      const d = await res.json();
      if (requestId !== serverFetchIdRef.current) return;
      // Only apply server values to fields that are not edited
      setValues((s) => ({
        ...s,
        device_student_count_24h: editedRef.current['device_student_count_24h'] ? s.device_student_count_24h : d.device_student_count_24h,
        failed_attempts_1h: editedRef.current['failed_attempts_1h'] ? s.failed_attempts_1h : d.failed_attempts_1h,
        is_high_risk_asn: editedRef.current['is_high_risk_asn'] ? s.is_high_risk_asn : d.is_high_risk_asn,
        asn_debug_ip: d?.asn_debug?.ip || null,
        asn_debug_isp: d?.asn_debug?.isp || null,
        asn_debug_source: d?.asn_debug?.source || null,
      }));
    } catch (e) {
      // ignore
    }
  };

  // Refresh client-side telemetry (deviceId, dwell time, hardware mismatch, off-peak)
  const refreshClientTelemetry = async () => {
    try {
      const fp = await generateDeviceFingerprint();
      const activeDeviceId = localStorage.getItem('unizik_device_id') || valuesRef.current.deviceId || null;
      const baselineDeviceId = getBaselineLoginDeviceId();
      const dwell = Math.max(0.1, (performance.now() - pageStartRef.current) / 1000);
      const offPeak = getClientOffPeakFlag();

      setValues((s) => ({
        ...s,
        deviceId: activeDeviceId,
        page_dwell_time_seconds: editedRef.current['page_dwell_time_seconds']
          ? s.page_dwell_time_seconds
          : Number(Math.max(Number(s.page_dwell_time_seconds || 0), dwell).toFixed(2)),
        session_hardware_mismatch: editedRef.current['session_hardware_mismatch']
          ? s.session_hardware_mismatch
          : (baselineDeviceId && activeDeviceId && baselineDeviceId !== activeDeviceId ? 1 : 0),
        is_off_peak_hour: editedRef.current['is_off_peak_hour'] ? s.is_off_peak_hour : offPeak,
      }));
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;
    pageStartRef.current = performance.now();

    const init = async () => {
      const fp = await generateDeviceFingerprint();
      if (!mounted) return;

      const baseline = getBaselineLoginDeviceId();
      if (baseline) localStorage.setItem('unizik_login_device', baseline);

      localStorage.setItem('unizik_device_id', fp);

      refreshClientTelemetry();
      fetchServerTelemetry();
    };

    init();

    // client telemetry every 1s for responsive live updates
    // Persist initial snapshot so checkout reads a stable object even before edits
    try {
      localStorage.setItem('unizik_diag_values', JSON.stringify(values));
      localStorage.setItem('unizik_diag_edited', JSON.stringify(isEditedFlag));
    } catch (e) {}
    const clientId = setInterval(() => {
      refreshClientTelemetry();
    }, 1000);

    // server telemetry every 5s
    const serverId = setInterval(() => {
      fetchServerTelemetry();
    }, 5000);

    return () => {
      mounted = false;
      clearInterval(clientId);
      clearInterval(serverId);
    };
  }, []);

  // Persist diagnostics to localStorage so checkout can read current panel values
  useEffect(() => {
    valuesRef.current = values;
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
              <div className="text-[11px] text-slate-500 leading-snug bg-slate-50 border border-slate-200 rounded-lg p-2">
                ASN Live Source: {values.asn_debug_source || 'n/a'} | ISP: {values.asn_debug_isp || 'n/a'} | IP: {values.asn_debug_ip || 'n/a'}
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
