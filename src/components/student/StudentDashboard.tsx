import React, { useState } from 'react';
import {
  Student,
  User,
  Registration,
  Course,
  Level,
  Unit,
  AssessmentSeries,
  InstitutionConfig,
  formatModuleLabel,
} from '../../types';
import { StorageService } from '../../services/storage';
import { UnitRegistrationWizard } from './UnitRegistrationWizard';
import { OfficialFormPrintView } from '../OfficialFormPrintView';
import { AuditTrailViewer } from '../AuditTrailViewer';
import {
  Plus,
  Printer,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  FileText,
  GraduationCap,
  ShieldCheck,
  RotateCcw,
  BookOpen,
  Edit3,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface StudentDashboardProps {
  student: Student;
  user: User;
  registrations: Registration[];
  courses: Course[];
  levels: Level[];
  units: Unit[];
  assessmentSeriesList: AssessmentSeries[];
  config: InstitutionConfig;
  onOpenVerificationPortal: (reference: string) => void;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({
  student,
  user,
  registrations,
  courses,
  levels,
  units,
  assessmentSeriesList,
  config,
  onOpenVerificationPortal,
}) => {
  const [showWizard, setShowWizard] = useState(false);
  const [editingRegistrationModal, setEditingRegistrationModal] = useState<Registration | null>(null);
  const [wizardReassessmentUnitId, setWizardReassessmentUnitId] = useState<string | undefined>(undefined);
  const [selectedForPrint, setSelectedForPrint] = useState<Registration | null>(null);
  const [selectedForAudit, setSelectedForAudit] = useState<Registration | null>(null);
  const [correctionModalReg, setCorrectionModalReg] = useState<Registration | null>(null);
  const [removeConfirmUnit, setRemoveConfirmUnit] = useState<{ reg: Registration; unitId: string; unitName: string } | null>(null);

  const studentRegistrations = registrations.filter(
    (r) => r.studentId === student.id || r.admissionNumber === student.admissionNumber
  );

  const activeRegistration = studentRegistrations[0] || null;
  const course = courses.find((c) => c.id === student.courseId);
  const level = levels.find((l) => l.id === student.levelId);

  const reassessmentFee = typeof config.reassessmentFee === 'number' && config.reassessmentFee > 0 ? config.reassessmentFee : 2000;

  const getStatusBadge = (status: Registration['status']) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Departmentally Approved
          </span>
        );
      case 'RECEIVED_BY_EXAMINATIONS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
            <CheckCircle2 className="w-3.5 h-3.5" /> Docketed by Exams Office
          </span>
        );
      case 'AWAITING_HOD_APPROVAL':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30">
            <Clock className="w-3.5 h-3.5" /> Awaiting HOD Approval
          </span>
        );
      case 'PARTIALLY_VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> In Trainer Verification
          </span>
        );
      case 'SUBMITTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
            <Clock className="w-3.5 h-3.5" /> Submitted – Routing
          </span>
        );
      case 'RETURNED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-500/10 text-orange-300 border border-orange-500/30">
            <RotateCcw className="w-3.5 h-3.5" /> Returned for Correction
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
            <XCircle className="w-3.5 h-3.5" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700">
            {status}
          </span>
        );
    }
  };

  const getStepProgressIndex = (status: Registration['status']) => {
    switch (status) {
      case 'SUBMITTED':
        return 1;
      case 'PARTIALLY_VERIFIED':
        return 2;
      case 'AWAITING_HOD_APPROVAL':
        return 3;
      case 'APPROVED':
        return 4;
      case 'RECEIVED_BY_EXAMINATIONS':
        return 5;
      default:
        return 1;
    }
  };

  const handleQuickRemoveUnit = (reg: Registration, unitId: string) => {
    const remainingUnits = reg.units.filter((u) => u.unitId !== unitId && u.id !== unitId);
    if (remainingUnits.length === 0) {
      alert('A registration must have at least 1 unit. You can use the Review Wizard to replace or modify units.');
      return;
    }

    const removedUnit = reg.units.find((u) => u.unitId === unitId || u.id === unitId);
    const newTotal = remainingUnits.reduce((acc, u) => acc + (u.amountCharged || 0), 0);

    const updatedReg: Registration = {
      ...reg,
      units: remainingUnits,
      totalAmount: newTotal,
      lastUpdatedAt: new Date().toISOString(),
    };

    StorageService.saveRegistration(updatedReg, {
      user,
      action: 'REMOVE_UNIT',
      details: `Candidate removed unit ${removedUnit?.unitCode || unitId} (${removedUnit?.unitName || ''}). New total: ${config.defaultCurrency || 'KES'} ${newTotal.toLocaleString()}.`,
    });

    setRemoveConfirmUnit(null);
  };

  const handleResubmitCorrection = (reg: Registration) => {
    // Reset any rejected/returned units back to PENDING and move status to SUBMITTED
    const updatedUnits = reg.units.map((u) => {
      if (u.status === 'REJECTED' || u.status === 'RETURNED') {
        return {
          ...u,
          status: 'PENDING' as const,
          decisionComment: 'Resubmitted by student with corrections.',
        };
      }
      return u;
    });

    const updatedReg: Registration = {
      ...reg,
      units: updatedUnits,
      status: 'SUBMITTED',
      rejectionReason: undefined,
      correctionComment: undefined,
      resubmissionCount: (reg.resubmissionCount || 0) + 1,
    };

    StorageService.saveRegistration(updatedReg, {
      user,
      action: 'STUDENT_RESUBMISSION',
      details: `${student.name} resubmitted corrected registration for re-verification.`,
    });

    // Notify trainers
    StorageService.createNotification({
      targetRole: 'TRAINER',
      title: 'Registration Resubmitted by Student',
      message: `${student.name} (${student.admissionNumber}) has resubmitted corrected units for verification.`,
      type: 'INFO',
      linkRegistrationId: reg.id,
    });

    setCorrectionModalReg(null);
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full">
      {/* Top Academic Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shrink-0 border border-emerald-400/20">
            {student.name
              .split(' ')
              .map((n) => n[0])
              .join('')}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{student.name}</h1>
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {student.admissionNumber}
              </span>
            </div>
            <div className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1">
              <span className="flex items-center gap-1 font-medium text-slate-300">
                <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {course?.name} ({course?.code})
              </span>
              <span>•</span>
              <span className="font-semibold text-emerald-300">{level?.name}</span>
              <span>•</span>
              <span className="font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-800/40">
                {formatModuleLabel(student.currentModule)}
              </span>
              <span>•</span>
              <span className="text-slate-400">{config.departmentName}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {activeRegistration ? (
            <button
              onClick={() => {
                setEditingRegistrationModal(activeRegistration);
                setShowWizard(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition"
              title="Review, add more units, or remove units from your active registration"
            >
              <Edit3 className="w-4 h-4" /> Review & Modify Units (Add/Remove)
            </button>
          ) : (
            <button
              onClick={() => {
                setEditingRegistrationModal(null);
                setWizardReassessmentUnitId(undefined);
                setShowWizard(true);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 sm:px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition"
            >
              <Plus className="w-4 h-4" /> Start TSNP/CDACC Registration
            </button>
          )}

          <button
            onClick={() => {
              setEditingRegistrationModal(activeRegistration || null);
              setWizardReassessmentUnitId(undefined);
              setShowWizard(true);
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded-xl font-bold text-xs sm:text-sm transition"
            title="Register for a re-sit of any failed units (KES 2,000 flat fee)"
          >
            <RotateCcw className="w-4 h-4 text-amber-400" />
            <span>Reassessment (Re-sit)</span>
          </button>
        </div>
      </div>

      {/* Active Registration Card */}
      {activeRegistration ? (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
          {/* Header of Active Registration */}
          <div className="p-4 sm:p-6 bg-slate-950 border-b border-slate-800/80 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 text-xs text-slate-400 flex-wrap">
                <span>Active Docket</span>
                <span>•</span>
                <span className="font-mono text-emerald-400 font-bold">{activeRegistration.assessmentSeriesName}</span>
                <span>•</span>
                <span className="font-mono text-slate-300">{activeRegistration.year}</span>
                <span>•</span>
                <span className="font-semibold text-emerald-300 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/30">
                  {formatModuleLabel(activeRegistration.module || student.currentModule)}
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-bold font-mono text-white mt-1 flex items-center gap-2 truncate">
                Ref: {activeRegistration.registrationReference}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {getStatusBadge(activeRegistration.status)}

              <button
                onClick={() => {
                  setEditingRegistrationModal(activeRegistration);
                  setShowWizard(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 font-semibold text-xs rounded-xl border border-slate-700 transition"
                title="Review your unit selection to add or remove units"
              >
                <Edit3 className="w-3.5 h-3.5 text-emerald-400" /> Review / Modify Units
              </button>

              {(activeRegistration.status === 'APPROVED' || activeRegistration.status === 'RECEIVED_BY_EXAMINATIONS') && (
                <button
                  id="download-print-form-btn"
                  onClick={() => setSelectedForPrint(activeRegistration)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl transition shadow-md"
                >
                  <Printer className="w-3.5 h-3.5" /> Download / Print Form ({config.formReference})
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          <div className="bg-slate-950/50 border-b border-slate-800/80 px-3 sm:px-6 py-3.5">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2.5">
              Clearance Workflow Lifecycle:
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 text-xs">
              {[
                { label: '1. Submitted', step: 1 },
                { label: '2. Trainer Routing', step: 2 },
                { label: '3. HOD Approval', step: 3 },
                { label: '4. Dept Approved', step: 4 },
                { label: '5. Exams Docketed', step: 5 },
              ].map((st) => {
                const isPassed = getStepProgressIndex(activeRegistration.status) >= st.step;
                const isCurrent = getStepProgressIndex(activeRegistration.status) === st.step;

                return (
                  <div
                    key={st.step}
                    className={`p-2 sm:p-2.5 rounded-xl border text-center transition ${
                      isPassed
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300 font-semibold shadow-xs'
                        : 'bg-slate-900/60 border-slate-800 text-slate-500'
                    } ${isCurrent ? 'ring-1.5 ring-emerald-500 border-emerald-500/60' : ''}`}
                  >
                    <div className="text-[10px] sm:text-[11px] truncate">{st.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Rejection / Returned Alert if any */}
          {(activeRegistration.status === 'RETURNED' || activeRegistration.status === 'REJECTED') && (
            <div className="m-3 sm:m-5 p-4 bg-rose-950/30 border border-rose-800/50 rounded-xl text-xs text-rose-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-rose-300">
                    Registration Action Required ({activeRegistration.status})
                  </div>
                  <p className="mt-0.5 text-rose-200/80">
                    {activeRegistration.rejectionReason ||
                      activeRegistration.correctionComment ||
                      'Please check individual unit remarks below, remove or swap units, and resubmit.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingRegistrationModal(activeRegistration);
                    setShowWizard(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition border border-slate-700"
                >
                  Review / Modify Units
                </button>
                <button
                  onClick={() => setCorrectionModalReg(activeRegistration)}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl transition shadow-md whitespace-nowrap"
                >
                  Resubmit Units
                </button>
              </div>
            </div>
          )}

          {/* Registered Units Table */}
          <div className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div>
                <h3 className="font-bold text-white text-sm">CDACC/TSNP Assessment Units & Trainer Verification</h3>
                <p className="text-xs text-slate-400">
                  Each unit is automatically routed to the responsible subject trainer. You can review, add, or remove units prior to final clearance.
                </p>
              </div>
              <div className="flex items-center gap-3 self-start sm:self-auto">
                <button
                  onClick={() => {
                    setEditingRegistrationModal(activeRegistration);
                    setShowWizard(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" /> Add / Remove Units
                </button>

                <div className="text-left sm:text-right">
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    Total: {config.defaultCurrency} {activeRegistration.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="border border-slate-800 rounded-xl overflow-x-auto text-xs min-w-0">
              <table className="w-full divide-y divide-slate-800 text-left min-w-[620px]">
                <thead className="bg-slate-950 text-slate-300 font-semibold text-[11px]">
                  <tr>
                    <th className="px-3.5 py-2.5 w-10">S/No</th>
                    <th className="px-3.5 py-2.5">Unit Code & Title</th>
                    <th className="px-3.5 py-2.5 text-center">Category</th>
                    <th className="px-3.5 py-2.5">Assigned Trainer</th>
                    <th className="px-3.5 py-2.5 text-right">Fee ({config.defaultCurrency})</th>
                    <th className="px-3.5 py-2.5">Trainer Verification</th>
                    <th className="px-3.5 py-2.5 text-center w-20">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                  {activeRegistration.units.map((unit, idx) => (
                    <tr key={unit.id} className={`hover:bg-slate-800/40 transition ${unit.isReassessment ? 'bg-amber-950/10' : ''}`}>
                      <td className="px-3.5 py-2.5 font-mono text-slate-500">{idx + 1}.</td>
                      <td className="px-3.5 py-2.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-emerald-400">{unit.unitCode}</span>
                          {unit.isReassessment && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                              <RotateCcw className="w-2.5 h-2.5" /> REASSESSMENT (RE-SIT)
                            </span>
                          )}
                        </div>
                        <div className="text-slate-300 font-medium">{unit.unitName}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {unit.category}
                        </span>
                      </td>
                      <td className="px-3.5 py-2.5">
                        <div className="font-semibold text-slate-200">{unit.trainerName}</div>
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-mono font-bold">
                        <span className={unit.isReassessment ? 'text-amber-300' : 'text-slate-100'}>
                          {unit.amountCharged.toLocaleString()}
                        </span>
                        {unit.isReassessment && (
                          <div className="text-[9px] text-amber-400 font-sans font-normal">Re-sit Rate</div>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5">
                        {unit.status === 'APPROVED' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                              <CheckCircle2 className="w-3 h-3" /> VERIFIED
                            </span>
                            {unit.signatureRef && (
                              <div className="text-[9px] font-mono text-slate-500 mt-0.5">
                                Sign: {unit.signatureRef}
                              </div>
                            )}
                          </div>
                        ) : unit.status === 'REJECTED' ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                              <XCircle className="w-3 h-3" /> REJECTED / FAILED
                            </span>
                            {unit.decisionComment && (
                              <div className="text-[10px] text-rose-300 font-medium max-w-xs">
                                Note: {unit.decisionComment}
                              </div>
                            )}
                            <button
                              onClick={() => {
                                setEditingRegistrationModal(activeRegistration);
                                setWizardReassessmentUnitId(unit.unitId);
                                setShowWizard(true);
                              }}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded text-[10px] font-bold shadow-xs transition"
                            >
                              <RotateCcw className="w-3 h-3" /> Re-sit Unit (KES {reassessmentFee.toLocaleString()})
                            </button>
                          </div>
                        ) : unit.status === 'RETURNED' ? (
                          <div>
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                              <RotateCcw className="w-3 h-3" /> RETURNED
                            </span>
                            {unit.decisionComment && (
                              <div className="text-[10px] text-amber-300 font-medium mt-0.5 max-w-xs">
                                Note: {unit.decisionComment}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <Clock className="w-3 h-3 text-amber-400" /> Pending Review
                          </span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingRegistrationModal(activeRegistration);
                              setShowWizard(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Review / Edit this unit in wizard"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {activeRegistration.status !== 'APPROVED' && activeRegistration.status !== 'RECEIVED_BY_EXAMINATIONS' && (
                            <button
                              type="button"
                              onClick={() =>
                                setRemoveConfirmUnit({
                                  reg: activeRegistration,
                                  unitId: unit.unitId,
                                  unitName: `${unit.unitCode} - ${unit.unitName}`,
                                })
                              }
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                              title="Remove unit from registration"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Actions of Card */}
            <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setSelectedForAudit(activeRegistration)}
                  className="inline-flex items-center gap-1.5 text-slate-400 hover:text-slate-200 font-medium transition"
                >
                  <History className="w-4 h-4 text-slate-500" /> View Audit Trail
                </button>
                <button
                  onClick={() => onOpenVerificationPortal(activeRegistration.registrationReference)}
                  className="inline-flex items-center gap-1.5 text-emerald-400 hover:text-emerald-300 font-medium transition"
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> QR Verification Gateway
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingRegistrationModal(activeRegistration);
                    setShowWizard(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 rounded-xl font-bold transition border border-emerald-500/40"
                >
                  <Edit3 className="w-4 h-4 text-emerald-400" /> Review & Modify Units
                </button>
                <button
                  onClick={() => setSelectedForPrint(activeRegistration)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-semibold transition border border-slate-700"
                >
                  <FileText className="w-4 h-4 text-slate-400" /> View Form Sheet
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-8 sm:p-12 border border-slate-800 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white">No Active Unit Registration Found</h2>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-1 mb-5">
            You are currently not registered for the active CDACC/TSNP Assessment Series. Click below to choose your units and submit for trainer verification.
          </p>
          <button
            onClick={() => {
              setEditingRegistrationModal(null);
              setWizardReassessmentUnitId(undefined);
              setShowWizard(true);
            }}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold text-sm shadow-lg shadow-emerald-950/40 transition"
          >
            <Plus className="w-4 h-4" /> Start Registration Wizard
          </button>
        </div>
      )}

      {/* Historical Registrations Section */}
      {studentRegistrations.length > 1 && (
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl">
          <h3 className="font-bold text-white text-sm mb-3 flex items-center gap-2">
            <History className="w-4 h-4 text-emerald-400" /> Registration History & Archives
          </h3>
          <div className="space-y-2">
            {studentRegistrations.slice(1).map((r) => (
              <div
                key={r.id}
                className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="font-mono font-bold text-emerald-400">{r.registrationReference}</div>
                  <div className="text-slate-400 text-[11px]">
                    {r.assessmentSeriesName} ({r.year}) • {r.units.length} Units
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(r.status)}
                  <button
                    onClick={() => setSelectedForPrint(r)}
                    className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                    title="View Form"
                  >
                    <FileText className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Registration Wizard Modal */}
      {showWizard && (
        <UnitRegistrationWizard
          student={student}
          user={user}
          courses={courses}
          levels={levels}
          units={units}
          assessmentSeriesList={assessmentSeriesList}
          config={config}
          initialReassessmentUnitId={wizardReassessmentUnitId}
          editingRegistration={editingRegistrationModal}
          onComplete={(savedReg) => {
            setShowWizard(false);
            setEditingRegistrationModal(null);
            setWizardReassessmentUnitId(undefined);
            setSelectedForPrint(savedReg);
          }}
          onCancel={() => {
            setShowWizard(false);
            setEditingRegistrationModal(null);
            setWizardReassessmentUnitId(undefined);
          }}
        />
      )}

      {/* Quick Remove Confirmation Modal */}
      {removeConfirmUnit && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-800 text-slate-100 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">Remove Unit from Registration?</h3>
                <p className="text-xs text-slate-300 mt-1">
                  Are you sure you want to remove <strong className="text-white">{removeConfirmUnit.unitName}</strong> from your active registration? The registration fee will automatically update.
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRemoveConfirmUnit(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleQuickRemoveUnit(removeConfirmUnit.reg, removeConfirmUnit.unitId)}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-md transition"
              >
                Yes, Remove Unit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Print Modal */}
      {selectedForPrint && (
        <OfficialFormPrintView
          registration={selectedForPrint}
          config={config}
          onClose={() => setSelectedForPrint(null)}
        />
      )}

      {/* Audit Trail Modal */}
      {selectedForAudit && (
        <AuditTrailViewer
          registration={selectedForAudit}
          onClose={() => setSelectedForAudit(null)}
        />
      )}

      {/* Resubmit Modal */}
      {correctionModalReg && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-800 text-slate-100">
            <h3 className="font-bold text-white text-base mb-2">Resubmit Corrected Units</h3>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This will reset rejected or returned units back to pending review and dispatch re-verification tasks to the assigned trainers. Previous feedback remains archived in the digital audit log.
            </p>
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs mb-4">
              <span className="font-bold text-slate-400 block">Registration Ref:</span>
              <span className="font-mono font-bold text-emerald-400">{correctionModalReg.registrationReference}</span>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setCorrectionModalReg(null)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleResubmitCorrection(correctionModalReg)}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md transition"
              >
                Confirm Resubmission
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
