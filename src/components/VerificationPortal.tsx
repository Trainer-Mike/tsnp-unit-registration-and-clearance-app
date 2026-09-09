import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { ShieldCheck, ShieldAlert, CheckCircle2, Search, Building2, Calendar, BookOpen, UserCheck, ArrowLeft, QrCode, FileText, X } from 'lucide-react';
import { Registration, InstitutionConfig } from '../types';

interface VerificationPortalProps {
  initialReference?: string;
  registrations?: Registration[];
  config?: InstitutionConfig;
  onBack?: () => void;
  onClose?: () => void;
}

export const VerificationPortal: React.FC<VerificationPortalProps> = ({ initialReference = '', onBack, onClose }) => {
  const handleClose = onBack || onClose;
  const [queryRef, setQueryRef] = useState<string>(initialReference || 'UR-2026-000142');
  const [searchedRecord, setSearchedRecord] = useState<Registration | null>(() => {
    return StorageService.getRegistrationById(initialReference || 'UR-2026-000142') || null;
  });
  const [hasSearched, setHasSearched] = useState<boolean>(true);
  const config = StorageService.getConfig();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && handleClose) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current && handleClose) {
      handleClose();
    }
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const found = StorageService.getRegistrationById(queryRef.trim());
    setSearchedRecord(found || null);
    setHasSearched(true);
  };

  const maskName = (name: string) => {
    return name
      .split(' ')
      .map((part) => (part.length > 2 ? `${part[0]}${'*'.repeat(part.length - 2)}${part[part.length - 1]}` : part))
      .join(' ');
  };

  const isApproved = searchedRecord?.status === 'APPROVED' || searchedRecord?.status === 'RECEIVED_BY_EXAMINATIONS';

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 font-sans"
    >
      <div className="bg-slate-900/95 rounded-2xl max-w-3xl w-full shadow-2xl shadow-black/80 border border-slate-800/90 overflow-hidden flex flex-col max-h-[92vh] my-auto">
        {/* Header bar */}
        <div className="bg-slate-950/90 p-4 sm:p-5 flex items-center justify-between border-b border-slate-800/80 shrink-0">
          <div className="flex items-center gap-2.5">
            {handleClose && (
              <button
                onClick={handleClose}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition mr-1 cursor-pointer"
                title="Back (Esc)"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Public Verification Gateway</h2>
              <p className="text-xs text-slate-400">Validate TVET/CDACC Assessment Unit Registration & Approvals</p>
            </div>
          </div>
          {handleClose && (
            <button
              onClick={handleClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 text-xs text-slate-200">
          {/* Search Box */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={queryRef}
                onChange={(e) => setQueryRef(e.target.value)}
                placeholder="Enter Registration Ref (e.g. UR-2026-000142)"
                className="w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-slate-950/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 font-mono shadow-inner"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-emerald-950/40 whitespace-nowrap cursor-pointer"
            >
              Verify
            </button>
          </form>

          {searchedRecord ? (
            <div className="space-y-5">
              {/* Authenticity Status Ribbon */}
              <div
                className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
                  isApproved
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                    : searchedRecord.status === 'REJECTED'
                    ? 'bg-rose-950/40 border-rose-800/60 text-rose-200'
                    : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isApproved ? (
                    <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                  ) : (
                    <ShieldAlert className="w-7 h-7 text-amber-400 shrink-0" />
                  )}
                  <div>
                    <h3 className="font-bold text-sm sm:text-base tracking-tight text-white">
                      {isApproved
                        ? 'AUTHENTIC & DEPARTMENTALLY APPROVED'
                        : `REGISTRATION IN PROGRESS (${searchedRecord.status.replace(/_/g, ' ')})`}
                    </h3>
                    <p className="text-xs opacity-85 mt-0.5">
                      Registration Ref:{' '}
                      <span className="font-mono font-bold tracking-wide text-emerald-400">
                        {searchedRecord.registrationReference}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-mono uppercase px-2.5 py-1 rounded-full font-bold bg-slate-900 border border-slate-700 text-slate-300">
                    {searchedRecord.status}
                  </span>
                </div>
              </div>

              {/* Verified Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-emerald-400" /> Academic & Candidate Profile
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Candidate:</span>
                    <span className="font-semibold text-slate-100">{maskName(searchedRecord.studentName)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Admission No:</span>
                    <span className="font-mono font-semibold text-slate-100">
                      {searchedRecord.admissionNumber}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Course:</span>
                    <span className="font-medium text-slate-200 text-right">{searchedRecord.courseName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Qualification:</span>
                    <span className="font-bold text-emerald-400">{searchedRecord.levelName}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-950/50 rounded-xl border border-slate-800 space-y-2.5">
                  <div className="font-bold text-slate-200 text-xs border-b border-slate-800 pb-2 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" /> Assessment & Clearance Details
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assessment Series:</span>
                    <span className="font-semibold text-slate-100">{searchedRecord.assessmentSeriesName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assessment Module:</span>
                    <span className="font-mono font-bold text-emerald-400">Module {searchedRecord.module || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Assessment Year:</span>
                    <span className="font-mono font-semibold text-slate-100">{searchedRecord.year}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Units Registered:</span>
                    <span className="font-bold text-slate-100">{searchedRecord.units.length} Units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Approved by HOD:</span>
                    <span className="font-semibold text-emerald-400">
                      {searchedRecord.hodApproval?.hodName || 'Pending Final Authorization'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Units Verification Matrix */}
              <div>
                <h4 className="font-bold text-xs text-slate-300 mb-2 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-emerald-400" /> CDACC Units & Respective Trainer Clearances
                </h4>
                <div className="border border-slate-800 rounded-xl overflow-hidden text-xs">
                  <table className="w-full divide-y divide-slate-800">
                    <thead className="bg-slate-950 text-slate-400 font-semibold text-[11px]">
                      <tr>
                        <th className="px-3 py-2 text-left">Unit Code & Name</th>
                        <th className="px-3 py-2 text-center">Category</th>
                        <th className="px-3 py-2 text-left">Assigned Trainer</th>
                        <th className="px-3 py-2 text-right">Verification Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                      {searchedRecord.units.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-800/40">
                          <td className="px-3 py-2">
                            <div className="font-mono font-bold text-slate-200 text-[11px]">{u.unitCode}</div>
                            <div className="text-slate-400 text-[11px]">{u.unitName}</div>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300">
                              {u.category}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-300 text-[11px] font-medium">{u.trainerName}</td>
                          <td className="px-3 py-2 text-right">
                            {u.status === 'APPROVED' ? (
                              <span className="inline-flex items-center gap-1 text-emerald-400 font-semibold text-[11px]">
                                <CheckCircle2 className="w-3.5 h-3.5" /> Cleared
                              </span>
                            ) : u.status === 'REJECTED' ? (
                              <span className="text-rose-400 font-semibold text-[11px]">Rejected</span>
                            ) : (
                              <span className="text-amber-400 text-[11px]">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Digital Seal Certificate */}
              {isApproved && searchedRecord.hodApproval && (
                <div className="p-4 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-slate-950 flex items-center justify-center font-extrabold text-sm shadow-md shrink-0">
                      TSNP
                    </div>
                    <div>
                      <div className="font-bold text-emerald-300 text-sm">
                        Official Clearance Seal Applied
                      </div>
                      <div className="text-emerald-400/90 text-[11px]">
                        Authorized by: {searchedRecord.hodApproval.hodName} ({searchedRecord.hodApproval.designation})
                      </div>
                      <div className="font-mono text-[10px] text-emerald-500/80">
                        Clearance Ref: {searchedRecord.hodApproval.approvalRef} • Date:{' '}
                        {new Date(searchedRecord.hodApproval.approvedAt).toLocaleDateString('en-GB')}
                      </div>
                    </div>
                  </div>
                  <div className="text-center font-mono text-[10px] font-bold text-emerald-300 bg-slate-950 px-3 py-1.5 rounded-lg border border-emerald-700/50 shadow-inner">
                    IMMUTABLE TSNP/CDACC CERTIFICATE
                  </div>
                </div>
              )}
            </div>
          ) : (
            hasSearched && (
              <div className="text-center py-12 text-slate-400">
                <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-200">Registration Record Not Found</h3>
                <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1">
                  No registered CDACC assessment record matched reference &quot;{queryRef}&quot;. Please verify the reference number.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 flex justify-end shrink-0">
          {handleClose && (
            <button
              onClick={handleClose}
              className="px-4 py-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
            >
              Close Gateway
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
