export type UserRole = 'STUDENT' | 'TRAINER' | 'HOD' | 'ADMIN' | 'EXAM_OFFICER';

export type UnitCategory = 'Basic' | 'Common' | 'Core' | string;

export interface UnitCategoryItem {
  id: string;
  name: string;
  code: string;
  description?: string;
  badgeColor?: string;
  defaultAmount?: number;
}

export type RegistrationStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PARTIALLY_VERIFIED'
  | 'AWAITING_HOD_APPROVAL'
  | 'RETURNED'
  | 'REJECTED'
  | 'APPROVED'
  | 'RECEIVED_BY_EXAMINATIONS';

export type UnitVerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'RETURNED';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  identifierNumber: string; // Admission No or Staff No
  departmentId: string;
  avatarUrl?: string;
  signatureDataUrl?: string;
  title?: string; // e.g. "Senior Trainer", "HOD", "Student"
  password?: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  hodName: string;
  hodDesignation: string;
  hodEmail: string;
}

export interface Course {
  id: string;
  code: string;
  name: string;
  departmentId: string;
  levelId: string;
  durationSemesters?: number;
}

export interface Level {
  id: string;
  name: string;
  code: string; // "Level 6", "Level 5", "Level 4"
  description: string;
}

export interface Unit {
  id: string;
  unitCode: string;
  unitName: string;
  category: UnitCategory;
  courseId: string;
  levelId: string;
  amountCharged: number;
  defaultTrainerId: string;
  description?: string;
  prerequisites?: string[];
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Trainer {
  id: string;
  userId: string;
  name: string;
  email: string;
  staffNumber: string;
  departmentId: string;
  phone: string;
  specialization: string;
  signatureDataUrl?: string;
  password?: string;
}

export interface UnitTrainerAssignment {
  id: string;
  unitId: string;
  trainerId: string;
  academicYear: string;
  active: boolean;
}

export type AcademicModule = number | string;

export interface Student {
  id: string;
  userId: string;
  admissionNumber: string;
  name: string;
  email: string;
  phone: string;
  courseId: string;
  levelId: string;
  departmentId: string;
  nationalId?: string;
  currentModule: AcademicModule; // Module 1 to 6, or Cycle 1 / Cycle 2 (earlier trainee cohorts)
  currentYearOfStudy?: number; // legacy fallback
  status: 'ACTIVE' | 'DEFERRED' | 'COMPLETED';
  password?: string;
}

export interface ModuleOption {
  value: string | number;
  label: string;
  shortLabel: string;
  group: 'Earlier Trainee Cycles' | 'Standard Curriculum Modules';
  type: 'cycle' | 'module';
}

/**
 * Returns the maximum progression module for a given academic qualification level.
 * Level 6 (Diploma) -> Module 6
 * Level 5 (Certificate/Craft) -> Module 5
 * Level 4 (Artisan) -> Module 4
 */
export const getMaxModulesForLevel = (levelCodeOrName?: string, levelId?: string): number => {
  const str = `${levelCodeOrName || ''} ${levelId || ''}`.toLowerCase();
  if (str.includes('6') || str.includes('diploma')) return 6;
  if (str.includes('5') || str.includes('craft') || str.includes('certificate')) return 5;
  if (str.includes('4') || str.includes('artisan')) return 4;
  return 6;
};

/**
 * Returns all available module and cycle options for selection,
 * including Cycle 1, Cycle 2, and progressive Curriculum Modules 1 through maxModules.
 */
export const getModuleOptions = (levelCodeOrName?: string, levelId?: string): ModuleOption[] => {
  const maxModules = getMaxModulesForLevel(levelCodeOrName, levelId);
  const options: ModuleOption[] = [
    {
      value: 'Cycle 1',
      label: 'Cycle 1 (Earlier Trainee Cohort)',
      shortLabel: 'Cycle 1',
      group: 'Earlier Trainee Cycles',
      type: 'cycle',
    },
    {
      value: 'Cycle 2',
      label: 'Cycle 2 (Earlier Trainee Cohort)',
      shortLabel: 'Cycle 2',
      group: 'Earlier Trainee Cycles',
      type: 'cycle',
    },
  ];

  for (let m = 1; m <= maxModules; m++) {
    options.push({
      value: m,
      label: m === 1 ? 'Module 1 (Admission Stage)' : m === maxModules ? `Module ${m} (Final Stage)` : `Module ${m}`,
      shortLabel: `Mod ${m}`,
      group: 'Standard Curriculum Modules',
      type: 'module',
    });
  }

  return options;
};

/**
 * Helper to display human-friendly full module / cycle label
 */
export const formatModuleLabel = (mod?: number | string): string => {
  if (mod === undefined || mod === null || mod === '') return 'Module 1';
  const str = String(mod).trim();
  if (str.toLowerCase() === 'cycle 1' || str.toLowerCase() === 'cycle-1' || str.toLowerCase() === 'cycle1') {
    return 'Cycle 1';
  }
  if (str.toLowerCase() === 'cycle 2' || str.toLowerCase() === 'cycle-2' || str.toLowerCase() === 'cycle2') {
    return 'Cycle 2';
  }
  if (str.toLowerCase().startsWith('cycle')) {
    return str;
  }
  if (str.toLowerCase().startsWith('mod')) {
    return str;
  }
  const parsedNum = Number(str);
  if (!isNaN(parsedNum)) {
    return `Module ${parsedNum}`;
  }
  return str;
};

/**
 * Helper for compact / badge module and cycle display
 */
export const formatModuleShort = (mod?: number | string): string => {
  if (mod === undefined || mod === null || mod === '') return 'Mod 1';
  const str = String(mod).trim();
  if (str.toLowerCase().includes('cycle 1') || str.toLowerCase() === 'cycle-1') return 'Cycle 1';
  if (str.toLowerCase().includes('cycle 2') || str.toLowerCase() === 'cycle-2') return 'Cycle 2';
  if (str.toLowerCase().startsWith('cycle')) return str;
  const num = String(mod).replace(/[^0-9]/g, '');
  return num ? `Mod ${num}` : str;
};

export interface AssessmentSeries {
  id: string;
  name: string; // e.g., "July/August 2026 Series", "November/December 2026 Series"
  year: string; // e.g., "2026"
  openingDate: string;
  closingDate: string;
  status: 'ACTIVE' | 'UPCOMING' | 'CLOSED';
}

export interface RegistrationUnitItem {
  id: string;
  unitId: string;
  unitCode: string;
  unitName: string;
  category: UnitCategory;
  amountCharged: number;
  trainerId: string;
  trainerName: string;
  status: UnitVerificationStatus;
  decisionComment?: string;
  verifiedAt?: string;
  verifiedByTrainerName?: string;
  signatureRef?: string;
  isReassessment?: boolean; // True if this unit is a re-sit/reassessment of a failed unit
  attemptType?: 'REGULAR' | 'REASSESSMENT';
  originalAmountCharged?: number; // Standard category fee before reassessment uniform rate
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  details: string;
  previousStatus?: string;
  newStatus?: string;
  ipAddress?: string;
}

export interface Registration {
  id: string;
  registrationReference: string; // e.g., "UR-2026-000142"
  studentId: string;
  studentName: string;
  admissionNumber: string;
  courseId: string;
  courseName: string;
  courseCode: string;
  levelId: string;
  levelName: string;
  departmentId: string;
  departmentName: string;
  assessmentSeriesId: string;
  assessmentSeriesName: string;
  year: string;
  module?: AcademicModule; // Target module/cycle of registration, e.g. 1, 2, 3... or "Cycle 1", "Cycle 2"
  units: RegistrationUnitItem[];
  totalAmount: number;
  status: RegistrationStatus;
  submittedAt: string;
  lastUpdatedAt: string;
  hodApproval?: {
    hodId: string;
    hodName: string;
    designation: string;
    decision: 'APPROVED' | 'REJECTED' | 'RETURNED';
    comments?: string;
    approvedAt: string;
    signatureDataUrl?: string;
    approvalRef: string;
  };
  examOfficeReceipt?: {
    receivedBy: string;
    receivedAt: string;
    referenceBatch?: string;
    notes?: string;
  };
  rejectionReason?: string;
  correctionComment?: string;
  resubmissionCount: number;
  auditLogs: AuditLogItem[];
}

export interface InAppNotification {
  id: string;
  targetUserId?: string;
  targetRole?: UserRole | 'ALL';
  title: string;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  read: boolean;
  createdAt: string;
  linkRegistrationId?: string;
}

export interface InstitutionConfig {
  id?: string;
  institutionName: string;
  departmentName: string;
  formReference: string;
  postalAddress: string;
  email: string;
  altEmail: string;
  phone: string;
  website: string;
  hodDesignation: string;
  defaultCurrency: string;
  currentAcademicYear: string;
  autoRoutingEnabled: boolean;
  allowPartialApproval: boolean;
  maxUnitsPerRegistration: number;
  requireSignatures: boolean;
  reassessmentFee?: number; // Uniform fee for unit reassessment / re-sit (Default: KES 2,000)
}
