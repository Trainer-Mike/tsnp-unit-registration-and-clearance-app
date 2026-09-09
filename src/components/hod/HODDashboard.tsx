import React, { useState } from 'react';
import {
  User,
  Registration,
  InstitutionConfig,
  formatModuleShort,
} from '../../types';
import { StorageService } from '../../services/storage';
import { HODApprovalModal } from './HODApprovalModal';
import { OfficialFormPrintView } from '../OfficialFormPrintView';
import { AuditTrailViewer } from '../AuditTrailViewer';
import {
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  XCircle,
  Search,
  Filter,
  FileText,
  History,
  Building,
  CheckCheck,
  Award,
  Sparkles,
} from 'lucide-react';

interface HODDashboardProps {
  user: User;
  registrations: Registration[];
  config: InstitutionConfig;
  onOpenVerificationPortal: (ref: string) => void;
}

export const HODDashboard: React.FC<HODDashboardProps> = ({
  user,
  registrations,
  config,
  onOpenVerificationPortal,
}) => {
  const [filterTab, setFilterTab] = useState<'READY' | 'ALL' | 'APPROVED' | 'RETURNED'>('READY');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeApprovalModalReg, setActiveApprovalModalReg] = useState<Registration | null>(null);
  const [selectedPrintReg, setSelectedPrintReg] = useState<Registration | null>(null);
  const [selectedAuditReg, setSelectedAuditReg] = useState<Registration | null>(null);

  // Metrics
  const readyForHOD = registrations.filter((r) => r.status === 'AWAITING_HOD_APPROVAL');
  const inTrainerReview = registrations.filter(
    (r) => r.status === 'SUBMITTED' || r.status === 'PARTIALLY_VERIFIED'
  );
  const approvedRegistrations = registrations.filter(
    (r) => r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS'
  );
  const returnedOrRejected = registrations.filter(
    (r) => r.status === 'RETURNED' || r.status === 'REJECTED'
  );

  const totalAssessmentFees = registrations.reduce((acc, r) => acc + (r.totalAmount || 0), 0);

  // Filtering
  const filteredRegistrations = registrations.filter((reg) => {
    const matchesTab =
      filterTab === 'READY'
        ? reg.status === 'AWAITING_HOD_APPROVAL'
        : filterTab === 'APPROVED'
        ? reg.status === 'APPROVED' || reg.status === 'RECEIVED_BY_EXAMINATIONS'
        : filterTab === 'RETURNED'
        ? reg.status === 'RETURNED' || reg.status === 'REJECTED'
        : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      reg.studentName.toLowerCase().includes(q) ||
      reg.admissionNumber.toLowerCase().includes(q) ||
      reg.registrationReference.toLowerCase().includes(q) ||
      reg.courseName.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const handleBatchApproveReady = () => {
    if (readyForHOD.length === 0) return;
    const confirmed = window.confirm(
      `Apply official Head of Department clearance stamp to all ${readyForHOD.length} fully trainer-verified registrations?`
    );
    if (!confirmed) return;

    readyForHOD.forEach((r) => {
      StorageService.approveRegistrationHOD({
        registrationId: r.id,
        decision: 'APPROVED',
        comments: 'Batch cleared and approved by Head of Department based on complete subject trainer verifications.',
        hodUser: user,
      });
    });
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full">
      {/* HOD Header Banner */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-emerald-500/20">
            <Award className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{user.name}</h1>
              <span className="bg-emerald-500/10 text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                {config.hodDesignation}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-slate-300">
                <Building className="w-3.5 h-3.5 text-emerald-400" />
                {config.departmentName}
              </span>
              <span className="text-slate-600 hidden xs:inline">•</span>
              <span className="font-mono text-slate-400 text-[11px]">Ref: {config.formReference}</span>
            </p>
          </div>
        </div>

        {readyForHOD.length > 0 && (
          <button
            onClick={handleBatchApproveReady}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-emerald-950/40 transition shrink-0"
          >
            <CheckCheck className="w-4 h-4" /> Batch Authorize All Ready ({readyForHOD.length})
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div
          onClick={() => setFilterTab('READY')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            filterTab === 'READY'
              ? 'bg-purple-950/20 border-purple-500/60 ring-1.5 ring-purple-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ready for HOD</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-purple-400 mt-1 font-mono">{readyForHOD.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Trainers completed</div>
        </div>

        <div
          onClick={() => setFilterTab('ALL')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            filterTab === 'ALL'
              ? 'bg-slate-800/80 border-slate-600 ring-1.5 ring-slate-600 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">In Trainer Review</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">{inTrainerReview.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Parallel verification</div>
        </div>

        <div
          onClick={() => setFilterTab('APPROVED')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            filterTab === 'APPROVED'
              ? 'bg-emerald-950/20 border-emerald-500/60 ring-1.5 ring-emerald-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Cleared & Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{approvedRegistrations.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Official seal applied</div>
        </div>

        <div
          onClick={() => setFilterTab('RETURNED')}
          className={`p-4 rounded-2xl border transition cursor-pointer ${
            filterTab === 'RETURNED'
              ? 'bg-rose-950/20 border-rose-500/60 ring-1.5 ring-rose-500/60 shadow-lg'
              : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Returned / Rejected</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400 mt-1 font-mono">{returnedOrRejected.length}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Need candidate update</div>
        </div>
      </div>

      {/* Main Registrations Docket Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Table Filter Bar */}
        <div className="p-3.5 sm:p-5 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs overflow-x-auto">
            {[
              { key: 'READY', label: `Ready for HOD (${readyForHOD.length})` },
              { key: 'ALL', label: 'All Registrations' },
              { key: 'APPROVED', label: `Approved (${approvedRegistrations.length})` },
              { key: 'RETURNED', label: `Returned (${returnedOrRejected.length})` },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key as any)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition whitespace-nowrap ${
                  filterTab === tab.key
                    ? 'bg-emerald-600 text-slate-950 shadow-xs'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate, adm, or ref..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Content Table */}
        <div className="overflow-x-auto min-w-0">
          {filteredRegistrations.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No registrations found in this queue.
            </div>
          ) : (
            <table className="w-full divide-y divide-slate-800 text-xs min-w-[780px]">
              <thead className="bg-slate-950 text-slate-300 font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Registration Reference & Series</th>
                  <th className="px-4 py-3 text-left">Candidate Name & Adm</th>
                  <th className="px-4 py-3 text-left">Course & Level</th>
                  <th className="px-4 py-3 text-center">Units Tally</th>
                  <th className="px-4 py-3 text-left">Trainer Verifications</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">HOD Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {filteredRegistrations.map((reg) => {
                  const verifiedCount = reg.units.filter((u) => u.status === 'APPROVED').length;
                  const totalUnits = reg.units.length;
                  const allVerified = verifiedCount === totalUnits;
                  const isApproved = reg.status === 'APPROVED' || reg.status === 'RECEIVED_BY_EXAMINATIONS';

                  return (
                    <tr key={reg.id} className="hover:bg-slate-800/40 transition">
                      {/* Ref & Series */}
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-emerald-400">{reg.registrationReference}</div>
                        <div className="text-[11px] text-slate-300">{reg.assessmentSeriesName}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(reg.submittedAt).toLocaleDateString('en-GB')}
                        </div>
                      </td>

                      {/* Candidate */}
                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{reg.studentName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{reg.admissionNumber}</div>
                      </td>

                      {/* Course */}
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">
                          {reg.courseCode}{' '}
                          <span className="text-emerald-400 font-mono text-[11px]">({formatModuleShort(reg.module)})</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">{reg.levelName}</div>
                      </td>

                      {/* Units Tally */}
                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {totalUnits} Units
                        <div className="text-[10px] text-slate-400 font-normal">
                          {config.defaultCurrency} {reg.totalAmount.toLocaleString()}
                        </div>
                      </td>

                      {/* Trainer Verifications Breakdown */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              allVerified ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/10 text-amber-300 border border-amber-500/30'
                            }`}
                          >
                            {verifiedCount} of {totalUnits} Verified
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {reg.units.map((u) => u.trainerName.split(' ').pop()).filter((v, i, a) => a.indexOf(v) === i).join(', ')}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3 text-center">
                        {isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> APPROVED
                          </span>
                        ) : reg.status === 'AWAITING_HOD_APPROVAL' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-300 border border-purple-500/30 animate-pulse">
                            <Sparkles className="w-3 h-3" /> READY FOR HOD
                          </span>
                        ) : reg.status === 'RETURNED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            <RotateCcw className="w-3 h-3" /> RETURNED
                          </span>
                        ) : reg.status === 'REJECTED' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3" /> REJECTED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            <Clock className="w-3 h-3 text-amber-400" /> In Trainer Review
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            id={`hod-review-btn-${reg.id}`}
                            onClick={() => setActiveApprovalModalReg(reg)}
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition shadow-xs ${
                              reg.status === 'AWAITING_HOD_APPROVAL'
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-slate-950'
                                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                            }`}
                          >
                            {reg.status === 'AWAITING_HOD_APPROVAL' ? 'Review & Clear' : 'Inspect'}
                          </button>
                          <button
                            onClick={() => setSelectedPrintReg(reg)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Official Printable Form"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedAuditReg(reg)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Audit Trail"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* HOD Approval Modal */}
      {activeApprovalModalReg && (
        <HODApprovalModal
          registration={activeApprovalModalReg}
          hodUser={user}
          config={config}
          onClose={() => setActiveApprovalModalReg(null)}
          onSuccess={() => setActiveApprovalModalReg(null)}
        />
      )}

      {/* Official Form Print Modal */}
      {selectedPrintReg && (
        <OfficialFormPrintView
          registration={selectedPrintReg}
          config={config}
          onClose={() => setSelectedPrintReg(null)}
        />
      )}

      {/* Audit Modal */}
      {selectedAuditReg && (
        <AuditTrailViewer
          registration={selectedAuditReg}
          onClose={() => setSelectedAuditReg(null)}
        />
      )}
    </div>
  );
};
