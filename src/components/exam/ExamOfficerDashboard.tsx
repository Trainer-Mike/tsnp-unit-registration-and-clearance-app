import React, { useState } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  User,
  Registration,
  InstitutionConfig,
  AssessmentSeries,
  formatModuleShort,
  formatModuleLabel,
} from '../../types';
import { StorageService } from '../../services/storage';
import { OfficialFormPrintView } from '../OfficialFormPrintView';
import { AuditTrailViewer } from '../AuditTrailViewer';
import {
  FileCheck2,
  Search,
  Download,
  Printer,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building,
  Inbox,
  Filter,
  FileSpreadsheet,
  QrCode,
  Sparkles,
  FileDown,
} from 'lucide-react';

interface ExamOfficerDashboardProps {
  user: User;
  registrations: Registration[];
  assessmentSeriesList: AssessmentSeries[];
  config: InstitutionConfig;
  onOpenVerificationPortal: (ref: string) => void;
}

export const ExamOfficerDashboard: React.FC<ExamOfficerDashboardProps> = ({
  user,
  registrations,
  assessmentSeriesList,
  config,
  onOpenVerificationPortal,
}) => {
  const [selectedSeries, setSelectedSeries] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'APPROVED' | 'ALL' | 'RECEIVED'>('ALL');
  const [selectedPrintReg, setSelectedPrintReg] = useState<Registration | null>(null);
  const [selectedAuditReg, setSelectedAuditReg] = useState<Registration | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Filter registrations
  const approvedRegistrations = registrations.filter(
    (r) => r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS'
  );

  const filtered = registrations.filter((r) => {
    const matchesSeries = selectedSeries === 'ALL' || r.assessmentSeriesId === selectedSeries;
    const matchesStatus =
      statusFilter === 'APPROVED'
        ? r.status === 'APPROVED'
        : statusFilter === 'RECEIVED'
        ? r.status === 'RECEIVED_BY_EXAMINATIONS'
        : true;

    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.studentName.toLowerCase().includes(q) ||
      r.admissionNumber.toLowerCase().includes(q) ||
      r.registrationReference.toLowerCase().includes(q) ||
      r.courseName.toLowerCase().includes(q);

    return matchesSeries && matchesStatus && matchesSearch;
  });

  const handleMarkReceived = (reg: Registration) => {
    setProcessingId(reg.id);
    StorageService.markAsReceivedByExams({
      registrationId: reg.id,
      officerUser: user,
      notes: 'Cleared for CDACC national examination docket indexation.',
    });
    setTimeout(() => {
      setProcessingId(null);
    }, 400);
  };

  const handleExportCSV = () => {
    const headers = [
      'Registration Ref',
      'Admission Number',
      'Student Name',
      'Course Code',
      'Course Name',
      'Level',
      'Module/Cycle',
      'Assessment Series',
      'Year',
      'Total Units',
      'Total Amount (KES)',
      'Status',
      'HOD Approved By',
      'HOD Approval Ref',
      'Approved Date',
    ];

    const rows = filtered.map((r) => [
      `"${r.registrationReference}"`,
      `"${r.admissionNumber}"`,
      `"${r.studentName}"`,
      `"${r.courseCode}"`,
      `"${r.courseName}"`,
      `"${r.levelName}"`,
      `"${formatModuleLabel(r.module)}"`,
      `"${r.assessmentSeriesName}"`,
      `"${r.year}"`,
      r.units.length,
      r.totalAmount,
      `"${r.status}"`,
      `"${r.hodApproval?.hodName || ''}"`,
      `"${r.hodApproval?.approvalRef || ''}"`,
      `"${r.hodApproval?.approvedAt ? new Date(r.hodApproval.approvedAt).toLocaleDateString() : ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Registrations_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportDetailedUnitsCSV = () => {
    const headers = [
      'Registration Ref',
      'Admission Number',
      'Trainee Name',
      'Course Code',
      'Course Name',
      'Level',
      'Module / Cycle',
      'Assessment Series',
      'Unit Code',
      'Unit Title',
      'Unit Category',
      'Attempt Type',
      'Unit Fee (KES)',
      'Assigned Trainer',
      'Unit Status',
      'Trainer Decision Remarks',
      'Verified Date',
      'HOD Status',
      'HOD Approval Ref',
    ];

    const rows: string[][] = [];
    filtered.forEach((r) => {
      r.units.forEach((u) => {
        rows.push([
          `"${r.registrationReference}"`,
          `"${r.admissionNumber}"`,
          `"${r.studentName.replace(/"/g, '""')}"`,
          `"${r.courseCode}"`,
          `"${r.courseName.replace(/"/g, '""')}"`,
          `"${r.levelName}"`,
          `"${formatModuleLabel(r.module)}"`,
          `"${r.assessmentSeriesName}"`,
          `"${u.unitCode}"`,
          `"${u.unitName.replace(/"/g, '""')}"`,
          `"${u.category}"`,
          `"${u.isReassessment || u.attemptType === 'REASSESSMENT' ? 'REASSESSMENT' : 'REGULAR'}"`,
          String(u.amountCharged || 0),
          `"${u.trainerName || ''}"`,
          `"${u.status}"`,
          `"${(u.decisionComment || '').replace(/"/g, '""')}"`,
          `"${u.verifiedAt ? new Date(u.verifiedAt).toLocaleDateString() : ''}"`,
          `"${r.status}"`,
          `"${r.hodApproval?.approvalRef || ''}"`,
        ]);
      });
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Candidate_Unit_Level_Master_Roll_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportRollPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Institutional Header
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(config.institutionName || 'THE SHAMBERERE NATIONAL POLYTECHNIC', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`${config.departmentName || 'Department of Computing & Informatics'} | Office of Examinations & Assessment Docketing`, pageWidth / 2, 19, { align: 'center' });

    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.75);
    doc.line(14, 23, pageWidth - 14, 23);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('CENTRAL EXAMINATION TSNP/CDACC CANDIDATE ASSESSMENT ROLL & CLEARANCES', 14, 29);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleString()} | Cleared Candidates: ${filtered.length}`, pageWidth - 14, 29, { align: 'right' });

    const tableHeaders = [
      '#',
      'Ref Number',
      'Adm Number',
      'Candidate Full Name',
      'Course',
      'Stage',
      'Assessment Series',
      'Units',
      'Total Fee',
      'Status',
      'HOD Approval Ref',
    ];

    const tableRows = filtered.map((r, idx) => [
      String(idx + 1),
      r.registrationReference,
      r.admissionNumber,
      r.studentName,
      r.courseCode,
      `${r.levelName} (${formatModuleShort(r.module)})`,
      r.assessmentSeriesName,
      String(r.units.length),
      `KES ${r.totalAmount.toLocaleString()}`,
      r.status,
      r.hodApproval?.approvalRef || '-',
    ]);

    autoTable(doc, {
      startY: 33,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 24, fontStyle: 'bold' },
        3: { cellWidth: 45 },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 28 },
        6: { cellWidth: 38 },
        7: { cellWidth: 12, halign: 'center' },
        8: { cellWidth: 22, halign: 'right' },
        9: { cellWidth: 26, halign: 'center' },
        10: { cellWidth: 20, halign: 'center' },
      },
      didDrawPage: (data) => {
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Official TSNP/CDACC Examinations Roll - ${config.institutionName}`,
          14,
          doc.internal.pageSize.getHeight() - 6
        );
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth - 14,
          doc.internal.pageSize.getHeight() - 6,
          { align: 'right' }
        );
      },
    });

    doc.save(`TSNP_CDACC_Exams_Candidate_Roll_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  return (
    <div className="space-y-5 sm:space-y-6 font-sans w-full max-w-full">
      {/* Officer Header */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xl shadow-md shrink-0 border border-blue-500/20">
            <Inbox className="w-6 h-6 sm:w-7 sm:h-7" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold text-white tracking-tight">{user.name}</h1>
              <span className="bg-blue-500/10 text-blue-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-blue-500/30">
                Examinations Office Docket
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Central Assessment Repository • Institutional Clearance Verification
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md transition"
            title="Export summary CSV of candidates"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Summary (CSV)
          </button>
          <button
            onClick={handleExportDetailedUnitsCSV}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold border border-slate-700 shadow-md transition"
            title="Export candidate unit-by-unit master breakdown CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" /> Unit Breakdown (CSV)
          </button>
          <button
            onClick={handleExportRollPDF}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold shadow-lg transition"
            title="Download official candidate roll PDF"
          >
            <FileDown className="w-3.5 h-3.5" /> Examination Roll (PDF)
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Departmentally Approved Registrations</div>
          <div className="text-2xl font-extrabold text-emerald-400 mt-1 font-mono">{approvedRegistrations.length}</div>
          <div className="text-[11px] text-slate-400 mt-0.5">Cleared by Head of Department</div>
        </div>

        <div className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Received & Docketed by Exams</div>
          <div className="text-2xl font-extrabold text-blue-400 mt-1 font-mono">
            {registrations.filter((r) => r.status === 'RECEIVED_BY_EXAMINATIONS').length}
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Batch indexation confirmed</div>
        </div>

        <div className="p-4 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl">
          <div className="text-xs font-bold text-slate-400 uppercase">Total CDACC/TSNP Units Cleared</div>
          <div className="text-2xl font-extrabold text-white mt-1 font-mono">
            {approvedRegistrations.reduce((acc, r) => acc + r.units.length, 0)} Units
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">Ready for national assessment</div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 shadow-xl overflow-hidden">
        {/* Controls */}
        <div className="p-3.5 sm:p-5 bg-slate-950 border-b border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSeries}
              onChange={(e) => setSelectedSeries(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-slate-200 rounded-xl px-3 py-1.5 font-medium focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Assessment Series</option>
              {assessmentSeriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 overflow-x-auto">
              {(['ALL', 'APPROVED', 'RECEIVED'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1 rounded-lg font-semibold transition whitespace-nowrap ${
                    statusFilter === st
                      ? 'bg-emerald-600 text-slate-950 shadow-xs'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {st === 'ALL' ? 'All' : st === 'APPROVED' ? 'Approved by HOD' : 'Docketed'}
                </button>
              ))}
            </div>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search candidate name or admission..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto min-w-0">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              <Inbox className="w-10 h-10 mx-auto mb-2 text-slate-600" />
              No examination registration records found.
            </div>
          ) : (
            <table className="w-full divide-y divide-slate-800 text-xs min-w-[800px]">
              <thead className="bg-slate-950 text-slate-300 font-semibold text-[11px]">
                <tr>
                  <th className="px-4 py-3 text-left">Registration Ref & Date</th>
                  <th className="px-4 py-3 text-left">Candidate Name & Adm</th>
                  <th className="px-4 py-3 text-left">Course & Level</th>
                  <th className="px-4 py-3 text-center">CDACC/TSNP Units</th>
                  <th className="px-4 py-3 text-left">HOD Clearance Details</th>
                  <th className="px-4 py-3 text-center">Docket Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40 text-slate-200">
                {filtered.map((reg) => {
                  const isReceived = reg.status === 'RECEIVED_BY_EXAMINATIONS';
                  const isApproved = reg.status === 'APPROVED' || isReceived;

                  return (
                    <tr key={reg.id} className="hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-emerald-400">{reg.registrationReference}</div>
                        <div className="text-[11px] text-slate-300">{reg.assessmentSeriesName}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-bold text-white">{reg.studentName}</div>
                        <div className="font-mono text-slate-400 text-[11px]">{reg.admissionNumber}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-200">
                          {reg.courseCode}{' '}
                          <span className="text-emerald-400 font-mono text-[11px]">({formatModuleShort(reg.module)})</span>
                        </div>
                        <div className="text-[11px] text-emerald-400 font-semibold">{reg.levelName}</div>
                      </td>

                      <td className="px-4 py-3 text-center font-mono font-bold text-white">
                        {reg.units.length} Units
                        <div className="text-[10px] text-slate-400 font-normal">
                          {config.defaultCurrency} {reg.totalAmount.toLocaleString()}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        {reg.hodApproval ? (
                          <div>
                            <div className="font-semibold text-emerald-300">{reg.hodApproval.hodName}</div>
                            <div className="font-mono text-[10px] text-emerald-400">
                              Ref: {reg.hodApproval.approvalRef}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-500 italic text-[11px]">Pending HOD clearance</span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-center">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-300 border border-blue-500/30">
                            <CheckCircle2 className="w-3 h-3" /> DOCKETED
                          </span>
                        ) : isApproved ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3" /> APPROVED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700">
                            {reg.status}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isApproved && !isReceived && (
                            <button
                              onClick={() => handleMarkReceived(reg)}
                              disabled={processingId === reg.id}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-xs transition"
                            >
                              Mark Received
                            </button>
                          )}
                          <button
                            onClick={() => setSelectedPrintReg(reg)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Print Form"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setSelectedAuditReg(reg)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Audit Trail"
                          >
                            <FileCheck2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onOpenVerificationPortal(reg.registrationReference)}
                            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800 rounded-lg transition"
                            title="QR Verification"
                          >
                            <QrCode className="w-4 h-4" />
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
