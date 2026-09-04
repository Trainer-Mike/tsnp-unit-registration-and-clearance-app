import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storage';
import { Registration, User, InstitutionConfig } from '../../types';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  Building,
  UserCheck,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  X,
  FileCheck2,
} from 'lucide-react';

interface HODApprovalModalProps {
  registration: Registration;
  hodUser: User;
  config: InstitutionConfig;
  onClose: () => void;
  onSuccess: (updatedReg: Registration) => void;
}

export const HODApprovalModal: React.FC<HODApprovalModalProps> = ({
  registration,
  hodUser,
  config,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'APPROVED' | 'REJECTED' | 'RETURNED'>('APPROVED');
  const [comments, setComments] = useState<string>(
    'All CDACC Assessment Units verified by respective subject trainers. Candidate is eligible and departmentally cleared for the assessment series.'
  );
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) {
      onClose();
    }
  };

  const unverifiedUnits = registration.units.filter((u) => u.status === 'PENDING');
  const rejectedUnits = registration.units.filter((u) => u.status === 'REJECTED' || u.status === 'RETURNED');
  const allTrainersVerified = unverifiedUnits.length === 0;

  const handleDecisionChange = (newDecision: 'APPROVED' | 'REJECTED' | 'RETURNED') => {
    setDecision(newDecision);
    setErrorMsg('');
    if (newDecision === 'APPROVED') {
      setComments('All CDACC Assessment Units verified by respective subject trainers. Candidate is eligible and departmentally cleared for the assessment series.');
    } else if (newDecision === 'RETURNED') {
      setComments('Registration returned for correction. Please see departmental feedback.');
    } else {
      setComments('Departmental clearance rejected. Candidate does not meet CDACC requirements.');
    }
  };

  const handleApprove = () => {
    if (decision === 'APPROVED' && !allTrainersVerified && !config.allowPartialApproval) {
      setErrorMsg('Cannot approve registration: some units have not yet been verified by assigned trainers.');
      return;
    }
    if ((decision === 'REJECTED' || decision === 'RETURNED') && !comments.trim()) {
      setErrorMsg('Mandatory comments are required for rejection or return.');
      return;
    }

    setIsProcessing(true);

    const result = StorageService.approveRegistrationHOD({
      registrationId: registration.id,
      decision,
      comments: comments.trim(),
      hodUser,
    });

    if (result.success && result.updatedRegistration) {
      if (decision === 'APPROVED') {
        try {
          confetti({
            particleCount: 100,
            spread: 80,
            origin: { y: 0.5 },
          });
        } catch {
          // ignore
        }
      }

      setTimeout(() => {
        setIsProcessing(false);
        onSuccess(result.updatedRegistration!);
        onClose();
      }, 500);
    } else {
      setErrorMsg(result.message);
      setIsProcessing(false);
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 font-sans"
    >
      <div className="bg-slate-900 rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-200 my-auto">
        {/* Header */}
        <div className="bg-slate-950 text-white p-4 sm:p-5 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <button
              onClick={onClose}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg border border-slate-700 transition mr-1"
              title="Back (Esc)"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base truncate">Head of Department (HOD) Final Clearance</h3>
              <p className="text-xs text-slate-400 truncate">
                Departmental Authorization • {config.departmentName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition shrink-0"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs text-slate-200 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student Dossier */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-3">
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-4 gap-2 pb-3 border-b border-slate-800">
              <div>
                <span className="text-slate-500 block">Candidate:</span>
                <span className="font-bold text-white text-sm">{registration.studentName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Admission Number:</span>
                <span className="font-mono font-bold text-emerald-400">{registration.admissionNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Course & Level:</span>
                <span className="font-medium text-slate-300">{registration.courseCode} ({registration.levelName})</span>
              </div>
              <div>
                <span className="text-slate-500 block">Registration Ref:</span>
                <span className="font-mono font-bold text-emerald-400">{registration.registrationReference}</span>
              </div>
            </div>

            {/* Units Verification Inspection */}
            <div>
              <div className="flex flex-wrap items-center justify-between gap-1 mb-2">
                <span className="font-bold text-slate-200">Trainer Verifications Inspection:</span>
                <span className="font-mono font-semibold text-emerald-400">
                  {registration.units.filter((u) => u.status === 'APPROVED').length} of {registration.units.length} Units Verified
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {registration.units.map((u) => (
                  <div
                    key={u.id}
                    className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-emerald-400">{u.unitCode}</span>
                        <span className="font-medium text-slate-200 truncate">{u.unitName}</span>
                        {u.isReassessment && (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            REASSESSMENT (KES {(u.amountCharged || 2000).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 truncate">
                        Trainer: <span className="font-semibold text-slate-300">{u.trainerName}</span>
                        {u.decisionComment && <span className="italic"> — &quot;{u.decisionComment}&quot;</span>}
                      </div>
                    </div>

                    <div className="shrink-0">
                      {u.status === 'APPROVED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="w-3 h-3" /> VERIFIED
                        </span>
                      ) : u.status === 'REJECTED' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                          <XCircle className="w-3 h-3" /> REJECTED
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/10 text-amber-300 border border-amber-500/30">
                          PENDING
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-bold text-slate-200 text-xs mb-2">
              HOD Clearance Decision <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleDecisionChange('APPROVED')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center gap-1 sm:gap-1.5 transition text-center ${
                  decision === 'APPROVED'
                    ? 'bg-emerald-950/30 border-emerald-500 text-emerald-300 font-bold ring-1.5 ring-emerald-500'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <CheckCircle2 className={`w-5 h-5 ${decision === 'APPROVED' ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="text-xs">APPROVE & CLEAR</span>
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Apply digital seal</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('RETURNED')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center gap-1 sm:gap-1.5 transition text-center ${
                  decision === 'RETURNED'
                    ? 'bg-amber-950/30 border-amber-500 text-amber-300 font-bold ring-1.5 ring-amber-500'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <RotateCcw className={`w-5 h-5 ${decision === 'RETURNED' ? 'text-amber-400' : 'text-slate-500'}`} />
                <span className="text-xs">RETURN</span>
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Request corrections</span>
              </button>

              <button
                type="button"
                onClick={() => handleDecisionChange('REJECTED')}
                className={`p-2.5 sm:p-3 rounded-xl border flex flex-col items-center gap-1 sm:gap-1.5 transition text-center ${
                  decision === 'REJECTED'
                    ? 'bg-rose-950/30 border-rose-500 text-rose-300 font-bold ring-1.5 ring-rose-500'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <XCircle className={`w-5 h-5 ${decision === 'REJECTED' ? 'text-rose-400' : 'text-slate-500'}`} />
                <span className="text-xs">REJECT</span>
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Deny registration</span>
              </button>
            </div>
          </div>

          {/* Remarks Input */}
          <div>
            <label className="block font-bold text-slate-200 text-xs mb-1">
              Departmental Clearance Remarks:
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter official departmental comments..."
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>

          {/* Electronic Authorization Preview */}
          {decision === 'APPROVED' && (
            <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/40 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
                <div className="min-w-0">
                  <div className="font-bold text-emerald-300 text-xs truncate">Official Department Clearance Stamp</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    Approver: <span className="font-semibold text-white">{hodUser.name}</span> ({config.hodDesignation})
                  </div>
                </div>
              </div>
              <div className="text-right font-mono text-[10px] text-emerald-400 bg-slate-900 px-2.5 py-1 rounded border border-emerald-500/30 shrink-0">
                TSNP/CI/APP/2026
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-t border-slate-800 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            Cancel
          </button>
          <button
            id="confirm-hod-approve-btn"
            onClick={handleApprove}
            disabled={isProcessing}
            className={`px-5 sm:px-6 py-2 text-xs font-bold rounded-xl shadow-md transition ${
              decision === 'APPROVED'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                : decision === 'RETURNED'
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isProcessing ? 'Authorizing Clearance...' : `Confirm & Authorize (${decision})`}
          </button>
        </div>
      </div>
    </div>
  );
};
