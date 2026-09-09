import React, { useEffect, useRef } from 'react';
import { Registration, AuditLogItem } from '../types';
import { History, Shield, CheckCircle, Clock, AlertTriangle, XCircle, User, ArrowLeft, X } from 'lucide-react';

interface AuditTrailViewerProps {
  registration: Registration;
  onClose?: () => void;
}

export const AuditTrailViewer: React.FC<AuditTrailViewerProps> = ({ registration, onClose }) => {
  const logs: AuditLogItem[] = registration.auditLogs || [];
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current && onClose) {
      onClose();
    }
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('APPROVED')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/60 text-emerald-300 border border-emerald-800/60">
          <CheckCircle className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('REJECT')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950/60 text-rose-300 border border-rose-800/60">
          <XCircle className="w-3 h-3" /> {action}
        </span>
      );
    }
    if (action.includes('RETURN')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/60 text-amber-300 border border-amber-800/60">
          <AlertTriangle className="w-3 h-3" /> {action}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/60 text-indigo-300 border border-indigo-800/60">
        <Clock className="w-3 h-3" /> {action}
      </span>
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border border-slate-800 font-sans my-auto">
        {/* Modal Header */}
        <div className="bg-slate-950 text-white p-3.5 sm:p-5 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            {onClose && (
              <button
                onClick={onClose}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition mr-1"
                title="Back (Esc)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <History className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white">Digital Audit Trail & Verification Logs</h3>
              <p className="text-xs text-slate-400">
                Registration Ref: <span className="font-mono font-semibold text-emerald-400">{registration.registrationReference}</span>
              </p>
            </div>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Student Summary Subheader */}
        <div className="bg-slate-950/50 border-b border-slate-800 px-5 py-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <div>
            <span className="text-slate-400 block">Candidate:</span>
            <span className="font-bold text-white">{registration.studentName}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Admission No:</span>
            <span className="font-mono font-semibold text-slate-200">{registration.admissionNumber}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Series:</span>
            <span className="font-medium text-slate-200">{registration.assessmentSeriesName}</span>
          </div>
        </div>

        {/* Timeline Content */}
        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              <Shield className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              No audit records logged yet
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
              {logs.map((log, idx) => (
                <div key={log.id || idx} className="relative group">
                  {/* Timeline Dot */}
                  <div className="absolute -left-6 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 bg-emerald-500 shadow-xs group-hover:scale-125 transition-transform" />

                  <div className="bg-slate-950/60 rounded-xl p-3.5 border border-slate-800 hover:border-slate-700 transition">
                    <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                      <div className="flex items-center gap-2">
                        {getActionBadge(log.action)}
                        <span className="text-xs font-bold text-slate-200 flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" /> {log.userName} ({log.userRole})
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(log.timestamp).toLocaleString([], {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed font-sans">{log.details}</p>

                    {log.newStatus && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 flex items-center gap-1.5">
                        <span className="font-semibold text-slate-400">Workflow Status:</span>
                        <span className="font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700 font-bold text-slate-200">
                          {log.newStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Cryptographic Digital Audit Log • Immutable Records</span>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-800 text-slate-200 rounded-lg hover:bg-slate-700 hover:text-white transition font-medium border border-slate-700"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
