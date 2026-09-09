import React, { useState, useMemo } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Unit,
  Trainer,
  Course,
  Level,
  Student,
  AssessmentSeries,
  Registration,
  InstitutionConfig,
  UnitCategoryItem,
  formatModuleLabel,
  formatModuleShort,
} from '../../types';
import {
  FileText,
  FileSpreadsheet,
  Download,
  Printer,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  BookOpen,
  GraduationCap,
  Users,
  Layers,
  Sparkles,
  ShieldCheck,
  Building,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Eye,
  CreditCard,
  DollarSign,
  AlertCircle,
  FileDown,
} from 'lucide-react';

interface ReportsSectionProps {
  units: Unit[];
  trainers: Trainer[];
  courses: Course[];
  levels: Level[];
  students: Student[];
  assessmentSeriesList: AssessmentSeries[];
  registrations: Registration[];
  config: InstitutionConfig;
  unitCategories?: UnitCategoryItem[];
}

type ReportType = 'UNITS' | 'REGISTRATIONS' | 'TRAINERS' | 'FINANCIAL' | 'STUDENTS';

export const ReportsSection: React.FC<ReportsSectionProps> = ({
  units,
  trainers,
  courses,
  levels,
  students,
  assessmentSeriesList,
  registrations,
  config,
  unitCategories = [],
}) => {
  const [selectedReport, setSelectedReport] = useState<ReportType>('UNITS');
  const [feedbackToast, setFeedbackToast] = useState<string | null>(null);
  const [expandedRegId, setExpandedRegId] = useState<string | null>(null);

  // --- Units Report Filter States ---
  const [unitSearch, setUnitSearch] = useState('');
  const [unitCategoryFilter, setUnitCategoryFilter] = useState('ALL');
  const [unitCourseFilter, setUnitCourseFilter] = useState('ALL');
  const [unitLevelFilter, setUnitLevelFilter] = useState('ALL');
  const [unitStatusFilter, setUnitStatusFilter] = useState('ALL');

  // --- Registrations Report Filter States ---
  const [regSearch, setRegSearch] = useState('');
  const [regSeriesFilter, setRegSeriesFilter] = useState<string>('ALL');
  const [regStatusFilter, setRegStatusFilter] = useState<string>('ALL');
  const [regCourseFilter, setRegCourseFilter] = useState<string>('ALL');

  // --- Trainer Allocation Filter States ---
  const [trainerSearch, setTrainerSearch] = useState('');
  const [trainerDeptFilter, setTrainerDeptFilter] = useState('ALL');

  // Helper maps for quick lookups
  const courseMap = useMemo(() => new Map(courses.map((c) => [c.id, c])), [courses]);
  const levelMap = useMemo(() => new Map(levels.map((l) => [l.id, l])), [levels]);
  const trainerMap = useMemo(() => new Map(trainers.map((t) => [t.id, t])), [trainers]);
  const seriesMap = useMemo(() => new Map(assessmentSeriesList.map((s) => [s.id, s])), [assessmentSeriesList]);

  const showToast = (msg: string) => {
    setFeedbackToast(msg);
    setTimeout(() => setFeedbackToast(null), 4500);
  };

  // ==========================================
  // 1. FILTERED DATASETS
  // ==========================================

  // Filtered Units Dataset
  const filteredUnits = useMemo(() => {
    return units.filter((unit) => {
      const q = unitSearch.toLowerCase().trim();
      const course = courseMap.get(unit.courseId);
      const level = levelMap.get(unit.levelId);
      const trainer = trainerMap.get(unit.defaultTrainerId);

      const matchesSearch =
        !q ||
        unit.unitCode.toLowerCase().includes(q) ||
        unit.unitName.toLowerCase().includes(q) ||
        (unit.description && unit.description.toLowerCase().includes(q)) ||
        (course && course.name.toLowerCase().includes(q)) ||
        (course && course.code.toLowerCase().includes(q)) ||
        (trainer && trainer.name.toLowerCase().includes(q));

      const matchesCategory = unitCategoryFilter === 'ALL' || unit.category === unitCategoryFilter;
      const matchesCourse = unitCourseFilter === 'ALL' || unit.courseId === unitCourseFilter;
      const matchesLevel = unitLevelFilter === 'ALL' || unit.levelId === unitLevelFilter;
      const matchesStatus = unitStatusFilter === 'ALL' || unit.status === unitStatusFilter;

      return matchesSearch && matchesCategory && matchesCourse && matchesLevel && matchesStatus;
    });
  }, [units, unitSearch, unitCategoryFilter, unitCourseFilter, unitLevelFilter, unitStatusFilter, courseMap, levelMap, trainerMap]);

  // Filtered Registrations Dataset
  const filteredRegistrations = useMemo(() => {
    return registrations.filter((reg) => {
      const q = regSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        reg.studentName.toLowerCase().includes(q) ||
        reg.admissionNumber.toLowerCase().includes(q) ||
        reg.registrationReference.toLowerCase().includes(q) ||
        reg.courseName.toLowerCase().includes(q) ||
        reg.units.some((u) => u.unitCode.toLowerCase().includes(q) || u.unitName.toLowerCase().includes(q));

      const matchesSeries = regSeriesFilter === 'ALL' || reg.assessmentSeriesId === regSeriesFilter;
      const matchesStatus =
        regStatusFilter === 'ALL'
          ? true
          : regStatusFilter === 'APPROVED'
          ? reg.status === 'APPROVED' || reg.status === 'RECEIVED_BY_EXAMINATIONS'
          : regStatusFilter === 'PENDING'
          ? reg.status === 'SUBMITTED' || reg.status === 'PARTIALLY_VERIFIED' || reg.status === 'AWAITING_HOD_APPROVAL'
          : reg.status === regStatusFilter;

      const matchesCourse = regCourseFilter === 'ALL' || reg.courseId === regCourseFilter;

      return matchesSearch && matchesSeries && matchesStatus && matchesCourse;
    });
  }, [registrations, regSearch, regSeriesFilter, regStatusFilter, regCourseFilter]);

  // Filtered Trainers Dataset
  const filteredTrainers = useMemo(() => {
    return trainers.filter((t) => {
      const q = trainerSearch.toLowerCase().trim();
      const matchesSearch =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.staffNumber.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.specialization.toLowerCase().includes(q);

      const matchesDept = trainerDeptFilter === 'ALL' || t.departmentId === trainerDeptFilter;
      return matchesSearch && matchesDept;
    });
  }, [trainers, trainerSearch, trainerDeptFilter]);

  // ==========================================
  // 2. STATISTICAL SUMMARIES
  // ==========================================

  // Units Metrics
  const unitStats = useMemo(() => {
    const total = filteredUnits.length;
    const coreCount = filteredUnits.filter((u) => u.category === 'Core').length;
    const commonCount = filteredUnits.filter((u) => u.category === 'Common').length;
    const basicCount = filteredUnits.filter((u) => u.category === 'Basic').length;
    const otherCount = total - (coreCount + commonCount + basicCount);
    const assignedCount = filteredUnits.filter((u) => !!u.defaultTrainerId).length;
    const totalFees = filteredUnits.reduce((acc, u) => acc + (u.amountCharged || 0), 0);

    return { total, coreCount, commonCount, basicCount, otherCount, assignedCount, totalFees };
  }, [filteredUnits]);

  // Registration Metrics
  const regStats = useMemo(() => {
    const totalRegs = filteredRegistrations.length;
    const totalUnits = filteredRegistrations.reduce((acc, r) => acc + r.units.length, 0);
    const totalFees = filteredRegistrations.reduce((acc, r) => acc + (r.totalAmount || 0), 0);
    const approvedCount = filteredRegistrations.filter(
      (r) => r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS'
    ).length;
    const pendingCount = filteredRegistrations.filter(
      (r) => r.status === 'SUBMITTED' || r.status === 'PARTIALLY_VERIFIED' || r.status === 'AWAITING_HOD_APPROVAL'
    ).length;
    const examsReceivedCount = filteredRegistrations.filter((r) => r.status === 'RECEIVED_BY_EXAMINATIONS').length;

    return { totalRegs, totalUnits, totalFees, approvedCount, pendingCount, examsReceivedCount };
  }, [filteredRegistrations]);

  // Financial Breakdown by Category
  const financialStats = useMemo(() => {
    let coreRevenue = 0;
    let commonRevenue = 0;
    let basicRevenue = 0;
    let reassessmentRevenue = 0;
    let totalAssessedUnits = 0;

    filteredRegistrations.forEach((r) => {
      r.units.forEach((u) => {
        totalAssessedUnits++;
        const amt = u.amountCharged || 0;
        if (u.isReassessment || u.attemptType === 'REASSESSMENT') {
          reassessmentRevenue += amt;
        } else if (u.category === 'Core') {
          coreRevenue += amt;
        } else if (u.category === 'Common') {
          commonRevenue += amt;
        } else if (u.category === 'Basic') {
          basicRevenue += amt;
        } else {
          coreRevenue += amt;
        }
      });
    });

    const grandTotal = coreRevenue + commonRevenue + basicRevenue + reassessmentRevenue;
    return { coreRevenue, commonRevenue, basicRevenue, reassessmentRevenue, totalAssessedUnits, grandTotal };
  }, [filteredRegistrations]);

  // ==========================================
  // 3. CSV EXPORTERS
  // ==========================================

  // Export 1: All Units Captured CSV
  const handleExportUnitsCSV = () => {
    const headers = [
      'Unit Code',
      'Unit Title',
      'Category',
      'Course Code',
      'Course Name',
      'Qualification Level',
      'Amount Charged (KES)',
      'Assigned Trainer Name',
      'Trainer Staff Number',
      'Status',
      'Description / Syllabus Competency',
    ];

    const rows = filteredUnits.map((u) => {
      const course = courseMap.get(u.courseId);
      const level = levelMap.get(u.levelId);
      const trainer = trainerMap.get(u.defaultTrainerId);

      return [
        `"${u.unitCode}"`,
        `"${u.unitName.replace(/"/g, '""')}"`,
        `"${u.category}"`,
        `"${course?.code || ''}"`,
        `"${course?.name || ''}"`,
        `"${level?.code || level?.name || ''}"`,
        u.amountCharged || 0,
        `"${trainer?.name || 'Unassigned'}"`,
        `"${trainer?.staffNumber || ''}"`,
        `"${u.status}"`,
        `"${(u.description || '').replace(/"/g, '""')}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Units_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded CSV report containing ${filteredUnits.length} syllabus competency units.`);
  };

  // Export 2: Registered Trainees Summary CSV
  const handleExportRegistrationsCSV = () => {
    const headers = [
      'Registration Ref',
      'Admission Number',
      'Trainee Name',
      'Course Code',
      'Course Name',
      'Qualification Level',
      'Module / Cycle',
      'Assessment Series',
      'Academic Year',
      'Total Registered Units',
      'Total Amount (KES)',
      'Registration Status',
      'Submitted Date',
      'HOD Approved By',
      'HOD Approval Ref',
      'HOD Approved Date',
      'Exams Office Receipt Date',
      'Exams Office Batch Ref',
    ];

    const rows = filteredRegistrations.map((r) => [
      `"${r.registrationReference}"`,
      `"${r.admissionNumber}"`,
      `"${r.studentName.replace(/"/g, '""')}"`,
      `"${r.courseCode}"`,
      `"${r.courseName.replace(/"/g, '""')}"`,
      `"${r.levelName}"`,
      `"${formatModuleLabel(r.module)}"`,
      `"${r.assessmentSeriesName}"`,
      `"${r.year}"`,
      r.units.length,
      r.totalAmount,
      `"${r.status}"`,
      `"${r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : ''}"`,
      `"${r.hodApproval?.hodName || ''}"`,
      `"${r.hodApproval?.approvalRef || ''}"`,
      `"${r.hodApproval?.approvedAt ? new Date(r.hodApproval.approvedAt).toLocaleDateString() : ''}"`,
      `"${r.examOfficeReceipt?.receivedAt ? new Date(r.examOfficeReceipt.receivedAt).toLocaleDateString() : ''}"`,
      `"${r.examOfficeReceipt?.referenceBatch || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Trainee_Registrations_Summary_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded CSV summary register for ${filteredRegistrations.length} registered trainees.`);
  };

  // Export 2B: Detailed Candidate Unit-Level Breakdown CSV
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
      'Trainer Verification Status',
      'Trainer Decision Remark',
      'Verified At',
      'HOD Approval Status',
      'HOD Approval Ref',
    ];

    const rows: string[][] = [];
    filteredRegistrations.forEach((r) => {
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

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Trainees_Unit_Level_Master_Roll_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded unit-level breakdown containing ${rows.length} candidate-unit assessment lines.`);
  };

  // Export 3: Trainer Allocation Matrix CSV
  const handleExportTrainersCSV = () => {
    const headers = [
      'Staff Number',
      'Trainer Full Name',
      'Email Address',
      'Phone Number',
      'Specialization',
      'Total Assigned Units',
      'Assigned Unit Codes',
      'Registered Candidates Queue',
    ];

    const rows = filteredTrainers.map((t) => {
      const assignedUnits = units.filter((u) => u.defaultTrainerId === t.id);
      const unitCodes = assignedUnits.map((u) => u.unitCode).join('; ');
      const candidateQueue = registrations.filter((r) => r.units.some((u) => u.trainerId === t.id)).length;

      return [
        `"${t.staffNumber}"`,
        `"${t.name.replace(/"/g, '""')}"`,
        `"${t.email}"`,
        `"${t.phone}"`,
        `"${t.specialization}"`,
        assignedUnits.length,
        `"${unitCodes}"`,
        candidateQueue,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `TSNP_CDACC_Trainers_Routing_Allocation_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast(`Downloaded trainer allocations report for ${filteredTrainers.length} academic staff.`);
  };

  // ==========================================
  // 4. VECTOR PDF INSTITUTIONAL REPORTS
  // ==========================================

  // PDF Generator 1: Official CDACC Units Syllabus Catalog
  const handleExportUnitsPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(config.institutionName || 'THE SHAMBERERE NATIONAL POLYTECHNIC', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`${config.departmentName || 'Department of Computing & Informatics'} | ${config.postalAddress || 'P.O. BOX 1316-50100, Kakamega'}`, pageWidth / 2, 19, { align: 'center' });
    doc.text(`Email: ${config.email || 'info@shamberere.ac.ke'} | Website: ${config.website || 'https://shambererepolytechnic.ac.ke'}`, pageWidth / 2, 23, { align: 'center' });

    // Rule separator
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.75);
    doc.line(14, 26, pageWidth - 14, 26);

    // Title banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('OFFICIAL TSNP/CDACC CURRICULUM UNITS & ASSESSMENT FEE SCHEDULE', 14, 32);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated on: ${new Date().toLocaleString()} | Total Units: ${filteredUnits.length} | Form Ref: ${config.formReference || 'TSNP/CI/URF/006'}`, pageWidth - 14, 32, { align: 'right' });

    // Summary Metric Badges in PDF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const summaryText = `Core Units: ${unitStats.coreCount} (KES 2,500) | Common Units: ${unitStats.commonCount} (KES 1,800) | Basic Units: ${unitStats.basicCount} (KES 1,200) | Cumulative Syllabus Value: KES ${unitStats.totalFees.toLocaleString()}`;
    doc.text(summaryText, 14, 37);

    // Table Data
    const tableHeaders = ['#', 'Unit Code', 'Unit Competency Title', 'Category', 'Course', 'Level', 'Fee (KES)', 'Assigned Subject Trainer', 'Status'];
    const tableRows = filteredUnits.map((u, idx) => {
      const course = courseMap.get(u.courseId);
      const level = levelMap.get(u.levelId);
      const trainer = trainerMap.get(u.defaultTrainerId);

      return [
        String(idx + 1),
        u.unitCode,
        u.unitName,
        u.category,
        course?.code || '-',
        level?.code || level?.name || '-',
        (u.amountCharged || 0).toLocaleString(),
        trainer ? `${trainer.name} (${trainer.staffNumber})` : 'Unassigned',
        u.status,
      ];
    });

    autoTable(doc, {
      startY: 40,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
      },
      bodyStyles: {
        fontSize: 7,
        textColor: [30, 41, 59],
      },
      columnStyles: {
        0: { cellWidth: 8, halign: 'center' },
        1: { cellWidth: 42, fontStyle: 'bold' },
        2: { cellWidth: 70 },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 18, halign: 'center' },
        5: { cellWidth: 20, halign: 'center' },
        6: { cellWidth: 20, halign: 'right' },
        7: { cellWidth: 45 },
        8: { cellWidth: 18, halign: 'center' },
      },
      didDrawPage: (data) => {
        // Footer on each page
        doc.setFontSize(7);
        doc.setTextColor(120, 120, 120);
        doc.text(
          `Official Document of ${config.institutionName} - TSNP/CDACC Competency Assessment Unit Registry`,
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

    doc.save(`TSNP_CDACC_Curriculum_Units_Catalog_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Downloaded official PDF syllabus catalog.');
  };

  // PDF Generator 2: Official Registered Trainees Examination Docket
  const handleExportRegistrationsPDF = () => {
    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();

    // 1. Header
    doc.setFont('times', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text(config.institutionName || 'THE SHAMBERERE NATIONAL POLYTECHNIC', pageWidth / 2, 14, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text(`${config.departmentName || 'Department of Computing & Informatics'} | Office of Examinations & Assessment Clearances`, pageWidth / 2, 19, { align: 'center' });

    // Rule separator
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.75);
    doc.line(14, 23, pageWidth - 14, 23);

    // Title banner
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text('OFFICIAL REGISTER OF REGISTERED TRAINEES FOR TSNP/CDACC ASSESSMENTS', 14, 29);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(`Generated: ${new Date().toLocaleString()} | Registered Candidates: ${filteredRegistrations.length} | Units: ${regStats.totalUnits}`, pageWidth - 14, 29, { align: 'right' });

    // Summary Metric Badges in PDF
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    const summaryText = `Total Trainees: ${regStats.totalRegs} | Total Assessment Units: ${regStats.totalUnits} | Total Assessed Fees: KES ${regStats.totalFees.toLocaleString()} | Fully Approved: ${regStats.approvedCount} | Pending: ${regStats.pendingCount}`;
    doc.text(summaryText, 14, 34);

    // Table Data
    const tableHeaders = [
      '#',
      'Ref Number',
      'Adm Number',
      'Candidate Full Name',
      'Course',
      'Level & Stage',
      'Assessment Series',
      'Units',
      'Total Fee',
      'Status',
      'HOD Approval Ref',
    ];

    const tableRows = filteredRegistrations.map((r, idx) => [
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
      r.hodApproval?.approvalRef || (r.status === 'APPROVED' ? 'Approved' : 'Pending'),
    ]);

    autoTable(doc, {
      startY: 37,
      head: [tableHeaders],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: [15, 23, 42],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold',
        halign: 'left',
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
          `Official TSNP/CDACC Candidate Assessment Register - Verified by ${config.hodDesignation || 'HOD Computing & Informatics'} & Examinations Officer`,
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

    doc.save(`TSNP_CDACC_Registered_Trainees_Docket_${new Date().toISOString().slice(0, 10)}.pdf`);
    showToast('Downloaded official candidate examination roll PDF.');
  };

  // Direct Browser Print Trigger
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {feedbackToast && (
        <div className="p-3.5 bg-emerald-950/90 border border-emerald-700/80 rounded-2xl text-emerald-300 flex items-center justify-between gap-3 text-xs font-semibold shadow-xl animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{feedbackToast}</span>
          </div>
          <span className="text-[10px] text-emerald-400/80 uppercase tracking-widest font-mono">READY</span>
        </div>
      )}

      {/* Reports Header & Report Type Navigation Grid */}
      <div className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Official Institutional Reports & Export Center</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generate, preview, and download comprehensive TSNP/CDACC assessment registers, syllabus catalogs, trainee dockets, and financial audits.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDirectPrint}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
              title="Print Current Report View"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-400" /> Print Page
            </button>
            {selectedReport === 'UNITS' && (
              <>
                <button
                  onClick={handleExportUnitsCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Export Units (CSV)
                </button>
                <button
                  onClick={handleExportUnitsPDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-700/60 font-bold rounded-xl text-xs transition"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Download PDF
                </button>
              </>
            )}
            {selectedReport === 'REGISTRATIONS' && (
              <>
                <button
                  onClick={handleExportRegistrationsCSV}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Trainees Summary (CSV)
                </button>
                <button
                  onClick={handleExportDetailedUnitsCSV}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold rounded-xl text-xs transition"
                  title="Unit-by-unit master breakdown for every candidate"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Unit Breakdown (CSV)
                </button>
                <button
                  onClick={handleExportRegistrationsPDF}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-700/60 font-bold rounded-xl text-xs transition"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-400" /> Candidate Roll PDF
                </button>
              </>
            )}
            {selectedReport === 'TRAINERS' && (
              <button
                onClick={handleExportTrainersCSV}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" /> Export Trainers (CSV)
              </button>
            )}
          </div>
        </div>

        {/* Report Category Selection Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <button
            onClick={() => setSelectedReport('UNITS')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedReport === 'UNITS'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">1. TSNP/CDACC Units Catalog</span>
              <BookOpen className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">All captured units, categories, fees & routing ({units.length})</p>
          </button>

          <button
            onClick={() => setSelectedReport('REGISTRATIONS')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedReport === 'REGISTRATIONS'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">2. Registered Trainees</span>
              <GraduationCap className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Candidate lists, modules, units & clearance ({registrations.length})</p>
          </button>

          <button
            onClick={() => setSelectedReport('TRAINERS')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedReport === 'TRAINERS'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">3. Trainer Allocations</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Staff unit assignments & workload routing ({trainers.length})</p>
          </button>

          <button
            onClick={() => setSelectedReport('FINANCIAL')}
            className={`p-3 rounded-xl border text-left transition ${
              selectedReport === 'FINANCIAL'
                ? 'bg-emerald-500/10 border-emerald-500/50 text-white ring-1 ring-emerald-500/30'
                : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs">4. Fee & Revenue Audit</span>
              <CreditCard className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Revenue by category, course & reassessments</p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* REPORT 1: ALL UNITS CAPTURED                                             */}
      {/* ========================================================================= */}
      {selectedReport === 'UNITS' && (
        <div className="space-y-4">
          {/* Statistical Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Total Units</div>
              <div className="text-xl font-bold text-white mt-0.5">{unitStats.total}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">Captured in catalog</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Core Competencies</div>
              <div className="text-xl font-bold text-blue-400 mt-0.5">{unitStats.coreCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">@ KES 2,500 / unit</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Common Units</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{unitStats.commonCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">@ KES 1,800 / unit</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Basic Units</div>
              <div className="text-xl font-bold text-purple-400 mt-0.5">{unitStats.basicCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">@ KES 1,200 / unit</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Trainer Assigned</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{unitStats.assignedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">{Math.round((unitStats.assignedCount / (unitStats.total || 1)) * 100)}% coverage</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Catalog Total Value</div>
              <div className="text-base font-bold text-emerald-400 mt-1">KES {unitStats.totalFees.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Standard unit fee sum</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search unit code, competency title, course, trainer..."
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={unitCategoryFilter}
                onChange={(e) => setUnitCategoryFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Categories</option>
                <option value="Core">Core Competencies</option>
                <option value="Common">Common Units</option>
                <option value="Basic">Basic Units</option>
              </select>

              <select
                value={unitCourseFilter}
                onChange={(e) => setUnitCourseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>

              <select
                value={unitLevelFilter}
                onChange={(e) => setUnitLevelFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Levels</option>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Units Table Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                Syllabus Unit Competency Roll <span className="text-emerald-400">({filteredUnits.length} units listed)</span>
              </span>
              <span className="text-slate-500 text-[11px]">Formatted for TSNP/CDACC Assessment Schedule</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="py-3 px-3 w-12 text-center">#</th>
                    <th className="py-3 px-3">Unit Code</th>
                    <th className="py-3 px-3">Competency Title</th>
                    <th className="py-3 px-3">Category</th>
                    <th className="py-3 px-3">Course & Level</th>
                    <th className="py-3 px-3 text-right">Fee (KES)</th>
                    <th className="py-3 px-3">Assigned Trainer</th>
                    <th className="py-3 px-3 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        No units matched your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUnits.map((u, idx) => {
                      const course = courseMap.get(u.courseId);
                      const level = levelMap.get(u.levelId);
                      const trainer = trainerMap.get(u.defaultTrainerId);

                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                          <td className="py-3 px-3 font-mono font-bold text-emerald-400">{u.unitCode}</td>
                          <td className="py-3 px-3 font-medium text-white max-w-xs">
                            <div>{u.unitName}</div>
                            {u.description && <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{u.description}</div>}
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.category === 'Core'
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : u.category === 'Common'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                              }`}
                            >
                              {u.category}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-200">{course?.code || 'All Courses'}</div>
                            <div className="text-[10px] text-slate-400">{level?.code || level?.name || 'All Levels'}</div>
                          </td>
                          <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                            KES {(u.amountCharged || 0).toLocaleString()}
                          </td>
                          <td className="py-3 px-3">
                            {trainer ? (
                              <div>
                                <div className="font-semibold text-slate-200">{trainer.name}</div>
                                <div className="text-[10px] text-slate-500 font-mono">{trainer.staffNumber}</div>
                              </div>
                            ) : (
                              <span className="text-amber-400/80 text-[11px] italic font-medium">Unassigned</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {u.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 2: REGISTERED TRAINEES                                            */}
      {/* ========================================================================= */}
      {selectedReport === 'REGISTRATIONS' && (
        <div className="space-y-4">
          {/* Statistical Metric Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Registered Trainees</div>
              <div className="text-xl font-bold text-white mt-0.5">{regStats.totalRegs}</div>
              <div className="text-[10px] text-emerald-400 mt-0.5 font-medium">In current filter</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Total Assessed Units</div>
              <div className="text-xl font-bold text-blue-400 mt-0.5">{regStats.totalUnits}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Unit bookings</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Total Assessed Fees</div>
              <div className="text-base font-bold text-emerald-400 mt-1">KES {regStats.totalFees.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Candidate billings</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Fully Approved</div>
              <div className="text-xl font-bold text-emerald-400 mt-0.5">{regStats.approvedCount}</div>
              <div className="text-[10px] text-emerald-400/80 mt-0.5 font-medium">Cleared by HOD</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Pending Verification</div>
              <div className="text-xl font-bold text-amber-400 mt-0.5">{regStats.pendingCount}</div>
              <div className="text-[10px] text-amber-400/80 mt-0.5 font-medium">In verification workflow</div>
            </div>

            <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-[11px] text-slate-400 font-semibold">Exams Received</div>
              <div className="text-xl font-bold text-purple-400 mt-0.5">{regStats.examsReceivedCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Indexed in exam roll</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search candidate name, admission no, ref, or unit..."
                value={regSearch}
                onChange={(e) => setRegSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={regSeriesFilter}
                onChange={(e) => setRegSeriesFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Assessment Series</option>
                {assessmentSeriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.year}) {s.status === 'ACTIVE' ? '★ ACTIVE' : ''}
                  </option>
                ))}
              </select>

              <select
                value={regStatusFilter}
                onChange={(e) => setRegStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Clearance Statuses</option>
                <option value="APPROVED">Cleared / Approved (HOD/Exams)</option>
                <option value="PENDING">Pending In-Progress</option>
                <option value="SUBMITTED">Submitted (Awaiting Trainers)</option>
                <option value="AWAITING_HOD_APPROVAL">Awaiting HOD Sign-off</option>
                <option value="RECEIVED_BY_EXAMINATIONS">Received by Exams Office</option>
                <option value="RETURNED">Returned / Re-submission</option>
              </select>

              <select
                value={regCourseFilter}
                onChange={(e) => setRegCourseFilter(e.target.value)}
                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
              >
                <option value="ALL">All Courses</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Registrations Table Preview */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="p-3.5 bg-slate-950/60 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300">
                Official Candidate Examination Roll & Unit Clearances <span className="text-emerald-400">({filteredRegistrations.length} trainees)</span>
              </span>
              <span className="text-slate-500 text-[11px]">Click any trainee to expand full unit breakdown</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">Reg Ref</th>
                    <th className="py-3 px-3">Adm Number</th>
                    <th className="py-3 px-3">Trainee Full Name</th>
                    <th className="py-3 px-3">Course & Stage</th>
                    <th className="py-3 px-3">Assessment Series</th>
                    <th className="py-3 px-3 text-center">Units</th>
                    <th className="py-3 px-3 text-right">Fee (KES)</th>
                    <th className="py-3 px-3 text-center">Status</th>
                    <th className="py-3 px-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredRegistrations.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="py-12 text-center text-slate-500">
                        No candidate registrations found matching your query.
                      </td>
                    </tr>
                  ) : (
                    filteredRegistrations.map((r, idx) => {
                      const isExpanded = expandedRegId === r.id;

                      return (
                        <React.Fragment key={r.id}>
                          <tr
                            className={`hover:bg-slate-800/40 transition cursor-pointer ${isExpanded ? 'bg-slate-800/50' : ''}`}
                            onClick={() => setExpandedRegId(isExpanded ? null : r.id)}
                          >
                            <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-3 px-3 font-mono font-bold text-emerald-400">{r.registrationReference}</td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-200">{r.admissionNumber}</td>
                            <td className="py-3 px-3 font-semibold text-white">
                              <div>{r.studentName}</div>
                              <div className="text-[10px] text-slate-400 font-normal">
                                Sub: {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString() : '-'}
                              </div>
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-slate-200">{r.courseCode}</div>
                              <div className="text-[10px] text-slate-400">
                                {r.levelName} • <span className="text-emerald-400 font-medium">{formatModuleShort(r.module)}</span>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-slate-300">
                              <div className="font-medium text-xs">{r.assessmentSeriesName}</div>
                              <div className="text-[10px] text-slate-500 font-mono">{r.year}</div>
                            </td>
                            <td className="py-3 px-3 text-center font-bold text-white">
                              <span className="px-2 py-0.5 bg-slate-800 rounded-full border border-slate-700 text-xs">
                                {r.units.length}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                              KES {r.totalAmount.toLocaleString()}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                  r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                    : r.status === 'AWAITING_HOD_APPROVAL'
                                    ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                                    : r.status === 'PARTIALLY_VERIFIED'
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                }`}
                              >
                                {r.status}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-center">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setExpandedRegId(isExpanded ? null : r.id);
                                }}
                                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                                title="Toggle Unit Details"
                              >
                                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                              </button>
                            </td>
                          </tr>

                          {/* Expanded Unit-by-Unit Dossier */}
                          {isExpanded && (
                            <tr className="bg-slate-950/70 border-y border-slate-800">
                              <td colSpan={10} className="p-4">
                                <div className="space-y-3">
                                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                                    <div className="flex items-center gap-2">
                                      <BookOpen className="w-4 h-4 text-emerald-400" />
                                      <span className="font-bold text-white text-xs">
                                        Registered Units for {r.studentName} ({r.admissionNumber})
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-slate-400 text-xs">
                                      {r.hodApproval && (
                                        <span className="text-emerald-400 font-mono text-[11px] bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800">
                                          HOD Ref: {r.hodApproval.approvalRef} ({r.hodApproval.hodName})
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {r.units.map((unit, uIdx) => (
                                      <div
                                        key={unit.id || uIdx}
                                        className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-start justify-between gap-2"
                                      >
                                        <div className="min-w-0">
                                          <div className="flex items-center gap-1.5">
                                            <span className="font-mono font-bold text-emerald-400 text-xs">{unit.unitCode}</span>
                                            <span
                                              className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                                unit.category === 'Core'
                                                  ? 'bg-blue-500/10 text-blue-400'
                                                  : unit.category === 'Common'
                                                  ? 'bg-emerald-500/10 text-emerald-400'
                                                  : 'bg-purple-500/10 text-purple-400'
                                              }`}
                                            >
                                              {unit.category}
                                            </span>
                                            {unit.isReassessment && (
                                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                                                Reassessment
                                              </span>
                                            )}
                                          </div>
                                          <div className="text-xs font-semibold text-slate-200 mt-0.5 truncate">{unit.unitName}</div>
                                          <div className="text-[10px] text-slate-400 mt-0.5">
                                            Trainer: <span className="text-slate-300 font-medium">{unit.trainerName || 'Unassigned'}</span>
                                            {unit.decisionComment && <span className="italic ml-1">({unit.decisionComment})</span>}
                                          </div>
                                        </div>

                                        <div className="text-right shrink-0">
                                          <div className="font-mono font-bold text-emerald-400 text-xs">
                                            KES {(unit.amountCharged || 0).toLocaleString()}
                                          </div>
                                          <span
                                            className={`inline-block mt-1 px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                              unit.status === 'APPROVED'
                                                ? 'bg-emerald-500/10 text-emerald-400'
                                                : unit.status === 'REJECTED'
                                                ? 'bg-red-500/10 text-red-400'
                                                : 'bg-amber-500/10 text-amber-400'
                                            }`}
                                          >
                                            {unit.status}
                                          </span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 3: TRAINER UNIT ALLOCATIONS & JURISDICTIONS                        */}
      {/* ========================================================================= */}
      {selectedReport === 'TRAINERS' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl flex flex-wrap items-center justify-between gap-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search trainer name, staff number, specialization..."
                value={trainerSearch}
                onChange={(e) => setTrainerSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            <button
              onClick={handleExportTrainersCSV}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
            >
              <Download className="w-3.5 h-3.5" /> Download Allocation Register (CSV)
            </button>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-950/80 text-slate-400 border-b border-slate-800 font-semibold">
                    <th className="py-3 px-3 w-10 text-center">#</th>
                    <th className="py-3 px-3">Staff Number</th>
                    <th className="py-3 px-3">Trainer Name</th>
                    <th className="py-3 px-3">Contact & Email</th>
                    <th className="py-3 px-3">Specialization</th>
                    <th className="py-3 px-3 text-center">Assigned Units</th>
                    <th className="py-3 px-3">Assigned Unit Codes</th>
                    <th className="py-3 px-3 text-center">Candidate Queue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {filteredTrainers.map((t, idx) => {
                    const assignedUnits = units.filter((u) => u.defaultTrainerId === t.id);
                    const candidateCount = registrations.filter((r) => r.units.some((u) => u.trainerId === t.id)).length;

                    return (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 text-center text-slate-500 font-mono text-[11px]">{idx + 1}</td>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-400">{t.staffNumber}</td>
                        <td className="py-3 px-3 font-bold text-white">{t.name}</td>
                        <td className="py-3 px-3">
                          <div className="text-slate-300">{t.email}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{t.phone}</div>
                        </td>
                        <td className="py-3 px-3 text-slate-300">{t.specialization}</td>
                        <td className="py-3 px-3 text-center">
                          <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold">
                            {assignedUnits.length}
                          </span>
                        </td>
                        <td className="py-3 px-3 max-w-xs">
                          {assignedUnits.length === 0 ? (
                            <span className="text-slate-500 italic text-[11px]">No units assigned</span>
                          ) : (
                            <div className="flex flex-wrap gap-1">
                              {assignedUnits.map((u) => (
                                <span
                                  key={u.id}
                                  className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 text-slate-300 rounded text-[10px] font-mono"
                                  title={u.unitName}
                                >
                                  {u.unitCode}
                                </span>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-bold text-white">
                          <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs">{candidateCount}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* REPORT 4: FINANCIAL REVENUE & FEE AUDIT                                  */}
      {/* ========================================================================= */}
      {selectedReport === 'FINANCIAL' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Core Competencies Inflow</div>
              <div className="text-xl font-bold text-blue-400 mt-1">KES {financialStats.coreRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Core units assessed @ KES 2,500</div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Common Units Inflow</div>
              <div className="text-xl font-bold text-emerald-400 mt-1">KES {financialStats.commonRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Common units assessed @ KES 1,800</div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Basic Units Inflow</div>
              <div className="text-xl font-bold text-purple-400 mt-1">KES {financialStats.basicRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Basic units assessed @ KES 1,200</div>
            </div>

            <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl">
              <div className="text-xs text-slate-400 font-semibold">Reassessment & Re-sits</div>
              <div className="text-xl font-bold text-amber-400 mt-1">KES {financialStats.reassessmentRevenue.toLocaleString()}</div>
              <div className="text-[10px] text-slate-400 mt-0.5 font-medium">Reassessment fees @ KES {config.reassessmentFee || 2000}</div>
            </div>
          </div>

          <div className="p-5 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Gross Projected Assessment Value</div>
              <div className="text-2xl font-bold text-white mt-1">KES {financialStats.grandTotal.toLocaleString()}</div>
              <p className="text-xs text-slate-400 mt-0.5">
                Calculated across {financialStats.totalAssessedUnits} registered unit competency assessments in current filter.
              </p>
            </div>

            <button
              onClick={handleExportRegistrationsCSV}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition shrink-0"
            >
              <Download className="w-4 h-4" /> Download Complete Financial Audit CSV
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
