import React, { useState } from 'react';
import {
  Trainer,
  User,
  Registration,
  RegistrationUnitItem,
  InstitutionConfig,
  formatModuleShort,
} from '../../types';
import { StorageService } from '../../services/storage';
import { UnitVerificationModal } from './UnitVerificationModal';
import { AuditTrailViewer } from '../AuditTrailViewer';
import { OfficialFormPrintView } from '../OfficialFormPrintView';
import {
  CheckCircle2,
  Clock,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  ShieldCheck,
  UserCheck,
  BookOpen,
  FileText,
  History,
  CheckCheck,
  AlertCircle,
  Briefcase,
} from 'lucide-react';

interface TrainerDashboardProps {
  trainer: Trainer;
  user: User;
  registrations: Registration[];
  config: InstitutionConfig;
  onOpenVerificationPortal: (ref: string) => void;
}

export const TrainerDashboard: React.FC<TrainerDashboardProps> = ({
  trainer,
  user,
  registrations,
  config,
  onOpenVerificationPortal,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [activeModal, setActiveModal] = useState<{
    registration: Registration;
    unitItem: RegistrationUnitItem;
  } | null>(null);
  const [selectedAuditReg, setSelectedAuditReg] = useState<Registration | null>(null);
  const [selectedPrintReg, setSelectedPrintReg] = useState<Registration | null>(null);

  // Extract all verification tasks assigned to this trainer across all registrations
  interface TrainerTask {
    registration: Registration;
    unitItem: RegistrationUnitItem;
  }

  // Helper to reliably check if a unit is assigned to the current trainer
  const isUnitAssignedToTrainer = (unit: RegistrationUnitItem) => {
    if (!unit) return false;

    const tId = (trainer?.id || '').trim().toLowerCase();
    const tUserId = (trainer?.userId || user?.id || '').trim().toLowerCase();
    const tStaff = (trainer?.staffNumber || user?.identifierNumber || '').trim().toLowerCase();
    const tName = (trainer?.name || user?.name || '').trim().toLowerCase();

    const uTrainerId = (unit.trainerId || '').trim().toLowerCase();
    const uTrainerName = (unit.trainerName || '').trim().toLowerCase();
    const uStaff = ((unit as any).trainerStaffNumber || '').trim().toLowerCase();

    // 1. Direct ID matching (trainer ID, user ID, staff number)
    if (tId && uTrainerId === tId) return true;
    if (tUserId && uTrainerId === tUserId) return true;
    if (tStaff && (uTrainerId === tStaff || uStaff === tStaff)) return true;

    // 2. Name matching (exact or normalized)
    if (tName && uTrainerName === tName) return true;
    if (tName && uTrainerName && (uTrainerName.includes(tName) || tName.includes(uTrainerName))) return true;

    // 3. Match staff number contained in trainer name string
    if (tStaff && uTrainerName.includes(tStaff)) return true;

    return false;
  };

  const allTrainerTasks: TrainerTask[] = [];
  registrations.forEach((reg) => {
    if (!reg.units || !Array.isArray(reg.units)) return;
    reg.units.forEach((unit) => {
      if (isUnitAssignedToTrainer(unit)) {
        allTrainerTasks.push({
          registration: reg,
          unitItem: unit,
        });
      }
    });
  });

  // Calculate metrics
  const pendingCount = allTrainerTasks.filter((t) => t.unitItem.status === 'PENDING').length;
  const approvedCount = allTrainerTasks.filter((t) => t.unitItem.status === 'APPROVED').length;
  const rejectedCount = allTrainerTasks.filter((t) => t.unitItem.status === 'REJECTED' || t.unitItem.status === 'RETURNED').length;

  // Filter tasks
  const filteredTasks = allTrainerTasks.filter((task) => {
    const matchesStatus =
      filterStatus === 'ALL'
        ? true
        : filterStatus === 'PENDING'
        ? task.unitItem.status === 'PENDING'
        : filterStatus === 'APPROVED'
        ? task.unitItem.status === 'APPROVED'
        : task.unitItem.status === 'REJECTED' || task.unitItem.status === 'RETURNED';

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      task.registration.studentName.toLowerCase().includes(q) ||
      task.registration.admissionNumber.toLowerCase().includes(q) ||
      task.registration.registrationReference.toLowerCase().includes(q) ||
      task.unitItem.unitCode.toLowerCase().includes(q) ||
      task.unitItem.unitName.toLowerCase().includes(q);

    return matchesStatus && matchesSearch;
  });

  const handleBatchApprovePending = () => {
    const pendingTasks = allTrainerTasks.filter((t) => t.unitItem.status === 'PENDING');
    if (pendingTasks.length === 0) return;

    const confirmed = window.confirm(
      `Are you sure you want to electronic approve all ${pendingTasks.length} pending candidate units?`
    );
    if (!confirmed) return;

    pendingTasks.forEach((t) => {
      StorageService.verifyRegistrationUnit({
        registrationId: t.registration.id,
        unitItemId: t.unitItem.id,
        decision: 'APPROVED',
        comment: 'Batch verified by assigned trainer based on continuous assessment records.',
        trainer,
        user,
      });
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full">
      {/* Trainer Profile & Specialization Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-950 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-slate-800">
            <Briefcase className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{trainer.name}</h1>
              <span className="bg-slate-800 text-slate-300 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border border-slate-700">
                Staff ID: {trainer.staffNumber}
              </span>
              <span className="bg-emerald-500/10 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                Subject Trainer
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              <span className="font-semibold text-slate-300">Specialization:</span> {trainer.specialization}
            </p>
          </div>
        </div>

        {pendingCount > 0 && (
          <button
            onClick={handleBatchApprovePending}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition shrink-0"
          >
            <CheckCheck className="w-4 h-4" /> Batch Verify All Pending ({pendingCount})
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
        <div
          onClick={() => setFilterStatus('PENDING')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'PENDING'
              ? 'bg-amber-950/20 border-amber-500/60 ring-1.5 ring-amber-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Verification</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2 font-mono">{pendingCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Students awaiting your sign-off</p>
        </div>

        <div
          onClick={() => setFilterStatus('APPROVED')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'APPROVED'
              ? 'bg-emerald-950/20 border-emerald-500/60 ring-1.5 ring-emerald-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Approved Units</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-2 font-mono">{approvedCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Electronically verified & cleared</p>
        </div>

        <div
          onClick={() => setFilterStatus('REJECTED')}
          className={`p-4 sm:p-5 rounded-2xl border transition cursor-pointer ${
            filterStatus === 'REJECTED'
              ? 'bg-rose-950/20 border-rose-500/60 ring-1.5 ring-rose-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Returned / Rejected</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <XCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-2 font-mono">{rejectedCount}</div>
          <p className="text-[11px] text-slate-400 mt-0.5">Feedback provided to candidate</p>
        </div>
      </div>

      {/* Verification Queue Section */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Filter & Search Bar */}
        <div className="p-3.5 sm:p-5 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {(['PENDING', 'APPROVED', 'REJECTED', 'ALL'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  filterStatus === st
                    ? 'bg-emerald-600 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'All Tasks' : st}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate or unit code..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-w-0">
          {filteredTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No verification tasks match the selected filter.
            </div>
          ) : (
            <table className="w-full divide-y divide-slate-800 text-xs min-w-[700px]">
              <thead className="bg-slate-950 text-slate-300 font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Candidate Info</th>
                  <th className="px-4 py-3 text-left">Course & Series</th>
                  <th className="px-4 py-3 text-left">Assigned Unit</th>
                  <th className="px-4 py-3 text-center">Category</th>
                  <th className="px-4 py-3 text-left">Verification Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {filteredTasks.map(({ registration, unitItem }) => (
                  <tr key={`${registration.id}-${unitItem.id}`} className="hover:bg-slate-800/40 transition">
                    {/* Student Info */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{registration.studentName}</div>
                      <div className="font-mono text-emerald-400 text-[11px]">{registration.admissionNumber}</div>
                      <div className="text-[10px] text-slate-500 font-mono">Ref: {registration.registrationReference}</div>
                    </td>

                    {/* Course */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-200">
                        {registration.courseCode}{' '}
                        <span className="text-emerald-400 font-mono text-[11px]">({formatModuleShort(registration.module)})</span>
                      </div>
                      <div className="text-[11px] text-slate-400">{registration.assessmentSeriesName}</div>
                    </td>

                    {/* Unit */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-mono font-bold text-emerald-400">{unitItem.unitCode}</span>
                        {unitItem.isReassessment && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            RE-SIT (KES {(unitItem.amountCharged || 2000).toLocaleString()})
                          </span>
                        )}
                      </div>
                      <div className="text-slate-300 font-medium">{unitItem.unitName}</div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                        {unitItem.category}
                      </span>
                    </td>

                    {/* Verification Status */}
                    <td className="px-4 py-3">
                      {unitItem.status === 'APPROVED' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> VERIFIED
                          </span>
                          {unitItem.signatureRef && (
                            <div className="text-[9px] font-mono text-slate-400 mt-0.5">
                              {unitItem.signatureRef}
                            </div>
                          )}
                        </div>
                      ) : unitItem.status === 'REJECTED' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                          {unitItem.decisionComment && (
                            <div className="text-[10px] text-rose-300 max-w-xs truncate mt-0.5">
                              {unitItem.decisionComment}
                            </div>
                          )}
                        </div>
                      ) : unitItem.status === 'RETURNED' ? (
                        <div>
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <RotateCcw className="w-3 h-3" /> RETURNED
                          </span>
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                          <Clock className="w-3 h-3 text-amber-400" /> Pending Review
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setActiveModal({ registration, unitItem })}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xs ${
                            unitItem.status === 'PENDING'
                              ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                          }`}
                        >
                          {unitItem.status === 'PENDING' ? 'Verify Unit' : 'Edit Decision'}
                        </button>
                        <button
                          onClick={() => setSelectedAuditReg(registration)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="Audit Trail"
                        >
                          <History className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setSelectedPrintReg(registration)}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                          title="View Official Form"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Unit Verification Modal */}
      {activeModal && (
        <UnitVerificationModal
          registration={activeModal.registration}
          unitItem={activeModal.unitItem}
          trainer={trainer}
          user={user}
          onClose={() => setActiveModal(null)}
          onSuccess={() => setActiveModal(null)}
        />
      )}

      {/* Audit Modal */}
      {selectedAuditReg && (
        <AuditTrailViewer
          registration={selectedAuditReg}
          onClose={() => setSelectedAuditReg(null)}
        />
      )}

      {/* Print Form Modal */}
      {selectedPrintReg && (
        <OfficialFormPrintView
          registration={selectedPrintReg}
          config={config}
          onClose={() => setSelectedPrintReg(null)}
        />
      )}
    </div>
  );
};
