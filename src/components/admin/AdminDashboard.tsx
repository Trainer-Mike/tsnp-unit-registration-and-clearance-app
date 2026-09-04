import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import {
  Department,
  Level,
  Course,
  Unit,
  Trainer,
  Student,
  AssessmentSeries,
  Registration,
  InstitutionConfig,
  User,
  UnitCategoryItem,
  formatModuleLabel,
} from '../../types';
import { StorageService, triggerStoreUpdate } from '../../services/storage';
import { DatabaseStatusBadge } from '../DatabaseStatusBadge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  Settings,
  BookOpen,
  GraduationCap,
  Users,
  Calendar,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Upload,
  Download,
  RotateCcw,
  CheckCircle2,
  BarChart3,
  ShieldCheck,
  Save,
  AlertCircle,
  FileSpreadsheet,
  FileText,
  Search,
  Tag,
  ArrowRight,
  UserCheck,
  CheckSquare,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  KeyRound,
  Bell,
} from 'lucide-react';
import { UnitModal } from './UnitModal';
import { UnitCategoryModal } from './UnitCategoryModal';
import { TrainerModal } from './TrainerModal';
import { StudentModal } from './StudentModal';
import { CourseModal } from './CourseModal';
import { LevelModal } from './LevelModal';
import { SeriesModal } from './SeriesModal';
import { AdminUserModal } from './AdminUserModal';
import { AdminChangePasswordModal } from './AdminChangePasswordModal';
import { BulkUnitImportModal } from './BulkUnitImportModal';
import { ReportsSection } from './ReportsSection';
import { PendingVerificationMonitor } from './PendingVerificationMonitor';

interface AdminDashboardProps {
  user: User;
  courses: Course[];
  levels: Level[];
  units: Unit[];
  trainers: Trainer[];
  students: Student[];
  assessmentSeriesList: AssessmentSeries[];
  unitCategories?: UnitCategoryItem[];
  users?: User[];
  registrations: Registration[];
  config: InstitutionConfig;
  onResetData: () => void;
  onOpenVerification?: (reference: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  user,
  courses,
  levels,
  units,
  trainers,
  students,
  assessmentSeriesList,
  unitCategories = [],
  users = [],
  registrations,
  config,
  onResetData,
  onOpenVerification,
}) => {
  const [activeTab, setActiveTab] = useState<
    | 'ANALYTICS'
    | 'PENDING_VERIFICATIONS'
    | 'REPORTS'
    | 'UNITS'
    | 'TRAINERS'
    | 'STUDENTS'
    | 'COURSES_LEVELS'
    | 'SERIES'
    | 'ADMINS'
    | 'SETTINGS'
  >('ANALYTICS');

  // Institution Config Form State
  const [instConfig, setInstConfig] = useState<InstitutionConfig>(config);
  const [configSaved, setConfigSaved] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Departments
  const departments = StorageService.getDepartments();
  const categoriesList = unitCategories.length > 0 ? unitCategories : StorageService.getUnitCategories();
  const usersList = users.length > 0 ? users : StorageService.getUsers();

  // Search, Filter & Pagination States (10 records per page)
  const PAGE_SIZE = 10;

  const [unitSearch, setUnitSearch] = useState('');
  const [unitCategoryFilter, setUnitCategoryFilter] = useState('ALL');
  const [unitsPage, setUnitsPage] = useState(1);

  const [trainerSearch, setTrainerSearch] = useState('');
  const [trainersPage, setTrainersPage] = useState(1);

  const [assignmentSearch, setAssignmentSearch] = useState('');
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<'ALL' | 'ASSIGNED' | 'UNASSIGNED'>('ALL');
  const [assignmentsPage, setAssignmentsPage] = useState(1);

  const [studentSearch, setStudentSearch] = useState('');
  const [studentCourseFilter, setStudentCourseFilter] = useState('ALL');
  const [studentsPage, setStudentsPage] = useState(1);

  const [courseSearch, setCourseSearch] = useState('');
  const [coursesPage, setCoursesPage] = useState(1);

  const [seriesSearch, setSeriesSearch] = useState('');
  const [seriesPage, setSeriesPage] = useState(1);

  const [adminRoleFilter, setAdminRoleFilter] = useState('ALL');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminsPage, setAdminsPage] = useState(1);

  // Modal Visibility & Editing Entity States
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);
  const [showBulkUnitImportModal, setShowBulkUnitImportModal] = useState(false);
  const [unitImportFeedback, setUnitImportFeedback] = useState<string | null>(null);

  const [showCategoryModal, setShowCategoryModal] = useState(false);

  const [showTrainerModal, setShowTrainerModal] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);

  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const [showLevelModal, setShowLevelModal] = useState(false);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);

  const [showSeriesModal, setShowSeriesModal] = useState(false);
  const [editingSeries, setEditingSeries] = useState<AssessmentSeries | null>(null);

  const [showAdminUserModal, setShowAdminUserModal] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState<User | null>(null);

  // Admin Password Management Modal States
  const [showPasswordChangeModal, setShowPasswordChangeModal] = useState(false);
  const [targetPasswordUser, setTargetPasswordUser] = useState<User | null>(null);
  const [targetPasswordStudent, setTargetPasswordStudent] = useState<Student | null>(null);
  const [targetPasswordTrainer, setTargetPasswordTrainer] = useState<Trainer | null>(null);
  const [adminPasswordToast, setAdminPasswordToast] = useState<string | null>(null);

  // CSV Bulk upload feedback
  const [csvUploadFeedback, setCsvUploadFeedback] = useState<string>('');
  const [unitsSyncFeedback, setUnitsSyncFeedback] = useState<string | null>(null);

  // Analytics data preparation
  const statusCounts = {
    APPROVED: registrations.filter((r) => r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS').length,
    AWAITING_HOD: registrations.filter((r) => r.status === 'AWAITING_HOD_APPROVAL').length,
    IN_TRAINER_REVIEW: registrations.filter((r) => r.status === 'SUBMITTED' || r.status === 'PARTIALLY_VERIFIED').length,
    RETURNED_OR_REJECTED: registrations.filter((r) => r.status === 'RETURNED' || r.status === 'REJECTED').length,
  };

  const statusPieData = [
    { name: 'Approved & Cleared', value: statusCounts.APPROVED, color: '#059669' },
    { name: 'Awaiting HOD', value: statusCounts.AWAITING_HOD, color: '#8b5cf6' },
    { name: 'In Trainer Review', value: statusCounts.IN_TRAINER_REVIEW, color: '#f59e0b' },
    { name: 'Returned / Rejected', value: statusCounts.RETURNED_OR_REJECTED, color: '#e11d48' },
  ];

  const seriesBarData = assessmentSeriesList.map((s) => {
    const matching = registrations.filter((r) => r.assessmentSeriesId === s.id);
    const approved = matching.filter((r) => r.status === 'APPROVED' || r.status === 'RECEIVED_BY_EXAMINATIONS').length;
    return {
      name: s.name.replace(' ASSESSMENT SERIES', '').replace(' SERIES', ''),
      Total: matching.length,
      Approved: approved,
    };
  });

  // Save Institution Config
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveConfig(instConfig);
    triggerStoreUpdate();
    setConfigSaved(true);
    setTimeout(() => setConfigSaved(false), 2500);
  };

  // --- CDACC Units CRUD Handlers ---
  const handleSaveUnit = (unit: Unit) => {
    StorageService.saveUnit(unit);
    triggerStoreUpdate();
  };

  const handleDeleteUnit = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the unit "${name}"? This action cannot be undone.`)) {
      StorageService.deleteUnit(id);
      triggerStoreUpdate();
    }
  };

  const handleDownloadUnitSampleCSV = () => {
    const defaultCourseCode = courses[0]?.code || 'DICT';
    const defaultLevelCode = levels[0]?.code || 'Level 6';
    const defaultTrainerStaff = trainers[0]?.staffNumber || 'TSNP/TR/001';

    const csvHeaders = 'UnitCode,UnitTitle,Category,CourseCode,Level,AmountCharged,TrainerStaffNo,Status,Description';
    const sampleRows = [
      `DICT/CU/IT/CR/01/6/A,Object Oriented Programming with Java,Core,${defaultCourseCode},${defaultLevelCode},2500,${defaultTrainerStaff},ACTIVE,Java OOP programming and software design patterns`,
      `DICT/CU/IT/CR/02/6/A,Database Management Systems,Core,${defaultCourseCode},${defaultLevelCode},2500,${defaultTrainerStaff},ACTIVE,Relational SQL database design and query optimization`,
      `DICT/CU/IT/CC/01/6/A,Communication Skills,Common,${defaultCourseCode},${defaultLevelCode},1800,${defaultTrainerStaff},ACTIVE,Workplace technical reporting and communication`,
      `DICT/CU/IT/BC/01/6/A,Basic Digital Literacy,Basic,${defaultCourseCode},${defaultLevelCode},1200,${defaultTrainerStaff},ACTIVE,Foundational computer applications and office productivity`,
      `CS/CU/IT/CR/01/5/A,Computer Maintenance and Repairs,Core,CS,Level 5,2000,${defaultTrainerStaff},ACTIVE,Hardware diagnosis and motherboard troubleshooting`,
    ];

    const csvContent = [csvHeaders, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TSNP_CDACC_Units_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkUnitImportComplete = (importedUnits: Unit[]) => {
    triggerStoreUpdate();
    setUnitImportFeedback(
      `Successfully imported and updated ${importedUnits.length} CDACC assessment units!`
    );
    setTimeout(() => setUnitImportFeedback(null), 5000);
  };

  // --- Unit Categories CRUD Handlers ---
  const handleSaveCategory = (category: UnitCategoryItem, autoAdjustUnits = true) => {
    StorageService.saveUnitCategory(category, autoAdjustUnits);
    triggerStoreUpdate();
  };

  const handleDeleteCategory = (categoryId: string) => {
    StorageService.deleteUnitCategory(categoryId);
    triggerStoreUpdate();
  };

  const handleAutoAdjustAllUnitFees = () => {
    const adjustedCount = StorageService.applyCategoryAmountsToAllUnits(categoriesList);
    triggerStoreUpdate();
    setUnitsSyncFeedback(
      `All ${units.length} units automatically adjusted to their set category amounts (Core: KES 2,500, Common: KES 1,800, Basic: KES 1,200). ${adjustedCount} fees were updated!`
    );
    setTimeout(() => setUnitsSyncFeedback(null), 5000);
  };

  // --- Trainers CRUD Handlers ---
  const handleSaveTrainer = (trainer: Trainer) => {
    StorageService.saveTrainer(trainer);
    // Also ensure associated user account exists or is updated with login credentials
    const existingUser = usersList.find((u) => u.id === trainer.userId || u.identifierNumber === trainer.staffNumber);
    const trainerPassword = trainer.password || existingUser?.password || 'trainer123';
    
    if (existingUser) {
      StorageService.saveUser({
        ...existingUser,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        identifierNumber: trainer.staffNumber,
        departmentId: trainer.departmentId,
        password: trainerPassword,
      });
    } else {
      StorageService.saveUser({
        id: trainer.userId,
        name: trainer.name,
        email: trainer.email,
        phone: trainer.phone,
        role: 'TRAINER',
        identifierNumber: trainer.staffNumber,
        departmentId: trainer.departmentId,
        title: 'Subject Trainer',
        password: trainerPassword,
      });
    }
    triggerStoreUpdate();
  };

  const handleDeleteTrainer = (id: string, name: string) => {
    if (window.confirm(`Delete trainer "${name}"? Assessment units assigned to this trainer will need reassignment.`)) {
      StorageService.deleteTrainer(id);
      triggerStoreUpdate();
    }
  };

  // --- Students CRUD Handlers ---
  const handleSaveStudent = (student: Student) => {
    StorageService.saveStudent(student);
    const existingUser = usersList.find((u) => u.id === student.userId || u.identifierNumber === student.admissionNumber);
    const studentPassword = student.password || existingUser?.password || 'student123';
    
    if (existingUser) {
      StorageService.saveUser({
        ...existingUser,
        name: student.name,
        email: student.email,
        phone: student.phone,
        identifierNumber: student.admissionNumber,
        departmentId: student.departmentId,
        password: studentPassword,
      });
    } else {
      StorageService.saveUser({
        id: student.userId,
        name: student.name,
        email: student.email,
        phone: student.phone,
        role: 'STUDENT',
        identifierNumber: student.admissionNumber,
        departmentId: student.departmentId,
        title: 'Student Candidate',
        password: studentPassword,
      });
    }
    triggerStoreUpdate();
  };

  const handleDeleteStudent = (id: string, name: string) => {
    if (window.confirm(`Delete student candidate "${name}"? Existing registration clearances will remain in history.`)) {
      StorageService.deleteStudent(id);
      triggerStoreUpdate();
    }
  };

  // --- Courses & Levels CRUD Handlers ---
  const handleSaveCourse = (course: Course) => {
    StorageService.saveCourse(course);
    triggerStoreUpdate();
  };

  const handleDeleteCourse = (id: string, name: string) => {
    if (window.confirm(`Delete course "${name}"?`)) {
      StorageService.deleteCourse(id);
      triggerStoreUpdate();
    }
  };

  const handleSaveLevel = (level: Level) => {
    StorageService.saveLevel(level);
    triggerStoreUpdate();
  };

  const handleDeleteLevel = (id: string, name: string) => {
    if (window.confirm(`Delete qualification level "${name}"?`)) {
      StorageService.deleteLevel(id);
      triggerStoreUpdate();
    }
  };

  // --- Assessment Series CRUD Handlers ---
  const handleSaveSeries = (series: AssessmentSeries) => {
    if (series.status === 'ACTIVE') {
      const confirmReset = window.confirm(
        `Activate "${series.name}" (${series.year})?\n\nThis will set it as the active assessment series and reset all student registrations to zero so trainees can register fresh for the units paid for in this cycle.\n\nAll master records (students, trainers, courses, syllabus units, and qualifications) will be strictly maintained.\n\nProceed?`
      );
      if (!confirmReset) return;
    }
    const result = StorageService.saveAssessmentSeries(series, user);
    triggerStoreUpdate();
    if (result.resetApplied) {
      alert(`Assessment series "${series.name}" activated successfully.\nAll student registrations have been reset to zero so trainees can register for the units paid for in the new series.`);
    }
  };

  const handleDeleteSeries = (id: string, name: string) => {
    if (window.confirm(`Delete assessment series "${name}"?`)) {
      StorageService.deleteAssessmentSeries(id);
      triggerStoreUpdate();
    }
  };

  const handleSetActiveSeries = (id: string) => {
    const target = assessmentSeriesList.find((s) => s.id === id);
    const seriesName = target?.name || 'Assessment Series';
    const seriesYear = target?.year || '';

    const confirmActivation = window.confirm(
      `Activate "${seriesName}" (${seriesYear})?\n\nThis will set this window as the ACTIVE assessment series for candidate registrations, and reset all student registrations to zero for the new cycle.\n\nAll master records (students, staff, courses, syllabus units, and institution settings) will be safely maintained.\n\nProceed?`
    );
    if (!confirmActivation) return;

    StorageService.setActiveAssessmentSeries(id, user);
    triggerStoreUpdate();
    alert(`"${seriesName}" is now the ACTIVE assessment series.\nAll student registrations have been reset to zero so trainees can register for the units paid for in the new series.`);
  };

  // --- System Admins & Staff Users CRUD Handlers ---
  const handleSaveAdminUser = (adminUser: User) => {
    StorageService.saveUser(adminUser);
    triggerStoreUpdate();
  };

  const handleDeleteAdminUser = (id: string, name: string) => {
    if (id === user.id) {
      alert('You cannot delete your own currently active administrator session account.');
      return;
    }
    if (window.confirm(`Delete user account for "${name}"?`)) {
      StorageService.deleteUser(id);
      triggerStoreUpdate();
    }
  };

  // --- CSV Bulk Upload Handler ---
  const handleCSVUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter((l) => l.trim().length > 0);
        let imported = 0;
        let updatedCount = 0;

        const currentStudents = StorageService.getStudents();
        const currentUsers = StorageService.getUsers();

        lines.slice(1).forEach((line) => {
          const cols = line.split(',').map((c) => c.replace(/"/g, '').trim());
          if (cols.length >= 2 && cols[0] && cols[1]) {
            const adm = cols[0].toUpperCase();
            const name = cols[1];
            const courseCode = cols[2] || 'DICT';
            const rawModule = cols[4] || cols[3] || '1';
            const parsedModule =
              rawModule.toLowerCase() === 'cycle 1'
                ? 'Cycle 1'
                : rawModule.toLowerCase() === 'cycle 2'
                ? 'Cycle 2'
                : !isNaN(Number(rawModule)) && Number(rawModule) > 0
                ? Number(rawModule)
                : 1;

            const matchedCourse = courses.find((c) => c.code.toLowerCase() === courseCode.toLowerCase()) || courses[0];

            // Check if user already exists
            const existingUser = currentUsers.find(
              (u) => u.identifierNumber?.toUpperCase() === adm || u.email?.toLowerCase() === `${adm.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.shambererenationalpoly.ac.ke`
            );
            const existingStudent = currentStudents.find(
              (s) => s.admissionNumber?.toUpperCase() === adm
            );

            const userId = existingUser ? existingUser.id : 'user-stu-' + Math.random().toString(36).substr(2, 7);
            const studentId = existingStudent ? existingStudent.id : 'stu-' + Math.random().toString(36).substr(2, 7);
            const studentEmail = `${adm.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.shambererenationalpoly.ac.ke`;

            const stuUser: User = {
              id: userId,
              name,
              email: studentEmail,
              phone: existingUser?.phone || '0700-000-000',
              role: 'STUDENT',
              identifierNumber: adm,
              departmentId: matchedCourse?.departmentId || 'dept-ci',
              password: existingUser?.password || 'student123',
            };
            StorageService.saveUser(stuUser);

            StorageService.saveStudent({
              id: studentId,
              userId: stuUser.id,
              admissionNumber: adm,
              name,
              email: stuUser.email,
              phone: stuUser.phone,
              courseId: matchedCourse?.id || courses[0]?.id || '',
              levelId: matchedCourse?.levelId || levels[0]?.id || '',
              departmentId: matchedCourse?.departmentId || 'dept-ci',
              currentModule: parsedModule,
              status: 'ACTIVE',
              password: stuUser.password || 'student123',
            });

            if (existingStudent) {
              updatedCount++;
            } else {
              imported++;
            }
          }
        });

        triggerStoreUpdate();
        setCsvUploadFeedback(
          `Processed CSV successfully: ${imported} new student candidate(s) created, ${updatedCount} existing record(s) updated. Zero duplicate records permitted.`
        );
        setTimeout(() => setCsvUploadFeedback(''), 5000);
      } catch (err) {
        setCsvUploadFeedback('Failed to parse CSV file. Please ensure comma-separated values.');
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadSampleCSV = () => {
    const csvContent =
      'AdmissionNumber,FullName,CourseCode,Level,ModuleOrCycle\nTSNP/DICT/2026/0990,Kiprono Evans,DICT,LEVEL 6,1\nTSNP/DICT/2026/0991,Achieng Faith,DICT,LEVEL 6,Cycle 1\nTSNP/CS/2026/0992,Kariuki James,CS,LEVEL 5,Cycle 2';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TSNP_Student_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered & Paginated lists (10 records per page)
  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(unitSearch.toLowerCase()) ||
      u.unitName.toLowerCase().includes(unitSearch.toLowerCase());
    const matchesCat = unitCategoryFilter === 'ALL' || u.category === unitCategoryFilter;
    return matchesSearch && matchesCat;
  });
  const paginatedUnits = filteredUnits.slice((unitsPage - 1) * PAGE_SIZE, unitsPage * PAGE_SIZE);

  const filteredTrainers = trainers.filter(
    (t) =>
      t.name.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      t.staffNumber.toLowerCase().includes(trainerSearch.toLowerCase()) ||
      (t.specialization && t.specialization.toLowerCase().includes(trainerSearch.toLowerCase()))
  );
  const paginatedTrainers = filteredTrainers.slice((trainersPage - 1) * PAGE_SIZE, trainersPage * PAGE_SIZE);

  const filteredAssignmentUnits = units.filter((u) => {
    const assignedTrainer = trainers.find((t) => t.id === u.defaultTrainerId);
    const course = courses.find((c) => c.id === u.courseId);
    const matchesSearch =
      u.unitCode.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      u.unitName.toLowerCase().includes(assignmentSearch.toLowerCase()) ||
      (course && (course.name.toLowerCase().includes(assignmentSearch.toLowerCase()) || course.code.toLowerCase().includes(assignmentSearch.toLowerCase()))) ||
      (assignedTrainer && (assignedTrainer.name.toLowerCase().includes(assignmentSearch.toLowerCase()) || assignedTrainer.staffNumber.toLowerCase().includes(assignmentSearch.toLowerCase())));

    const matchesStatus =
      assignmentStatusFilter === 'ALL' ||
      (assignmentStatusFilter === 'ASSIGNED' && Boolean(u.defaultTrainerId)) ||
      (assignmentStatusFilter === 'UNASSIGNED' && !u.defaultTrainerId);

    return matchesSearch && matchesStatus;
  });
  const paginatedAssignmentUnits = filteredAssignmentUnits.slice((assignmentsPage - 1) * PAGE_SIZE, assignmentsPage * PAGE_SIZE);

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.admissionNumber.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.email.toLowerCase().includes(studentSearch.toLowerCase());
    const matchesCourse = studentCourseFilter === 'ALL' || s.courseId === studentCourseFilter;
    return matchesSearch && matchesCourse;
  });
  const paginatedStudents = filteredStudents.slice((studentsPage - 1) * PAGE_SIZE, studentsPage * PAGE_SIZE);

  const filteredCourses = courses.filter((c) => {
    const dept = departments.find((d) => d.id === c.departmentId);
    const level = levels.find((l) => l.id === c.levelId);
    return (
      c.name.toLowerCase().includes(courseSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(courseSearch.toLowerCase()) ||
      (dept && dept.name.toLowerCase().includes(courseSearch.toLowerCase())) ||
      (level && level.name.toLowerCase().includes(courseSearch.toLowerCase()))
    );
  });
  const paginatedCourses = filteredCourses.slice((coursesPage - 1) * PAGE_SIZE, coursesPage * PAGE_SIZE);

  const filteredSeries = assessmentSeriesList.filter((s) => {
    return (
      s.name.toLowerCase().includes(seriesSearch.toLowerCase()) ||
      String(s.year).toLowerCase().includes(seriesSearch.toLowerCase()) ||
      s.status.toLowerCase().includes(seriesSearch.toLowerCase()) ||
      s.openingDate.toLowerCase().includes(seriesSearch.toLowerCase()) ||
      s.closingDate.toLowerCase().includes(seriesSearch.toLowerCase())
    );
  });
  const paginatedSeries = filteredSeries.slice((seriesPage - 1) * PAGE_SIZE, seriesPage * PAGE_SIZE);

  const filteredAdmins = usersList.filter((u) => {
    const matchesRole = adminRoleFilter === 'ALL' || u.role === adminRoleFilter;
    const matchesSearch =
      u.name.toLowerCase().includes(adminSearch.toLowerCase()) ||
      u.identifierNumber.toLowerCase().includes(adminSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(adminSearch.toLowerCase()) ||
      (u.title && u.title.toLowerCase().includes(adminSearch.toLowerCase()));
    return matchesRole && matchesSearch;
  });
  const paginatedAdmins = filteredAdmins.slice((adminsPage - 1) * PAGE_SIZE, adminsPage * PAGE_SIZE);

  // Reusable Pagination Controller for 10 records per page
  const renderPagination = (
    currentPage: number,
    totalItems: number,
    onPageChange: (page: number) => void,
    pageSize = PAGE_SIZE,
    itemName = 'records'
  ) => {
    if (totalItems === 0) return null;

    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    // Generate page numbers with responsive ellipses
    const getPageNumbers = () => {
      const pages: (number | string)[] = [];
      if (totalPages <= 5) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
      } else {
        if (currentPage <= 3) {
          pages.push(1, 2, 3, 4, '...', totalPages);
        } else if (currentPage >= totalPages - 2) {
          pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
        } else {
          pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
        }
      }
      return pages;
    };

    return (
      <div className="bg-slate-950/70 border border-slate-800 p-3 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-md">
        <div className="text-slate-400 font-medium flex items-center gap-1.5 flex-wrap">
          <span>Showing</span>
          <span className="font-bold text-white font-mono">{startItem}</span>
          <span>to</span>
          <span className="font-bold text-white font-mono">{endItem}</span>
          <span>of</span>
          <span className="font-bold text-emerald-400 font-mono">{totalItems}</span>
          <span>{itemName}</span>
          <span className="text-slate-500 font-normal ml-1">
            (Page <strong className="text-slate-300 font-mono">{currentPage}</strong> of{' '}
            <strong className="text-slate-300 font-mono">{totalPages}</strong>)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="First Page"
          >
            <ChevronsLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold"
            title="Previous Page"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Prev</span>
          </button>

          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, idx) => {
              if (typeof p === 'string') {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-slate-600 font-mono">
                    ...
                  </span>
                );
              }
              const isCurrent = p === currentPage;
              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => onPageChange(p)}
                  className={`min-w-7 px-2 py-1 rounded-xl text-xs font-mono font-bold border transition ${
                    isCurrent
                      ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-md font-extrabold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 font-semibold"
            title="Next Page"
          >
            <span>Next</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages}
            className="p-1.5 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition"
            title="Last Page"
          >
            <ChevronsRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // Count pending units across all candidate registrations
  const totalPendingUnitsCount = registrations.reduce((acc, reg) => {
    return acc + (reg.units ? reg.units.filter((u) => u.status === 'PENDING').length : 0);
  }, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-slate-900/90 border border-slate-800 p-5 rounded-2xl backdrop-blur-md shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-xl font-bold text-white tracking-tight">
              Administrative Command & System Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Configure CDACC assessment curriculum units, trainer routing, student candidates, series windows, and system administrators.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('PENDING_VERIFICATIONS')}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition shadow-sm cursor-pointer ${
              activeTab === 'PENDING_VERIFICATIONS'
                ? 'bg-amber-600 text-white border-amber-500 shadow-md'
                : 'bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border-amber-500/30'
            }`}
          >
            <Bell className="w-3.5 h-3.5 text-amber-400" />
            <span>Pending Clearances</span>
            {totalPendingUnitsCount > 0 && (
              <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full">
                {totalPendingUnitsCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('REPORTS')}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-semibold rounded-xl text-xs border border-slate-700 transition shadow-sm"
          >
            <FileText className="w-3.5 h-3.5" /> Reports & Downloads
          </button>
          <button
            onClick={() => setShowCategoryModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
          >
            <Tag className="w-3.5 h-3.5 text-emerald-400" /> Manage Categories
          </button>
          <button
            onClick={() => {
              setEditingTrainer(null);
              setShowTrainerModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
          >
            <Plus className="w-3.5 h-3.5" /> Add Subject Trainer
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex flex-wrap gap-1.5 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl backdrop-blur-md shadow-lg overflow-x-auto">
        <button
          onClick={() => setActiveTab('ANALYTICS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ANALYTICS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BarChart3 className="w-4 h-4" /> Analytics Overview
        </button>

        <button
          onClick={() => setActiveTab('PENDING_VERIFICATIONS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'PENDING_VERIFICATIONS'
              ? 'bg-amber-600 text-white shadow-md'
              : 'text-amber-300 hover:text-amber-100 hover:bg-amber-950/40 border border-amber-500/20'
          }`}
        >
          <Bell className="w-4 h-4 text-amber-400" />
          <span>Trainer Clearances & Alerts</span>
          {totalPendingUnitsCount > 0 && (
            <span className="bg-amber-500 text-slate-950 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full shadow-xs">
              {totalPendingUnitsCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('REPORTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'REPORTS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" /> Reports & Downloads
        </button>

        <button
          onClick={() => setActiveTab('UNITS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'UNITS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <BookOpen className="w-4 h-4" /> CDACC Units ({units.length})
        </button>

        <button
          onClick={() => setActiveTab('TRAINERS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'TRAINERS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Users className="w-4 h-4" /> Subject Trainers ({trainers.length})
        </button>

        <button
          onClick={() => setActiveTab('STUDENTS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'STUDENTS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <GraduationCap className="w-4 h-4" /> Students ({students.length})
        </button>

        <button
          onClick={() => setActiveTab('COURSES_LEVELS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'COURSES_LEVELS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Layers className="w-4 h-4" /> Courses & Levels ({courses.length}/{levels.length})
        </button>

        <button
          onClick={() => setActiveTab('SERIES')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'SERIES'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Calendar className="w-4 h-4" /> Assessment Series ({assessmentSeriesList.length})
        </button>

        <button
          onClick={() => setActiveTab('ADMINS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'ADMINS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldCheck className="w-4 h-4" /> System Admins & Staff ({usersList.length})
        </button>

        <button
          onClick={() => setActiveTab('SETTINGS')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            activeTab === 'SETTINGS'
              ? 'bg-emerald-600 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Settings className="w-4 h-4" /> Institutional Config
        </button>
      </div>

      {/* Admin Password Toast Feedback */}
      {adminPasswordToast && (
        <div className="p-3 rounded-2xl bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs flex items-center justify-between gap-3 shadow-lg">
          <div className="flex items-center gap-2 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adminPasswordToast}</span>
          </div>
          <button
            onClick={() => setAdminPasswordToast(null)}
            className="text-emerald-400 hover:text-white text-[11px] font-bold"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'ANALYTICS' && (
        <div className="space-y-6">
          {/* Key Metric Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-semibold">Total CDACC Units</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">{units.length}</div>
              <div className="text-[11px] text-emerald-400 mt-1 font-medium">Across {categoriesList.length} Categories</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-semibold">Subject Trainers</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">{trainers.length}</div>
              <div className="text-[11px] text-blue-400 mt-1 font-medium">Active Routing Configured</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-semibold">Registered Students</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white mt-1 font-mono">{students.length}</div>
              <div className="text-[11px] text-purple-400 mt-1 font-medium">Enrolled Candidates</div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl shadow-lg">
              <div className="text-slate-400 text-xs font-semibold">Clearances Cleared</div>
              <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 mt-1 font-mono">
                {statusCounts.APPROVED}
              </div>
              <div className="text-[11px] text-slate-400 mt-1 font-medium">Of {registrations.length} submissions</div>
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-white text-sm mb-4">Registration Clearance Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusPieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {statusPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', color: isDark ? '#94a3b8' : '#475569' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-lg">
              <h3 className="font-bold text-white text-sm mb-4">Submissions by Assessment Series</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={seriesBarData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#1e293b' : '#e2e8f0'} />
                    <XAxis dataKey="name" stroke={isDark ? '#64748b' : '#475569'} fontSize={10} />
                    <YAxis stroke={isDark ? '#64748b' : '#475569'} fontSize={10} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0f172a' : '#ffffff',
                        borderColor: isDark ? '#334155' : '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                        color: isDark ? '#f8fafc' : '#0f172a',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      }}
                      itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                    />
                    <Bar dataKey="Total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Approved" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PENDING TRAINER CLEARANCES & ALERTS MONITOR */}
      {activeTab === 'PENDING_VERIFICATIONS' && (
        <PendingVerificationMonitor
          registrations={registrations}
          trainers={trainers}
          students={students}
          users={users}
          assessmentSeriesList={assessmentSeriesList}
          onViewRegistration={onOpenVerification}
        />
      )}

      {/* TAB: REPORTS & EXPORTS CENTER */}
      {activeTab === 'REPORTS' && (
        <ReportsSection
          units={units}
          trainers={trainers}
          courses={courses}
          levels={levels}
          students={students}
          assessmentSeriesList={assessmentSeriesList}
          registrations={registrations}
          config={instConfig}
          unitCategories={categoriesList}
        />
      )}

      {/* TAB 2: CDACC UNITS CRUD */}
      {activeTab === 'UNITS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-white text-base">CDACC/TSNP Assessment Units Catalog</h2>
              <p className="text-xs text-slate-400">
                Manage curriculum competency units, categories, fees, and assigned subject specialists.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadUnitSampleCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
                title="Download CSV template with required parameters and sample CDACC units"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Download Template
              </button>
              <button
                onClick={() => setShowBulkUnitImportModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
                title="Import multiple units from a CSV spreadsheet file"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-400" /> Bulk CSV Import
              </button>
              <button
                onClick={handleAutoAdjustAllUnitFees}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-800/60 font-semibold rounded-xl text-xs transition"
                title="Automatically adjust fee for all units based on their category (Core: 2,500, Common: 1,800, Basic: 1,200)"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Auto-Adjust All Fees
              </button>
              <button
                onClick={() => setShowCategoryModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
              >
                <Tag className="w-3.5 h-3.5 text-emerald-400" /> Unit Categories ({categoriesList.length})
              </button>
              <button
                onClick={() => {
                  setEditingUnit(null);
                  setShowUnitModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Add CDACC Unit
              </button>
            </div>
          </div>

          {unitImportFeedback && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center gap-2 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{unitImportFeedback}</span>
            </div>
          )}

          {unitsSyncFeedback && (
            <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center gap-2 text-xs font-medium animate-fadeIn">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{unitsSyncFeedback}</span>
            </div>
          )}

          {/* Standard Category Rate Quick Overview */}
          <div className="bg-slate-950/60 border border-slate-800/80 p-3 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-2.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Standard Category Rates:</span>
              <div className="flex flex-wrap items-center gap-2">
                {categoriesList.map((cat) => {
                  const fee = cat.defaultAmount || StorageService.getCategoryDefaultAmount(cat.name, categoriesList);
                  const isFiltered = unitCategoryFilter === cat.name;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        setUnitCategoryFilter(isFiltered ? 'ALL' : cat.name);
                        setUnitsPage(1);
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition border flex items-center gap-1.5 ${
                        isFiltered
                          ? 'bg-emerald-600 text-slate-950 border-emerald-500 font-bold'
                          : 'bg-slate-900 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                      title={`Filter by ${cat.name} (${cat.code})`}
                    >
                      <span className="font-sans font-medium">{cat.name}:</span>
                      <span className={isFiltered ? 'text-slate-950 font-bold' : 'text-emerald-400'}>
                        KES {fee.toLocaleString()}
                      </span>
                    </button>
                  );
                })}

                <div
                  className="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border flex items-center gap-1.5 bg-amber-500/10 border-amber-500/30 text-amber-300"
                  title="Uniform fee across all units when a student retakes a failed unit"
                >
                  <span className="font-sans font-medium text-amber-400">🔄 Re-sit (Failed Units):</span>
                  <span className="font-bold text-amber-300">
                    KES {(instConfig.reassessmentFee ?? 2000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <span className="text-[11px] text-slate-400 italic">
              ⚡ Reassessment fee cuts uniformly across all failed units retaken by candidates.
            </span>
          </div>

          {/* Search & Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search by unit code or unit title..."
                value={unitSearch}
                onChange={(e) => {
                  setUnitSearch(e.target.value);
                  setUnitsPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={unitCategoryFilter}
              onChange={(e) => {
                setUnitCategoryFilter(e.target.value);
                setUnitsPage(1);
              }}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Categories ({units.length})</option>
              {categoriesList.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name} ({cat.code})
                </option>
              ))}
            </select>
          </div>

          {/* Units Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Unit Code</th>
                    <th className="py-3 px-4">Unit Title</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Fee (KES)</th>
                    <th className="py-3 px-4">Trainer Allocation</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredUnits.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No assessment units match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedUnits.map((u) => {
                      const assignedTrainer = trainers.find((t) => t.id === u.defaultTrainerId);
                      return (
                        <tr key={u.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{u.unitCode}</td>
                          <td className="py-3 px-4 font-medium text-white max-w-xs">{u.unitName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                                u.category === 'Core'
                                  ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                  : u.category === 'Common'
                                  ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {u.category}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-semibold text-slate-200">
                            {u.amountCharged?.toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <div>
                              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                                Selected by Trainee
                              </span>
                              {assignedTrainer && (
                                <span className="text-[10px] text-slate-400 block font-mono mt-0.5">
                                  Default: {assignedTrainer.name}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                u.status === 'ACTIVE'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                  : 'bg-slate-800 text-slate-400'
                              }`}
                            >
                              {u.status || 'ACTIVE'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setEditingUnit(u);
                                  setShowUnitModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                                title="Edit Unit"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUnit(u.id, u.unitName)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                                title="Delete Unit"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Units Pagination Controls */}
          {renderPagination(unitsPage, filteredUnits.length, setUnitsPage, PAGE_SIZE, 'CDACC units')}
        </div>
      )}

      {/* TAB 3: TRAINERS CRUD & ROUTING */}
      {activeTab === 'TRAINERS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-white text-base">Subject Trainers Directory</h2>
              <p className="text-xs text-slate-400">
                Create and manage subject trainers across courses and classes. Trainees select the trainer who taught them for each unit during registration.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setEditingTrainer(null);
                  setShowTrainerModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Add Subject Trainer
              </button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search trainer name, staff ID number, or specialization area..."
              value={trainerSearch}
              onChange={(e) => {
                setTrainerSearch(e.target.value);
                setTrainersPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Trainers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTrainers.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                No subject trainers found matching your search.
              </div>
            ) : (
              paginatedTrainers.map((t) => {
                const assignedUnits = units.filter((u) => u.defaultTrainerId === t.id);
                return (
                  <div
                    key={t.id}
                    className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-bold text-white text-sm">{t.name}</h3>
                          <div className="text-xs font-mono font-bold text-emerald-400">{t.staffNumber}</div>
                        </div>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setTargetPasswordUser(null);
                              setTargetPasswordStudent(null);
                              setTargetPasswordTrainer(t);
                              setShowPasswordChangeModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                            title="Reset Trainer Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingTrainer(t);
                              setShowTrainerModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Trainer Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTrainer(t.id, t.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                            title="Delete Trainer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                        <div>{t.email}</div>
                        {t.phone && <div>{t.phone}</div>}
                        {t.specialization && (
                          <div className="text-slate-300 font-medium pt-1 border-t border-slate-800/80">
                            {t.specialization}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">Class Routing:</span>
                        <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40">
                          Selected by Trainees
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Available across all courses & classes. Trainees choose this trainer for taught units during assessment registration.
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Trainers Pagination Controls */}
          {renderPagination(trainersPage, filteredTrainers.length, setTrainersPage, PAGE_SIZE, 'trainers')}
        </div>
      )}

      {/* TAB 5: STUDENTS CRUD & CSV BULK IMPORT */}
      {activeTab === 'STUDENTS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-white text-base">Student Candidates Master Directory</h2>
              <p className="text-xs text-slate-400">
                Enroll candidates, update course associations, or batch import student rosters via CSV.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleDownloadSampleCSV}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Download Template
              </button>

              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 text-blue-400" /> Bulk CSV Import
                <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
              </label>

              <button
                onClick={() => {
                  setEditingStudent(null);
                  setShowStudentModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Add Student
              </button>
            </div>
          </div>

          {csvUploadFeedback && (
            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl text-blue-300 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400" />
              {csvUploadFeedback}
            </div>
          )}

          {/* Search & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search candidate name, admission number, or email..."
                value={studentSearch}
                onChange={(e) => {
                  setStudentSearch(e.target.value);
                  setStudentsPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={studentCourseFilter}
              onChange={(e) => {
                setStudentCourseFilter(e.target.value);
                setStudentsPage(1);
              }}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Courses ({students.length})</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} - {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Students Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Admission No</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Course Enrolled</th>
                    <th className="py-3 px-4">Module</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No student candidates found matching your query.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s) => {
                      const course = courses.find((c) => c.id === s.courseId);
                      return (
                        <tr key={s.id} className="hover:bg-slate-800/40 transition">
                          <td className="py-3 px-4 font-mono font-bold text-emerald-400">{s.admissionNumber}</td>
                          <td className="py-3 px-4 font-semibold text-white">{s.name}</td>
                          <td className="py-3 px-4 text-slate-300">
                            {course ? `${course.code} - ${course.name}` : 'Unknown Course'}
                          </td>
                          <td className="py-3 px-4 font-mono text-emerald-400 font-semibold">
                            {formatModuleLabel(s.currentModule)}
                          </td>
                          <td className="py-3 px-4 text-slate-400">{s.email}</td>
                          <td className="py-3 px-4">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                s.status === 'ACTIVE'
                                  ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                                  : 'bg-rose-950/80 text-rose-300'
                              }`}
                            >
                              {s.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  setTargetPasswordUser(null);
                                  setTargetPasswordTrainer(null);
                                  setTargetPasswordStudent(s);
                                  setShowPasswordChangeModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                                title="Reset Candidate Password"
                              >
                                <KeyRound className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingStudent(s);
                                  setShowStudentModal(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                                title="Edit Student"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteStudent(s.id, s.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                                title="Delete Student"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Students Pagination Controls */}
          {renderPagination(studentsPage, filteredStudents.length, setStudentsPage, PAGE_SIZE, 'student candidates')}
        </div>
      )}

      {/* TAB 6: COURSES & ACADEMIC LEVELS CRUD */}
      {activeTab === 'COURSES_LEVELS' && (
        <div className="space-y-6">
          {/* Courses Section */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="font-bold text-white text-base">Academic Courses</h2>
                <p className="text-xs text-slate-400">Manage academic diploma and certificate programmes.</p>
              </div>

              <button
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Add Course
              </button>
            </div>

            {/* Courses Search Bar */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search course title, course code, department, or qualification level..."
                value={courseSearch}
                onChange={(e) => {
                  setCourseSearch(e.target.value);
                  setCoursesPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCourses.length === 0 ? (
                <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                  No academic courses found matching your search.
                </div>
              ) : (
                paginatedCourses.map((c) => {
                  const level = levels.find((l) => l.id === c.levelId);
                  const dept = departments.find((d) => d.id === c.departmentId);
                  const courseUnits = units.filter((u) => u.courseId === c.id);

                  return (
                    <div
                      key={c.id}
                      className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-3 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-emerald-400 border border-slate-700">
                              {c.code}
                            </span>
                            <h3 className="font-bold text-white text-sm mt-2">{c.name}</h3>
                          </div>
                          <div className="inline-flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingCourse(c);
                                setShowCourseModal(true);
                              }}
                              className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit Course"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteCourse(c.id, c.name)}
                              className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                              title="Delete Course"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="mt-2 text-[11px] text-slate-400 space-y-1">
                          <div>Level: <strong className="text-slate-200">{level ? level.name : 'N/A'}</strong></div>
                          <div>Dept: <span className="text-slate-300">{dept ? dept.name : 'N/A'}</span></div>
                          <div>Duration: <span className="font-mono text-slate-300">{c.durationSemesters || 6} Semesters</span></div>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
                        <span>Curriculum Units:</span>
                        <span className="font-bold font-mono text-emerald-400">{courseUnits.length} units</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Courses Pagination Controls */}
            {renderPagination(coursesPage, filteredCourses.length, setCoursesPage, PAGE_SIZE, 'courses')}
          </div>

          {/* Levels Section */}
          <div className="space-y-4 pt-4 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
              <div>
                <h2 className="font-bold text-white text-base">Qualification Levels Framework</h2>
                <p className="text-xs text-slate-400">TSNP/CDACC qualification levels (e.g. Level 6, Level 5, Level 4).</p>
              </div>

              <button
                onClick={() => {
                  setEditingLevel(null);
                  setShowLevelModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition"
              >
                <Plus className="w-4 h-4 text-emerald-400" /> Add Qualification Level
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {levels.map((lvl) => (
                <div
                  key={lvl.id}
                  className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-lg space-y-2 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-1 rounded font-mono font-bold text-xs bg-emerald-950/80 text-emerald-400 border border-emerald-800/40">
                        {lvl.code}
                      </span>
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingLevel(lvl);
                            setShowLevelModal(true);
                          }}
                          className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                          title="Edit Level"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteLevel(lvl.id, lvl.name)}
                          className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                          title="Delete Level"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-bold text-white text-sm mt-2">{lvl.name}</h4>
                    <p className="text-xs text-slate-400 mt-1">{lvl.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: ASSESSMENT SERIES CRUD */}
      {activeTab === 'SERIES' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-white text-base">CDACC/TSNP Assessment Series Windows</h2>
              <p className="text-xs text-slate-400">
                Manage assessment intake windows, registration opening/closing dates, and active session status.
              </p>
            </div>

            <button
              onClick={() => {
                setEditingSeries(null);
                setShowSeriesModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
            >
              <Plus className="w-4 h-4" /> Add Assessment Series
            </button>
          </div>

          {/* Series Search Bar */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search assessment series title or academic year..."
              value={seriesSearch}
              onChange={(e) => {
                setSeriesSearch(e.target.value);
                setSeriesPage(1);
              }}
              className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSeries.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 text-xs">
                No assessment series found matching your search.
              </div>
            ) : (
              paginatedSeries.map((s) => {
                const regCount = registrations.filter((r) => r.assessmentSeriesId === s.id).length;
                const isActive = s.status === 'ACTIVE';

                return (
                  <div
                    key={s.id}
                    className={`bg-slate-900/80 border rounded-2xl p-4 shadow-lg space-y-4 flex flex-col justify-between ${
                      isActive ? 'border-emerald-500/50 ring-1 ring-emerald-500/30' : 'border-slate-800'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            isActive
                              ? 'bg-emerald-500 text-slate-950 font-extrabold'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {s.status}
                        </span>
                        <div className="inline-flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSeries(s);
                              setShowSeriesModal(true);
                            }}
                            className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                            title="Edit Series"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteSeries(s.id, s.name)}
                            className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                            title="Delete Series"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="font-bold text-white text-sm">{s.name}</h3>

                      <div className="text-xs text-slate-400 space-y-1">
                        <div>
                          Academic Year: <span className="font-mono font-bold text-emerald-400">{s.year}</span>
                        </div>
                        <div className="text-[11px]">
                          Window: <span className="text-slate-300 font-mono">{s.openingDate}</span> to{' '}
                          <span className="text-slate-300 font-mono">{s.closingDate}</span>
                        </div>
                        <div>
                          Registered Candidates:{' '}
                          <strong className="text-slate-200 font-mono">{regCount}</strong>
                        </div>
                      </div>
                    </div>

                    {!isActive && (
                      <button
                        onClick={() => handleSetActiveSeries(s.id)}
                        className="w-full py-2 bg-slate-800 hover:bg-emerald-600 hover:text-slate-950 text-slate-200 font-bold rounded-xl text-xs transition"
                      >
                        Set As Active Assessment Window
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Series Pagination Controls */}
          {renderPagination(seriesPage, filteredSeries.length, setSeriesPage, PAGE_SIZE, 'series windows')}
        </div>
      )}

      {/* TAB 8: SYSTEM ADMINS & STAFF USERS CRUD */}
      {activeTab === 'ADMINS' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900/80 border border-slate-800 p-4 rounded-2xl">
            <div>
              <h2 className="font-bold text-white text-base">System Administrators & Staff Accounts</h2>
              <p className="text-xs text-slate-400">
                Manage administrator credentials, examinations officers, and role-based permissions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => {
                  setTargetPasswordUser(null);
                  setTargetPasswordStudent(null);
                  setTargetPasswordTrainer(null);
                  setShowPasswordChangeModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs border border-slate-700 transition"
              >
                <KeyRound className="w-3.5 h-3.5 text-amber-400" /> Change User Password
              </button>
              <button
                onClick={() => {
                  setEditingAdminUser(null);
                  setShowAdminUserModal(true);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
              >
                <Plus className="w-4 h-4" /> Add System Admin / Staff
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search user name, email, or staff identifier..."
                value={adminSearch}
                onChange={(e) => {
                  setAdminSearch(e.target.value);
                  setAdminsPage(1);
                }}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={adminRoleFilter}
              onChange={(e) => {
                setAdminRoleFilter(e.target.value);
                setAdminsPage(1);
              }}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            >
              <option value="ALL">All Account Roles ({usersList.length})</option>
              <option value="ADMIN">System Admins</option>
              <option value="EXAM_OFFICER">Exam Officers</option>
              <option value="HOD">Heads of Department (HOD)</option>
              <option value="TRAINER">Subject Trainers</option>
              <option value="STUDENT">Student Candidates</option>
            </select>
          </div>

          {/* Users Table */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 font-semibold border-b border-slate-800 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Staff / ID Number</th>
                    <th className="py-3 px-4">Full Name</th>
                    <th className="py-3 px-4">Assigned Role</th>
                    <th className="py-3 px-4">Official Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Designation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredAdmins.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-500">
                        No user accounts match your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    paginatedAdmins.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-4 font-mono font-bold text-emerald-400">{u.identifierNumber}</td>
                        <td className="py-3 px-4 font-semibold text-white">
                          {u.name}
                          {u.id === user.id && (
                            <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
                              (Current You)
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border ${
                              u.role === 'ADMIN'
                                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                                : u.role === 'EXAM_OFFICER'
                                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                                : u.role === 'HOD'
                                ? 'bg-purple-950/80 text-purple-300 border-purple-800'
                                : u.role === 'TRAINER'
                                ? 'bg-blue-950/80 text-blue-300 border-blue-800'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-300">{u.email}</td>
                        <td className="py-3 px-4 text-slate-400">{u.phone || '—'}</td>
                        <td className="py-3 px-4 text-slate-400">{u.title || '—'}</td>
                        <td className="py-3 px-4 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => {
                                setTargetPasswordStudent(null);
                                setTargetPasswordTrainer(null);
                                setTargetPasswordUser(u);
                                setShowPasswordChangeModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                              title="Reset User Password"
                            >
                              <KeyRound className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingAdminUser(u);
                                setShowAdminUserModal(true);
                              }}
                              className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                              title="Edit User"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {u.id !== user.id && (
                              <button
                                onClick={() => handleDeleteAdminUser(u.id, u.name)}
                                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                                title="Delete User"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admins Pagination Controls */}
          {renderPagination(adminsPage, filteredAdmins.length, setAdminsPage, PAGE_SIZE, 'user accounts')}
        </div>
      )}

      {/* TAB 9: SETTINGS & INSTITUTION CONFIG */}
      {activeTab === 'SETTINGS' && (
        <div className="space-y-6">
          <form
            onSubmit={handleSaveConfig}
            className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-4 sm:p-6 shadow-xl space-y-6"
          >
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-base">Institution & Official Form Parameters</h3>
                <p className="text-xs text-slate-400">
                  All details dynamically populate the printable form ({instConfig.formReference}) and clearance certificates.
                </p>
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs sm:text-sm shadow-lg transition"
              >
                <Save className="w-4 h-4" /> Save Institutional Config
              </button>
            </div>

            {configSaved && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Institutional configuration updated successfully!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-300 mb-1">Institution Full Name</label>
                <input
                  type="text"
                  value={instConfig.institutionName}
                  onChange={(e) => setInstConfig({ ...instConfig, institutionName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Department Name</label>
                <input
                  type="text"
                  value={instConfig.departmentName}
                  onChange={(e) => setInstConfig({ ...instConfig, departmentName: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Official Form Reference</label>
                <input
                  type="text"
                  value={instConfig.formReference}
                  onChange={(e) => setInstConfig({ ...instConfig, formReference: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Head of Department Designation</label>
                <input
                  type="text"
                  value={instConfig.hodDesignation}
                  onChange={(e) => setInstConfig({ ...instConfig, hodDesignation: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Postal Address</label>
                <input
                  type="text"
                  value={instConfig.postalAddress}
                  onChange={(e) => setInstConfig({ ...instConfig, postalAddress: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Official Email Address</label>
                <input
                  type="text"
                  value={instConfig.email}
                  onChange={(e) => setInstConfig({ ...instConfig, email: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Telephone Contact</label>
                <input
                  type="text"
                  value={instConfig.phone}
                  onChange={(e) => setInstConfig({ ...instConfig, phone: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Official Website URL</label>
                <input
                  type="text"
                  value={instConfig.website}
                  onChange={(e) => setInstConfig({ ...instConfig, website: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Reassessment / Re-sit Uniform Rate Configuration */}
              <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl">
                <label className="block font-bold text-amber-300 mb-1 flex items-center justify-between">
                  <span>Reassessment / Re-sit Unit Fee ({instConfig.defaultCurrency || 'KES'})</span>
                  <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                    Failed Unit Retake Rate
                  </span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="100"
                  value={instConfig.reassessmentFee ?? 2000}
                  onChange={(e) => setInstConfig({ ...instConfig, reassessmentFee: Number(e.target.value) || 0 })}
                  className="w-full p-2.5 bg-slate-950 border border-amber-700/60 text-amber-300 rounded-xl font-mono font-bold focus:ring-2 focus:ring-amber-500"
                  placeholder="2000"
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Uniform fixed amount cutting across all units regardless of category when a trainee registers a failed unit for reassessment (Default: KES 2,000).
                </p>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Current Academic Year</label>
                <input
                  type="text"
                  value={instConfig.currentAcademicYear || '2026'}
                  onChange={(e) => setInstConfig({ ...instConfig, currentAcademicYear: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-200 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </form>

          {/* Cloud Database Persistence Status */}
          <DatabaseStatusBadge variant="full" />

          {/* Danger Zone: Reset System Data */}
          <div className="bg-rose-950/20 border border-rose-900/40 rounded-2xl p-5 sm:p-6 space-y-3">
            <div className="flex items-center gap-2 text-rose-400">
              <AlertCircle className="w-5 h-5" />
              <h4 className="font-bold text-sm">System Database Maintenance</h4>
            </div>
            <p className="text-xs text-slate-400">
              Reset system data back to institutional factory defaults if you want to clear test records and repopulate standard demonstration datasets.
            </p>
            <button
              onClick={onResetData}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600/80 hover:bg-rose-600 text-white font-bold rounded-xl text-xs transition shadow-lg"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore Default Database Records
            </button>
          </div>
        </div>
      )}

      {/* MODALS */}
      <UnitModal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSave={handleSaveUnit}
        editingUnit={editingUnit}
        courses={courses}
        levels={levels}
        trainers={trainers}
        categories={categoriesList}
      />

      <BulkUnitImportModal
        isOpen={showBulkUnitImportModal}
        onClose={() => setShowBulkUnitImportModal(false)}
        onImportComplete={handleBulkUnitImportComplete}
        existingUnits={units}
        courses={courses}
        levels={levels}
        trainers={trainers}
        categories={categoriesList}
      />

      <UnitCategoryModal
        isOpen={showCategoryModal}
        onClose={() => setShowCategoryModal(false)}
        categories={categoriesList}
        onSaveCategory={handleSaveCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <TrainerModal
        isOpen={showTrainerModal}
        onClose={() => setShowTrainerModal(false)}
        onSave={handleSaveTrainer}
        editingTrainer={editingTrainer}
        departments={departments}
      />

      <StudentModal
        isOpen={showStudentModal}
        onClose={() => setShowStudentModal(false)}
        onSave={handleSaveStudent}
        editingStudent={editingStudent}
        courses={courses}
        levels={levels}
      />

      <CourseModal
        isOpen={showCourseModal}
        onClose={() => setShowCourseModal(false)}
        onSave={handleSaveCourse}
        editingCourse={editingCourse}
        departments={departments}
        levels={levels}
      />

      <LevelModal
        isOpen={showLevelModal}
        onClose={() => setShowLevelModal(false)}
        onSave={handleSaveLevel}
        editingLevel={editingLevel}
      />

      <SeriesModal
        isOpen={showSeriesModal}
        onClose={() => setShowSeriesModal(false)}
        onSave={handleSaveSeries}
        editingSeries={editingSeries}
      />

      <AdminUserModal
        isOpen={showAdminUserModal}
        onClose={() => setShowAdminUserModal(false)}
        onSave={handleSaveAdminUser}
        editingUser={editingAdminUser}
        departments={departments}
      />

      {/* ADMIN PASSWORD OVERRIDE MODAL */}
      <AdminChangePasswordModal
        isOpen={showPasswordChangeModal}
        onClose={() => {
          setShowPasswordChangeModal(false);
          setTargetPasswordUser(null);
          setTargetPasswordStudent(null);
          setTargetPasswordTrainer(null);
        }}
        targetUser={targetPasswordUser}
        targetStudent={targetPasswordStudent}
        targetTrainer={targetPasswordTrainer}
        currentAdmin={user}
        allUsers={usersList}
        onPasswordChanged={(msg) => {
          setAdminPasswordToast(msg);
          triggerStoreUpdate();
          setTimeout(() => setAdminPasswordToast(null), 4000);
        }}
      />
    </div>
  );
};
