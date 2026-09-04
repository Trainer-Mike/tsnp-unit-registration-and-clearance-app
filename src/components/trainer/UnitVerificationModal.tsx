import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../../services/storage';
import { Registration, RegistrationUnitItem, Trainer, User, UnitVerificationStatus } from '../../types';
import {
  CheckCircle2,
  XCircle,
  RotateCcw,
  ShieldCheck,
  UserCheck,
  BookOpen,
  Calendar,
  AlertCircle,
  Pen,
  ArrowLeft,
  X,
} from 'lucide-react';

interface UnitVerificationModalProps {
  registration: Registration;
  unitItem: RegistrationUnitItem;
  trainer: Trainer;
  user: User;
  onClose: () => void;
  onSuccess: () => void;
}

export const UnitVerificationModal: React.FC<UnitVerificationModalProps> = ({
  registration,
  unitItem,
  trainer,
  user,
  onClose,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<UnitVerificationStatus>('APPROVED');
  const [comments, setComments] = useState<string>('Candidate has satisfied all prerequisite coursework, practical assignments and attendance requirements.');
  const [reasonCategory, setReasonCategory] = useState<string>('');
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

  const presetReasons = [
    'Candidate has not completed prerequisite coursework unit.',
    'Practical laboratory assignments and project portfolio incomplete.',
    'Class attendance is below the mandatory 75% institutional threshold.',
    'Continuous Assessment Tests (CATs) not sat for.',
    'Unit is not applicable to current candidate stage.',
  ];

  const handleApplyPreset = (reason: string) => {
    setReasonCategory(reason);
    setComments(reason);
  };

  const handleDecisionChange = (newDecision: UnitVerificationStatus) => {
    setDecision(newDecision);
    setErrorMsg('');
    if (newDecision === 'APPROVED') {
      setComments('Candidate has satisfied all prerequisite coursework, practical assignments and attendance requirements.');
    } else if (newDecision === 'REJECTED') {
      setComments(presetReasons[0]);
    } else if (newDecision === 'RETURNED') {
      setComments('Please attach missing laboratory workbook for clearance.');
    }
  };

  const handleSubmit = () => {
    if ((decision === 'REJECTED' || decision === 'RETURNED') && !comments.trim()) {
      setErrorMsg('Mandatory reason/comment is required for rejections and returns.');
      return;
    }

    setIsProcessing(true);

    const result = StorageService.verifyRegistrationUnit({
      registrationId: registration.id,
      unitItemId: unitItem.id,
      decision,
      comment: comments.trim(),
      trainer,
      user,
    });

    if (result.success) {
      setTimeout(() => {
        setIsProcessing(false);
        onSuccess();
        onClose();
      }, 400);
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
      <div className="bg-slate-900 rounded-2xl max-w-xl w-full shadow-2xl border border-slate-800 overflow-hidden flex flex-col max-h-[92vh] text-slate-200 my-auto">
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
              <h3 className="font-bold text-sm sm:text-base truncate">Trainer Electronic Unit Verification</h3>
              <p className="text-xs text-slate-400 truncate">
                Staff: <span className="text-emerald-400 font-semibold">{trainer.name}</span> ({trainer.staffNumber})
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

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs text-slate-200 flex-1">
          {errorMsg && (
            <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl text-rose-200 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Student & Unit Summary Card */}
          <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-2">
            <div className="grid grid-cols-1 xs:grid-cols-2 gap-2 pb-2 border-b border-slate-800">
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
                <span className="font-medium text-slate-300">{registration.courseCode} • {registration.levelName}</span>
              </div>
              <div>
                <span className="text-slate-500 block">Assessment Series:</span>
                <span className="font-medium text-slate-300">{registration.assessmentSeriesName}</span>
              </div>
            </div>

            <div className="pt-1">
              <span className="text-slate-500 block">Unit Under Verification:</span>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="font-mono font-bold text-emerald-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                  {unitItem.unitCode}
                </span>
                <span className="font-bold text-slate-100">{unitItem.unitName}</span>
                <span className="text-[10px] font-semibold bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700">
                  {unitItem.category}
                </span>
                {unitItem.isReassessment && (
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    🔄 Reassessment Attempt (Re-sit)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Verification Decision Buttons */}
          <div>
            <label className="block font-bold text-slate-200 text-xs mb-2">
              Verification Decision <span className="text-rose-400">*</span>
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
                <span className="text-xs">APPROVE</span>
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Meets requirements</span>
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
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Need correction</span>
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
                <span className="text-[10px] font-normal text-slate-400 hidden xs:inline">Ineligible</span>
              </button>
            </div>
          </div>

          {/* Quick presets for Rejection/Return */}
          {(decision === 'REJECTED' || decision === 'RETURNED') && (
            <div className="space-y-1.5">
              <label className="block text-[11px] font-semibold text-slate-400">Quick Institutional Reasons:</label>
              <div className="flex flex-wrap gap-1.5">
                {presetReasons.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => handleApplyPreset(reason)}
                    className="text-[10px] px-2.5 py-1 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 text-left transition"
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Comments/Remarks Input */}
          <div>
            <label className="block font-bold text-slate-200 text-xs mb-1">
              Trainer Verification Remarks {decision !== 'APPROVED' && <span className="text-rose-400">*</span>}
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Enter specific verification comments or instructions..."
              className="w-full text-xs p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>

          {/* Digital Signature Badge Preview */}
          <div className="p-3 bg-emerald-950/20 rounded-xl border border-emerald-800/40 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Pen className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-emerald-300">Electronic Signature Authorization</div>
                <div className="text-[10px] text-emerald-400/80 font-mono">
                  Signer: {trainer.name} • ID: {trainer.staffNumber}
                </div>
              </div>
            </div>
            <span className="px-2 py-0.5 bg-slate-900 text-emerald-400 font-mono text-[10px] font-bold rounded border border-emerald-500/30">
              TSNP-VER-AUTH
            </span>
          </div>
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
            id="confirm-trainer-verify-btn"
            onClick={handleSubmit}
            disabled={isProcessing}
            className={`px-5 py-2 text-xs font-bold rounded-xl shadow-md transition ${
              decision === 'APPROVED'
                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                : decision === 'RETURNED'
                ? 'bg-amber-600 hover:bg-amber-500 text-slate-950'
                : 'bg-rose-600 hover:bg-rose-500 text-white'
            }`}
          >
            {isProcessing ? 'Saving Decision...' : `Authorize & Save (${decision})`}
          </button>
        </div>
      </div>
    </div>
  );
};
