import React, { useState, useEffect } from 'react';
import { X, Activity, Server, Cpu, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface DiagnosticsModalProps {
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ onClose }) => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/diagnostics');
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch (err) {
      console.error('Error fetching diagnostics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDiagnostics();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-[#0f1019] rounded-3xl border border-white/[0.1] shadow-2xl overflow-hidden p-6 space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center space-x-2.5">
            <Activity className="w-5 h-5 text-purple-400" />
            <h2 className="text-base font-bold text-white font-['Syne']">
              System Diagnostics & Engine Status
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-zinc-400">
            Scanning engine state...
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-[#141525] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Gemini Engine</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Online
                  </span>
                </div>
                <p className="font-mono text-white text-xs">gemini-2.5-flash</p>
                <p className="text-[10px] text-zinc-500">Structured JSON schema analysis enabled</p>
              </div>

              <div className="p-4 rounded-xl bg-[#141525] border border-white/[0.06] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Meta Graph API</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    data?.metaGraphApi?.clientConfigured
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                  }`}>
                    {data?.metaGraphApi?.clientConfigured ? 'Connected' : 'Pending Keys'}
                  </span>
                </div>
                <p className="font-mono text-white text-xs">v19.0 OAuth</p>
                <p className="text-[10px] text-zinc-500">Targeting Instagram Professional accounts</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#141525] border border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-zinc-300 font-semibold">
                <span>Client Video Frame Extractor</span>
                <span className="text-emerald-400 font-mono text-[11px]">HTML5 Video + Web Audio API</span>
              </div>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Raw video stays in the browser. Only representative keyframes at 0.0s, 0.8s, 2.0s and audio waveform features are submitted for evaluation, ensuring zero heavy file lag.
              </p>
            </div>

            {data?.serverUptime && (
              <div className="p-3 rounded-xl bg-black/40 border border-white/[0.05] text-[11px] text-zinc-400 flex items-center justify-between font-mono">
                <span>System Uptime: {Math.round(data.serverUptime)}s</span>
                <span>Active Analyses: {data.activeAnalysesCount}</span>
                <span>Environment: production</span>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white text-xs font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
