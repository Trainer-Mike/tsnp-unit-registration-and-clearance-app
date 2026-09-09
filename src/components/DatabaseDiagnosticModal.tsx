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
    isQuotaExceeded?: boolean;
    message?: string;
    latencyMs?: number;
    databaseName?: string;
    serverTime?: string;
    tablesCount?: number;
  };
  firestore?: {
    provider: string;
    connected: boolean;
    databaseId?: string;
    projectId?: string;
    message?: string;
  };
  storageSource?: string;
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
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleRestoreSavedData = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await fetch('/api/migrate/restore-saved-data', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to restore saved data.');
      }
      setSyncResult({ success: true, message: json.message });
      await fetchHealth(true);
    } catch (err: any) {
      setSyncResult({ success: false, message: err?.message || 'Sync failed.' });
    } finally {
      setSyncing(false);
    }
  };

  const fetchHealth = async (force = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/health${force ? '?force=true' : ''}`);
      const text = await res.text();
      let json: any;
      try {
        json = JSON.parse(text);
      } catch {
        if (text.includes('<!doctype') || text.includes('<html')) {
          throw new Error(
            'The backend server is reloading with your newly updated database connection string. Please wait a few seconds and click "Re-test Connection".'
          );
        }
        throw new Error(`Invalid response received from server (HTTP ${res.status}).`);
      }

      if (!res.ok && !json.database) {
        throw new Error(json.message || `API returned HTTP ${res.status}: ${res.statusText}`);
      }
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
      fetchHealth(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isConnected = data?.database?.connected ?? false;
  const isQuotaExceeded = data?.database?.isQuotaExceeded ?? false;
  const isFirestoreConnected = data?.firestore?.connected ?? false;

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
                  : isQuotaExceeded
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center gap-2">
                Database & Cloud Persistence Diagnostics
              </h3>
              <p className="text-xs text-slate-400">
                Live connectivity, quota status, and institutional persistence
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
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
              <p className="text-xs text-slate-400">Checking database connectivity & quota allowances...</p>
            </div>
          ) : error ? (
            <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-rose-300 text-sm">Backend Connection Error</h4>
                <p className="text-xs text-rose-300/80 mt-1">{error}</p>
                <p className="text-xs text-slate-400 mt-2">
                  This happens if the Express API route is unreachable or restarting.
                </p>
              </div>
            </div>
          ) : isQuotaExceeded ? (
            <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-500/70 space-y-3">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="font-bold text-amber-200 text-sm">
                      Neon Monthly Network Transfer Quota Exceeded (Error 53000)
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-950 border border-rose-800 text-rose-300 font-semibold">
                      Limit Reached
                    </span>
                  </div>
                  <p className="text-xs text-amber-200/90 mt-1.5 leading-relaxed">
                    Neon&apos;s free tier includes a 5 GB/month data transfer allowance. Your Neon database on <code className="text-cyan-300 font-mono font-semibold">{data?.database?.host || 'Neon'}</code> has used all available monthly network transfer, so Neon has paused network queries until the monthly cycle resets.
                  </p>
                  <div className="mt-2.5 p-2.5 bg-slate-950/90 rounded-lg border border-emerald-800/50 text-xs text-emerald-300 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Your database data and tables are safe.</strong> Neon preserves all records during quota suspension.</span>
                  </div>
                </div>
              </div>

              {/* Resolution options */}
              <div className="pt-2 border-t border-amber-800/40 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 bg-slate-900/90 rounded-lg border border-cyan-800/60">
                  <h5 className="font-semibold text-xs text-cyan-300 flex items-center gap-1.5 mb-1">
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" /> Option 1: New Free Neon Project (2 min)
                  </h5>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    Open <a href="https://console.neon.tech" target="_blank" rel="noreferrer" className="text-cyan-400 underline font-semibold">console.neon.tech</a>, create a new free project, copy its connection string, and update <code className="text-amber-300">DATABASE_URL</code> in AI Studio Settings.
                  </p>
                </div>

                <div className="p-3 bg-slate-900/90 rounded-lg border border-emerald-800/60">
                  <h5 className="font-semibold text-xs text-emerald-300 flex items-center gap-1.5 mb-1">
                    <Check className="w-3.5 h-3.5 shrink-0" /> Option 2: Google Cloud Firestore (Active)
                  </h5>
                  <p className="text-[11px] text-slate-300 leading-normal">
                    {isFirestoreConnected
                      ? 'Google Cloud Firestore is connected and actively storing trainee registrations, units, and clearances without Neon transfer limits.'
                      : 'Firestore is provisioned for this applet as durable cloud storage.'}
                  </p>
                </div>
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
                    : 'In-Memory Preview Active (Neon Database Not Connected)'}
                </h4>
                <p className="text-xs text-amber-300/90 mt-1 leading-relaxed">
                  {data?.database?.isPlaceholder
                    ? 'The application detected a DATABASE_URL variable, but its value is currently the default example placeholder ("ep-sample-pooler.region.neon.tech"). Replace this with your real connection string from console.neon.tech.'
                    : 'The application is running in preview demonstration mode.'}
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
                <span className="text-[11px] text-slate-400 block mb-0.5">Primary Provider</span>
                <span className="font-semibold text-slate-200 text-xs sm:text-sm">
                  {data.database?.provider || 'PostgreSQL'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">
                  {data.database?.provider ? data.database.provider.replace(' PostgreSQL', '') : 'DB'} Status
                </span>
                <span
                  className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${
                    isConnected
                      ? 'text-emerald-400'
                      : isQuotaExceeded
                      ? 'text-rose-400'
                      : 'text-amber-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isConnected
                        ? 'bg-emerald-400 animate-pulse'
                        : isQuotaExceeded
                        ? 'bg-rose-400'
                        : 'bg-amber-400'
                    }`}
                  />
                  {isConnected
                    ? 'Connected'
                    : isQuotaExceeded
                    ? 'Quota Exceeded'
                    : data.database.isPlaceholder
                    ? 'Placeholder'
                    : 'Disconnected'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Cloud Firestore</span>
                <span
                  className={`font-semibold text-xs sm:text-sm flex items-center gap-1.5 ${
                    isFirestoreConnected ? 'text-emerald-400' : 'text-slate-400'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isFirestoreConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                    }`}
                  />
                  {isFirestoreConnected ? 'Connected & Synced' : 'Standby'}
                </span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-0.5">Active Storage</span>
                <span className="font-mono text-cyan-400 font-semibold text-xs sm:text-sm capitalize">
                  {data.storageSource ? data.storageSource.replace('_', ' ') : 'Fallback'}
                </span>
              </div>
            </div>
          )}

          {/* Data Recovery & Sync Action Card */}
          <div className="bg-slate-950/80 border border-cyan-900/40 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                  Data Recovery & Supabase Migration
                </h4>
              </div>
              <button
                onClick={handleRestoreSavedData}
                disabled={syncing || !isConnected}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-lg text-xs transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Restoring Data...' : 'Sync Firestore Data to Supabase'}
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              When Neon hit its 5GB monthly limit, the application safely preserved your submitted candidate registrations, trainee records, and audit events in <strong>Google Cloud Firestore</strong>. You can trigger an instant sync to restore any missing documents into your live <strong>Supabase PostgreSQL</strong> instance at any time.
            </p>
            {syncResult && (
              <div
                className={`p-2.5 rounded-lg border text-xs font-medium ${
                  syncResult.success
                    ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300'
                    : 'bg-rose-950/50 border-rose-800 text-rose-300'
                }`}
              >
                {syncResult.message}
              </div>
            )}
          </div>

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
              {data.firestore?.projectId && (
                <div className="px-3 py-2 flex justify-between">
                  <span className="text-slate-400">Firebase Project:</span>
                  <span className="font-mono text-emerald-300">{data.firestore.projectId}</span>
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
              {/* How to Resolve Neon Quota or Set Real URL */}
              <div className="bg-slate-950/90 border border-emerald-900/40 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-sm">
                  <Server className="w-4 h-4" />
                  <span>How to connect a fresh/upgraded Neon database:</span>
                </div>
                <ol className="space-y-1.5 text-xs text-slate-300 list-decimal list-inside leading-relaxed">
                  <li>
                    Log in to{' '}
                    <a
                      href="https://console.neon.tech"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 underline font-semibold inline-flex items-center gap-0.5"
                    >
                      console.neon.tech <ExternalLink className="w-3 h-3" />
                    </a>{' '}
                    and create a new free project or branch.
                  </li>
                  <li>
                    Copy your new connection string from the Neon dashboard (make sure it includes password and <code className="text-cyan-300">?sslmode=require</code>).
                  </li>
                  <li>
                    In AI Studio, open <strong>Settings</strong> &rarr; <strong>Secrets / Environment Variables</strong>, and set <code className="text-cyan-300 font-mono font-bold">DATABASE_URL</code> to the new connection string:
                    <div className="mt-1 p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px] font-mono text-amber-300 break-all">
                      postgresql://neondb_owner:YOUR_PASS@ep-xyz.region.aws.neon.tech/neondb?sslmode=require
                    </div>
                  </li>
                  <li>
                    Return here and click <strong>&quot;Re-test Connection&quot;</strong> below. All tables and TSNP data will automatically initialize!
                  </li>
                </ol>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <button
            onClick={() => fetchHealth(true)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-medium rounded-xl text-xs transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Testing...' : 'Re-test Connection'}
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
