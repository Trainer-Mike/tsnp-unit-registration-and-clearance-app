import React, { useState, useEffect } from 'react';
import { Database, RefreshCw } from 'lucide-react';
import { DatabaseDiagnosticModal } from './DatabaseDiagnosticModal';

interface DatabaseStatusBadgeProps {
  className?: string;
  variant?: 'compact' | 'full';
}

export function DatabaseStatusBadge({ className = '', variant = 'compact' }: DatabaseStatusBadgeProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [status, setStatus] = useState<'loading' | 'connected' | 'fallback'>('loading');
  const [latency, setLatency] = useState<number | null>(null);
  const [isPlaceholder, setIsPlaceholder] = useState<boolean>(false);

  const checkStatus = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const json = await res.json();
        setIsPlaceholder(Boolean(json.database?.isPlaceholder));
        if (json.database?.connected) {
          setStatus('connected');
          setLatency(json.database.latencyMs || null);
        } else {
          setStatus('fallback');
        }
      } else {
        setStatus('fallback');
      }
    } catch {
      setStatus('fallback');
    }
  };

  useEffect(() => {
    checkStatus();
    // Poll every 45 seconds to keep status fresh
    const interval = setInterval(checkStatus, 45000);
    return () => clearInterval(interval);
  }, []);

  if (variant === 'compact') {
    return (
      <>
        <button
          onClick={() => setModalOpen(true)}
          title="Click for live Neon PostgreSQL and Vercel database diagnostics"
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] sm:text-[11px] font-medium font-mono transition border cursor-pointer ${
            status === 'connected'
              ? 'bg-emerald-950/40 hover:bg-emerald-950/70 text-emerald-400 border-emerald-800/60'
              : status === 'fallback'
              ? 'bg-amber-950/40 hover:bg-amber-950/70 text-amber-300 border-amber-800/60'
              : 'bg-slate-900 text-slate-400 border-slate-800'
          } ${className}`}
        >
          <Database className="w-3 h-3 shrink-0" />
          {status === 'loading' ? (
            <span className="flex items-center gap-1">
              <RefreshCw className="w-2.5 h-2.5 animate-spin" /> DB
            </span>
          ) : status === 'connected' ? (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Neon DB {latency ? `(${latency}ms)` : 'Connected'}
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              {isPlaceholder ? 'Memory Preview (Sample URL)' : 'Memory Preview'}
            </span>
          )}
        </button>

        <DatabaseDiagnosticModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
      </>
    );
  }

  // Full variant for dashboard cards
  return (
    <>
      <div
        onClick={() => setModalOpen(true)}
        className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 ${
          status === 'connected'
            ? 'bg-emerald-950/20 border-emerald-800/40 hover:border-emerald-700/60'
            : 'bg-amber-950/20 border-amber-800/40 hover:border-amber-700/60'
        } ${className}`}
      >
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl border ${
              status === 'connected'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
            }`}
          >
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-sm text-slate-100">Database & Cloud Persistence</h4>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  status === 'connected'
                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                    : 'bg-amber-950/80 text-amber-300 border-amber-800'
                }`}
              >
                {status === 'connected'
                  ? 'Neon Connected'
                  : isPlaceholder
                  ? 'Placeholder URL Detected'
                  : 'Memory Preview'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              {status === 'connected'
                ? `Active single source of truth (${latency ? `Latency: ${latency}ms` : 'Online'}). Click to view diagnostics.`
                : isPlaceholder
                ? 'DATABASE_URL is set to sample placeholder credentials. Click to view instructions.'
                : 'Running on in-memory fallback. Click to view AI Studio & Vercel setup instructions.'}
            </p>
          </div>
        </div>
        <button className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold underline shrink-0">
          Diagnose
        </button>
      </div>

      <DatabaseDiagnosticModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
