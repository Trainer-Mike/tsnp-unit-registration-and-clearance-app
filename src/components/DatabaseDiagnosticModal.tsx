import React, { useState, useEffect } from 'react';
import {
  Database,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Copy,
  Check,
  Server,
  X,
  Layers,
  HelpCircle,
} from 'lucide-react';

interface DbHealthResponse {
  status: 'ok' | 'degraded';
  database: {
    provider: string;
    connected: boolean;
    variableUsed?: string;
    host?: string;
    isPlaceholder?: boolean;
    message?: string;
    latencyMs?: number;
    databaseName?: string;
    serverTime?: string;
    tablesCount?: number;
  };
  metrics?: {
    registeredStudentsCount: number;
    registeredCandidatesCount: number;
    activeSeriesCount: number;
    lastUpdated: string;
  };
}

interface DatabaseDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DatabaseDiagnosticModal({ isOpen, onClose }: DatabaseDiagnosticModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DbHealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/health');
      if (!res.ok) {
        throw new Error(`API returned HTTP ${res.status}: ${res.statusText}`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err?.message || 'Failed to contact backend health check');
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHealth();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = data?.database?.connected ?? false;

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl border ${
                isConnected
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Neon PostgreSQL & Vercel Diagnostics
              </h3>
              <p className="text-xs text-slate-400">
                Live database connectivity and institutional persistence status
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-sm text-slate-300">
          {/* Status Alert Banner */}
          {loading ? (
            <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-2">
              <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
              <p className="text-xs text-slate-400">Checking Neon PostgreSQL connectivity...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-300 text-sm">Backend Connection Error</h4>
                <p className="text-xs text-rose-300/80 mt-1">{error}</p>
                <p className="text-xs text-slate-400 mt-2">
                  This happens if the Express API route is unreachable or still deploying.
                </p>
              </div>
            </div>
          ) : isConnected ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/60 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-emerald-300 text-sm">
                  Neon PostgreSQL Connected & Synchronized
                </h4>
                <p className="text-xs text-emerald-300/80 mt-0.5">
                  Neon PostgreSQL is your active single source of truth. All registrations, candidates, syllabus units, and staff accounts persist directly to Neon.
                </p>
              </div>
            </div>
          ) : (
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                data?.database?.isPlaceholder
                  ? 'bg-amber-950/50 border-amber-500/50'
                  : 'bg-amber-950/40 border-amber-800/60'
              }`}
            >
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-amber-200 text-sm">
                  {data?.database?.isPlaceholder
                    ? 'Sample Placeholder Database URL Detected'
                    : 'In-Memory Fallback Active (Neon Database Not Connected)'}
                </h4>
                <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                  {data?.database?.isPlaceholder
                    ? 'The application detected a DATABASE_URL variable, but its value is currently the default example placeholder ("ep-sample-pooler.region.neon.tech"). To connect your live database and persist changes permanently, replace this placeholder with your real connection string from console.neon.tech.'
                    : 'The application is running in preview demonstration mode. Changes made in this mode do not persist across deployments because no live database connection is active.'}
                </p>
                {data?.database?.message && (
                  <div className="mt-2 text-xs font-mono bg-slate-950 p-2.5 rounded-lg border border-amber-900/60 text-amber-200 break-all">
                    {data.database.message}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Diagnostic Metrics Grid */}
          {data && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Database Provider</span>
                <span className="font-semibold text-slate-200 text-xs sm:text-sm">Neon PostgreSQL</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Connection Status</span>
                <span
                  className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${
                    isConnected ? 'text-emerald-400' : 'text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                    }`}
                  />
                  {isConnected ? 'Connected' : data.database.isPlaceholder ? 'Placeholder Sample' : 'Memory Fallback'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Latency</span>
                <span className="font-mono text-cyan-400 font-semibold text-xs sm:text-sm">
                  {data.database.latencyMs !== undefined ? `${data.database.latencyMs}ms` : '—'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Tables Synchronized</span>
                <span className="font-mono text-emerald-400 font-semibold text-xs sm:text-sm">
                  {data.database.tablesCount !== undefined ? `${data.database.tablesCount} tables` : '—'}
                </span>
              </div>
            </div>
          )}

          {/* Details Table */}
          {data?.database && (
            <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden divide-y divide-slate-800/80 text-xs">
              <div className="px-3 py-2 flex justify-between">
                <span className="text-slate-400">Target Database:</span>
                <span className="font-mono text-slate-200">{data.database.databaseName || 'neondb'}</span>
              </div>
              {data.database.host && (
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-400">Database Host:</span>
                  <span className="font-mono text-cyan-300 truncate max-w-[280px]">{data.database.host}</span>
                </div>
              )}
              {data.database.variableUsed && (
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-400">Environment Variable:</span>
                  <span className="font-mono text-emerald-400">{data.database.variableUsed}</span>
                </div>
              )}
              {data.metrics && (
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-400">Active Records:</span>
                  <span className="text-slate-300">
                    {data.metrics.registeredCandidatesCount} registrations, {data.metrics.registeredStudentsCount} students
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Step-by-Step Configuration Guide */}
          {!isConnected && (
            <div className="space-y-3">
              {/* Option A: Google AI Studio Preview */}
              <div className="bg-slate-950/90 border border-emerald-900/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Server className="w-4 h-4" />
                  <span>Connecting in Google AI Studio Preview:</span>
                </div>
                <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>
                    In AI Studio, click the <strong>Settings</strong> gear icon (top right or left menu).
                  </li>
                  <li>
                    Under <strong>Secrets / Environment Variables</strong>, set <code className="text-cyan-300 font-mono font-bold">DATABASE_URL</code> to your actual connection string from Neon:
                    <div className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 break-all">
                      postgresql://neondb_owner:YOUR_PASS@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
                    </div>
                  </li>
                  <li>
                    Return here and click <strong>&quot;Re-test Neon Connection&quot;</strong> below.
                  </li>
                </ol>
              </div>

              {/* Option B: Vercel Deployment */}
              <div className="bg-slate-950/90 border border-cyan-900/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm">
                  <HelpCircle className="w-4 h-4" />
                  <span>Connecting on Vercel Deployment:</span>
                </div>
                <ol className="space-y-2 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>
                    Open your project on{' '}
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline hover:text-cyan-300 inline-flex items-center gap-0.5"
                    >
                      Vercel Dashboard <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    &rarr; <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                  </li>
                  <li>
                    Add variable <code className="text-cyan-300 font-mono font-bold">DATABASE_URL</code>:
                    <div className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-700/80 flex items-center justify-between">
                      <span className="text-slate-300 font-mono text-[11px]">DATABASE_URL</span>
                      <button
                        onClick={() => copyToClipboard('DATABASE_URL', 'key')}
                        className="text-slate-400 hover:text-slate-200 p-1 cursor-pointer"
                        title="Copy variable name"
                      >
                        {copiedKey === 'key' ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </li>
                  <li>
                    Redeploy: Go to <strong>Deployments</strong> &rarr; click <strong>...</strong> on the latest build &rarr; <strong>Redeploy</strong>.
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Re-test Neon Connection'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium rounded-xl text-xs transition cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
