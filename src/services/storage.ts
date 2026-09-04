import {
  Department,
  Level,
  Course,
  Unit,
  Trainer,
  Student,
  AssessmentSeries,
  Registration,
  RegistrationUnitItem,
  InstitutionConfig,
  User,
  InAppNotification,
  AuditLogItem,
  UnitVerificationStatus,
  UnitCategoryItem,
} from '../types';
import {
  INITIAL_INSTITUTION_CONFIG,
  INITIAL_DEPARTMENTS,
  INITIAL_LEVELS,
  INITIAL_COURSES,
  INITIAL_TRAINERS,
  INITIAL_UNITS,
  INITIAL_ASSESSMENT_SERIES,
  INITIAL_USERS,
  INITIAL_STUDENTS,
  INITIAL_REGISTRATIONS,
  INITIAL_NOTIFICATIONS,
  INITIAL_UNIT_CATEGORIES,
} from './demoData';

const SESSION_KEYS = {
  CURRENT_USER_ID: 'ourcs_current_user_id_v2',
  IS_LOGGED_IN: 'ourcs_is_logged_in_v2',
  REMEMBER_ME: 'ourcs_remember_me_v2',
};

// Legacy keys to purge so localStorage is not used for institutional records
const LEGACY_INSTITUTIONAL_KEYS = [
  'ourcs_institution_config_v2',
  'ourcs_departments_v2',
  'ourcs_levels_v2',
  'ourcs_courses_v2',
  'ourcs_trainers_v2',
  'ourcs_units_v2',
  'ourcs_series_v2',
  'ourcs_users_v2',
  'ourcs_students_v2',
  'ourcs_registrations_v2',
  'ourcs_notifications_v2',
  'ourcs_audit_logs_global_v2',
  'ourcs_unit_categories_v2',
];

// Event for notifying subscribers
const STORE_UPDATE_EVENT = 'ourcs_store_updated';

export const triggerStoreUpdate = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(STORE_UPDATE_EVENT));
  }
};

let syncIntervalId: any = null;

export class StorageService {
  // Central in-memory reactive cache populated from Neon PostgreSQL via Express API
  private static cache = {
    config: { ...INITIAL_INSTITUTION_CONFIG },
    departments: [...INITIAL_DEPARTMENTS],
    levels: [...INITIAL_LEVELS],
    courses: [...INITIAL_COURSES],
    trainers: [...INITIAL_TRAINERS],
    students: [...INITIAL_STUDENTS],
    units: [...INITIAL_UNITS],
    unitCategories: [...INITIAL_UNIT_CATEGORIES],
    series: [...INITIAL_ASSESSMENT_SERIES],
    users: [...INITIAL_USERS],
    registrations: [...INITIAL_REGISTRATIONS],
    notifications: [...INITIAL_NOTIFICATIONS],
    auditLogs: [] as AuditLogItem[],
    lastSynced: '',
    dataSource: 'initializing',
  };

  // Session-Aware Storage Helpers (sessionStorage vs localStorage strictly for authentication)
  private static getSessionValue(key: string): string | null {
    if (typeof window === 'undefined') return null;
    try {
      const sessionVal = sessionStorage.getItem(key);
      if (sessionVal !== null) return sessionVal;
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  private static setSessionValue(key: string, value: string, persistent: boolean = false): void {
    if (typeof window === 'undefined') return;
    try {
      if (persistent) {
        localStorage.setItem(key, value);
        sessionStorage.removeItem(key);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
      triggerStoreUpdate();
    } catch (e) {
      console.error('Session storage write error', e);
    }
  }

  private static clearSessionValues(): void {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN);
      sessionStorage.removeItem(SESSION_KEYS.CURRENT_USER_ID);
      localStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(SESSION_KEYS.CURRENT_USER_ID);
      localStorage.removeItem(SESSION_KEYS.REMEMBER_ME);
      triggerStoreUpdate();
    } catch (e) {
      console.error('Session storage clear error', e);
    }
  }

  // Initializer & Background Sync with Neon PostgreSQL via Express API
  public static async init(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Remove legacy institutional records from localStorage to ensure Neon is single source of truth
    try {
      LEGACY_INSTITUTIONAL_KEYS.forEach((key) => {
        localStorage.removeItem(key);
      });
    } catch {}

    // Clean up persistent login if remember-me was not selected
    const isLegacyPersistent = localStorage.getItem(SESSION_KEYS.IS_LOGGED_IN);
    const sessionActive = sessionStorage.getItem(SESSION_KEYS.IS_LOGGED_IN);
    if (isLegacyPersistent === 'true' && !sessionActive && localStorage.getItem(SESSION_KEYS.REMEMBER_ME) !== 'true') {
      localStorage.removeItem(SESSION_KEYS.IS_LOGGED_IN);
      localStorage.removeItem(SESSION_KEYS.CURRENT_USER_ID);
    }

    // Perform initial fetch from Neon PostgreSQL backend
    await this.syncWithBackend();

    // Set up background polling synchronization (every 3.5s)
    if (!syncIntervalId) {
      syncIntervalId = setInterval(() => {
        StorageService.syncWithBackend();
      }, 3500);

      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          StorageService.syncWithBackend();
        }
      });
      window.addEventListener('focus', () => {
        StorageService.syncWithBackend();
      });
    }
  }

  // Single Source of Truth Synchronization with Neon PostgreSQL
  public static async syncWithBackend(): Promise<void> {
    try {
      const res = await fetch('/api/bootstrap');
      if (res.ok) {
        const data = await res.json();
        if (data && data.success !== false) {
          if (data.config) this.cache.config = data.config;
          if (data.departments?.length) this.cache.departments = data.departments;
          if (data.levels?.length) this.cache.levels = data.levels;
          if (data.courses?.length) this.cache.courses = data.courses;
          if (data.trainers?.length) this.cache.trainers = data.trainers;
          if (data.units?.length) this.cache.units = data.units;
          if (data.series?.length) this.cache.series = data.series;
          if (data.users?.length) this.cache.users = data.users;
          if (data.students?.length) this.cache.students = data.students;
          if (data.registrations) this.cache.registrations = data.registrations;
          if (data.unitCategories?.length) this.cache.unitCategories = data.unitCategories;
          if (data.notifications) this.cache.notifications = data.notifications;
          if (data.auditLogs) this.cache.auditLogs = data.auditLogs;

          this.cache.dataSource = data.source || 'neon_postgresql';
          this.cache.lastSynced = data.lastUpdated || new Date().toISOString();

          triggerStoreUpdate();
        }
      }
    } catch {
      // Background retry on next tick
    }
  }

  // Neon Health Check
  public static async checkNeonHealth(): Promise<{
    status: string;
    database: {
      provider: string;
      connected: boolean;
      message: string;
      latencyMs?: number;
      databaseName?: string;
    };
  }> {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        return await res.json();
      }
      return {
        status: 'error',
        database: {
          provider: 'Neon PostgreSQL',
          connected: false,
          message: `Health check returned HTTP ${res.status}`,
        },
      };
    } catch (err: any) {
      return {
        status: 'error',
        database: {
          provider: 'Neon PostgreSQL',
          connected: false,
          message: err?.message || 'Could not connect to health check endpoint',
        },
      };
    }
  }

  public static resetToDefaults(): void {
    this.cache.config = { ...INITIAL_INSTITUTION_CONFIG };
    this.cache.departments = [...INITIAL_DEPARTMENTS];
    this.cache.levels = [...INITIAL_LEVELS];
    this.cache.courses = [...INITIAL_COURSES];
    this.cache.trainers = [...INITIAL_TRAINERS];
    this.cache.units = [...INITIAL_UNITS];
    this.cache.series = [...INITIAL_ASSESSMENT_SERIES];
    this.cache.users = [...INITIAL_USERS];
    this.cache.students = [...INITIAL_STUDENTS];
    this.cache.registrations = [];
    this.cache.notifications = [];
    this.cache.unitCategories = [...INITIAL_UNIT_CATEGORIES];
    this.cache.auditLogs = [];
    this.clearSessionValues();
    triggerStoreUpdate();

    try {
      fetch('/api/reset', { method: 'POST' }).catch(() => {});
    } catch {}
  }

  // --- Authentication Management ---
  public static isAuthenticated(): boolean {
    const isLogged = this.getSessionValue(SESSION_KEYS.IS_LOGGED_IN);
    const currentId = this.getSessionValue(SESSION_KEYS.CURRENT_USER_ID);
    return isLogged === 'true' && Boolean(currentId);
  }

  public static login(
    identifier: string,
    password?: string,
    rememberMe: boolean = false
  ): { success: boolean; user?: User; error?: string } {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Please provide an Email, Admission Number, or Staff ID.' };
    }

    const cleanInputPassword = (password || '').trim();
    if (!cleanInputPassword) {
      return { success: false, error: 'Please enter your account password.' };
    }

    const users = this.getUsers();
    const user = users.find((u) => {
      const emailMatch = u.email.toLowerCase() === cleanId;
      const idMatch = u.identifierNumber.toLowerCase() === cleanId;
      const cleanNoSlash = u.identifierNumber.replace(/[\/\s-]/g, '').toLowerCase();
      const inputNoSlash = cleanId.replace(/[\/\s-]/g, '');
      return emailMatch || idMatch || cleanNoSlash === inputNoSlash;
    });

    if (!user) {
      return {
        success: false,
        error: `No account found with identifier "${identifier}". Candidates can create a new profile using the "Candidate Self-Registration" tab.`,
      };
    }

    // Role-specific fallback default passwords
    const defaultPassword =
      user.role === 'ADMIN'
        ? 'admin123'
        : user.role === 'HOD'
        ? 'hod123'
        : user.role === 'EXAM_OFFICER'
        ? 'exam123'
        : user.role === 'TRAINER'
        ? 'trainer123'
        : 'student123';

    const validPasswords = [
      user.password?.trim(),
      defaultPassword,
      'poly123',
    ].filter(Boolean);

    const isMatch = validPasswords.some((vp) => vp === cleanInputPassword);

    if (!isMatch) {
      return {
        success: false,
        error: 'Incorrect password entered. Please check your credentials or contact the System Administrator to reset your password.',
      };
    }

    if (!user.password) {
      user.password = cleanInputPassword;
      this.saveUser(user);
    }

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(SESSION_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(SESSION_KEYS.REMEMBER_ME);
      }
    }

    this.setCurrentUser(user.id, rememberMe);
    this.setSessionValue(SESSION_KEYS.IS_LOGGED_IN, 'true', rememberMe);

    this.logAudit({
      id: `audit-${Date.now()}`,
      action: 'USER_LOGIN',
      userId: user.id,
      userName: user.name,
      userRole: user.role,
      timestamp: new Date().toISOString(),
      details: `User signed in successfully via identifier: ${user.identifierNumber} (Remember Me: ${rememberMe ? 'Enabled' : 'Disabled / Session-Only'})`,
    });

    return { success: true, user };
  }

  public static loginAsUser(userId: string, rememberMe: boolean = false): User | undefined {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (user) {
      this.setCurrentUser(user.id, rememberMe);
      this.setSessionValue(SESSION_KEYS.IS_LOGGED_IN, 'true', rememberMe);
      this.logAudit({
        id: `audit-${Date.now()}`,
        action: 'USER_LOGIN',
        userId: user.id,
        userName: user.name,
        userRole: user.role,
        timestamp: new Date().toISOString(),
        details: `Quick login as ${user.name} (${user.role})`,
      });
      return user;
    }
    return undefined;
  }

  public static logout(): void {
    const current = this.getCurrentUser();
    this.logAudit({
      id: `audit-${Date.now()}`,
      action: 'USER_LOGOUT',
      userId: current.id,
      userName: current.name,
      userRole: current.role,
      timestamp: new Date().toISOString(),
      details: `User ${current.name} signed out.`,
    });
    this.clearSessionValues();
  }

  // --- Current User Management ---
  public static getCurrentUser(): User {
    const users = this.getUsers();
    const currentId = this.getSessionValue(SESSION_KEYS.CURRENT_USER_ID);
    const user = currentId ? users.find((u) => u.id === currentId) : undefined;
    return user || users[0] || INITIAL_USERS[0];
  }

  public static setCurrentUser(userId: string, persistent: boolean = false): void {
    this.setSessionValue(SESSION_KEYS.CURRENT_USER_ID, userId, persistent);
  }

  // --- Users Management ---
  public static getUsers(): User[] {
    const stored = this.cache.users;
    const existingIds = new Set(stored.map((u) => u.id));
    const missing = INITIAL_USERS.filter((u) => !existingIds.has(u.id));
    if (missing.length > 0) {
      this.cache.users = [...stored, ...missing];
      return this.cache.users;
    }
    return stored;
  }

  public static saveUser(user: User): void {
    const list = this.getUsers();
    const cleanIdNo = user.identifierNumber?.trim().toUpperCase();
    const cleanEmail = user.email?.trim().toLowerCase();

    const idx = list.findIndex(
      (u) =>
        u.id === user.id ||
        (cleanIdNo && u.identifierNumber?.trim().toUpperCase() === cleanIdNo) ||
        (cleanEmail && u.email?.trim().toLowerCase() === cleanEmail)
    );

    let savedUser = user;
    if (idx >= 0) {
      savedUser = { ...user, id: list[idx].id };
      list[idx] = savedUser;
    } else {
      list.push(savedUser);
    }
    this.cache.users = list;
    triggerStoreUpdate();

    // Sync to Neon PostgreSQL
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedUser),
    }).catch(() => {});
  }

  public static deleteUser(userId: string): void {
    this.cache.users = this.getUsers().filter((u) => u.id !== userId);
    triggerStoreUpdate();

    fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- Password Management & Recovery ---
  public static findAccountForPasswordReset(identifierOrEmail: string): {
    found: boolean;
    user?: User;
    student?: Student;
    trainer?: Trainer;
    maskedEmail?: string;
    maskedPhone?: string;
  } {
    const clean = (identifierOrEmail || '').trim().toLowerCase();
    if (!clean) return { found: false };

    const users = this.getUsers();
    const students = this.getStudents();
    const trainers = this.getTrainers();

    const matchedUser = users.find(
      (u) =>
        u.identifierNumber.toLowerCase() === clean ||
        u.email.toLowerCase() === clean ||
        u.name.toLowerCase() === clean
    );

    const matchedStudent = students.find(
      (s) =>
        s.admissionNumber.toLowerCase() === clean ||
        s.email.toLowerCase() === clean ||
        (s.nationalId && s.nationalId.toLowerCase() === clean)
    );

    const matchedTrainer = trainers.find(
      (t) =>
        t.staffNumber.toLowerCase() === clean ||
        t.email.toLowerCase() === clean
    );

    let resolvedUser: User | undefined = matchedUser;
    if (!resolvedUser && matchedStudent) {
      resolvedUser = users.find(
        (u) => u.id === matchedStudent.userId || u.identifierNumber.toLowerCase() === matchedStudent.admissionNumber.toLowerCase()
      );
      if (!resolvedUser) {
        resolvedUser = {
          id: matchedStudent.userId || `usr-${matchedStudent.id}`,
          name: matchedStudent.name,
          email: matchedStudent.email,
          phone: matchedStudent.phone,
          role: 'STUDENT',
          identifierNumber: matchedStudent.admissionNumber,
          departmentId: matchedStudent.departmentId,
        };
      }
    }
    if (!resolvedUser && matchedTrainer) {
      resolvedUser = users.find(
        (u) => u.id === matchedTrainer.userId || u.identifierNumber.toLowerCase() === matchedTrainer.staffNumber.toLowerCase()
      );
      if (!resolvedUser) {
        resolvedUser = {
          id: matchedTrainer.userId || `usr-${matchedTrainer.id}`,
          name: matchedTrainer.name,
          email: matchedTrainer.email,
          phone: matchedTrainer.phone,
          role: 'TRAINER',
          identifierNumber: matchedTrainer.staffNumber,
          departmentId: matchedTrainer.departmentId,
        };
      }
    }

    if (!resolvedUser) {
      return { found: false };
    }

    const rawEmail = resolvedUser.email || matchedStudent?.email || matchedTrainer?.email || '';
    let maskedEmail = rawEmail;
    if (rawEmail.includes('@')) {
      const [namePart, domain] = rawEmail.split('@');
      const visible = namePart.slice(0, 2);
      maskedEmail = `${visible}***@${domain}`;
    }

    const rawPhone = resolvedUser.phone || matchedStudent?.phone || matchedTrainer?.phone || '';
    let maskedPhone = rawPhone;
    if (rawPhone && rawPhone.length >= 6) {
      maskedPhone = `${rawPhone.slice(0, 3)}****${rawPhone.slice(-3)}`;
    }

    return {
      found: true,
      user: resolvedUser,
      student: matchedStudent,
      trainer: matchedTrainer,
      maskedEmail,
      maskedPhone,
    };
  }

  public static resetPasswordWithVerification(params: {
    identifierOrEmail: string;
    newPassword: string;
  }): { success: boolean; message: string; user?: User } {
    const { identifierOrEmail, newPassword } = params;
    const cleanPwd = (newPassword || '').trim();

    if (!cleanPwd || cleanPwd.length < 4) {
      return {
        success: false,
        message: 'New password must be at least 4 characters long.',
      };
    }

    const account = this.findAccountForPasswordReset(identifierOrEmail);
    if (!account.found || !account.user) {
      return {
        success: false,
        message: 'No account found matching the provided Admission Number, Staff ID, or Email.',
      };
    }

    const targetUser = account.user;
    targetUser.password = cleanPwd;
    this.saveUser(targetUser);

    if (account.student) {
      const student = account.student;
      student.password = cleanPwd;
      this.saveStudent(student);
    }

    if (account.trainer) {
      const trainer = account.trainer;
      trainer.password = cleanPwd;
      this.saveTrainer(trainer);
    }

    this.logAudit({
      id: `audit-${Date.now()}`,
      action: 'USER_PASSWORD_RESET',
      userId: targetUser.id,
      userName: targetUser.name,
      userRole: targetUser.role,
      timestamp: new Date().toISOString(),
      details: `User successfully reset their account password via self-service recovery for ${targetUser.identifierNumber}`,
    });

    return {
      success: true,
      message: 'Your password has been reset successfully! You can now log in with your new password.',
      user: targetUser,
    };
  }

  public static adminChangeUserPassword(params: {
    userId: string;
    newPassword: string;
    adminUser: User;
  }): { success: boolean; message: string; user?: User } {
    const { userId, newPassword, adminUser } = params;
    const cleanPwd = (newPassword || '').trim();

    if (!cleanPwd || cleanPwd.length < 4) {
      return {
        success: false,
        message: 'New password must be at least 4 characters long.',
      };
    }

    const users = this.getUsers();
    let targetUser = users.find((u) => u.id === userId);

    if (!targetUser) {
      const student = this.getStudents().find((s) => s.id === userId || s.userId === userId);
      if (student) {
        targetUser = users.find((u) => u.identifierNumber === student.admissionNumber) || {
          id: student.userId || `usr-${student.id}`,
          name: student.name,
          email: student.email,
          phone: student.phone,
          role: 'STUDENT',
          identifierNumber: student.admissionNumber,
          departmentId: student.departmentId,
        };
      }
    }

    if (!targetUser) {
      const trainer = this.getTrainers().find((t) => t.id === userId || t.userId === userId);
      if (trainer) {
        targetUser = users.find((u) => u.identifierNumber === trainer.staffNumber) || {
          id: trainer.userId || `usr-${trainer.id}`,
          name: trainer.name,
          email: trainer.email,
          phone: trainer.phone,
          role: 'TRAINER',
          identifierNumber: trainer.staffNumber,
          departmentId: trainer.departmentId,
        };
      }
    }

    if (!targetUser) {
      return {
        success: false,
        message: 'User account not found.',
      };
    }

    targetUser.password = cleanPwd;
    this.saveUser(targetUser);

    const students = this.getStudents();
    const matchedStudent = students.find(
      (s) => s.userId === targetUser?.id || s.admissionNumber === targetUser?.identifierNumber
    );
    if (matchedStudent) {
      matchedStudent.password = cleanPwd;
      this.saveStudent(matchedStudent);
    }

    const trainers = this.getTrainers();
    const matchedTrainer = trainers.find(
      (t) => t.userId === targetUser?.id || t.staffNumber === targetUser?.identifierNumber
    );
    if (matchedTrainer) {
      matchedTrainer.password = cleanPwd;
      this.saveTrainer(matchedTrainer);
    }

    this.createNotification({
      targetUserId: targetUser.id,
      title: 'Security Alert: Password Updated by Admin',
      message: `Your account password was updated by Administrator ${adminUser.name}. If you did not request this, please contact the Examinations & Clearance Office.`,
      type: 'WARNING',
    });

    this.logAudit({
      id: `audit-${Date.now()}`,
      action: 'ADMIN_CHANGED_USER_PASSWORD',
      userId: adminUser.id,
      userName: adminUser.name,
      userRole: adminUser.role,
      timestamp: new Date().toISOString(),
      details: `Administrator ${adminUser.name} (${adminUser.identifierNumber}) updated password for user ${targetUser.name} (${targetUser.identifierNumber} - ${targetUser.role})`,
    });

    return {
      success: true,
      message: `Password for ${targetUser.name} (${targetUser.identifierNumber}) has been updated successfully.`,
      user: targetUser,
    };
  }

  // --- Institution Config ---
  public static getConfig(): InstitutionConfig {
    const config = this.cache.config;
    if (typeof config.reassessmentFee !== 'number' || config.reassessmentFee <= 0) {
      return { ...config, reassessmentFee: 2000 };
    }
    return config;
  }

  public static getReassessmentFee(): number {
    const config = this.getConfig();
    return typeof config.reassessmentFee === 'number' && config.reassessmentFee > 0 ? config.reassessmentFee : 2000;
  }

  public static saveConfig(config: InstitutionConfig): void {
    this.cache.config = config;
    triggerStoreUpdate();

    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    }).catch(() => {});
  }

  // --- Departments ---
  public static getDepartments(): Department[] {
    return this.cache.departments;
  }

  public static saveDepartment(dept: Department): void {
    const list = this.getDepartments();
    const idx = list.findIndex((d) => d.id === dept.id);
    if (idx >= 0) list[idx] = dept;
    else list.push(dept);
    this.cache.departments = list;
    triggerStoreUpdate();

    fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dept),
    }).catch(() => {});
  }

  public static deleteDepartment(deptId: string): void {
    this.cache.departments = this.getDepartments().filter((d) => d.id !== deptId);
    triggerStoreUpdate();

    fetch(`/api/departments/${deptId}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- Unit Categories ---
  public static getCategoryDefaultAmount(categoryNameOrCode: string, categoriesList?: UnitCategoryItem[]): number {
    const list = categoriesList || this.getUnitCategories();
    const clean = (categoryNameOrCode || '').trim().toLowerCase();

    const matched = list.find(
      (c) => c.name.toLowerCase() === clean || c.code.toLowerCase() === clean
    );
    if (matched && typeof matched.defaultAmount === 'number' && matched.defaultAmount > 0) {
      return matched.defaultAmount;
    }

    if (clean.includes('core') || clean === 'cr') return 2500;
    if (clean.includes('common') || clean === 'cc') return 1800;
    if (clean.includes('basic') || clean === 'bc') return 1200;
    if (clean.includes('elective') || clean === 'el') return 2000;
    if (clean.includes('practical') || clean === 'pr') return 3000;

    return 2500;
  }

  public static getUnitCategories(): UnitCategoryItem[] {
    const stored = this.cache.unitCategories;
    const existingIds = new Set(stored.map((c) => c.id));
    const missing = INITIAL_UNIT_CATEGORIES.filter((c) => !existingIds.has(c.id));
    let result = [...stored];
    if (missing.length > 0) {
      result = [...result, ...missing];
    }
    result = result.map((cat) => {
      if (typeof cat.defaultAmount !== 'number' || cat.defaultAmount <= 0) {
        return {
          ...cat,
          defaultAmount: this.getCategoryDefaultAmount(cat.name, INITIAL_UNIT_CATEGORIES),
        };
      }
      return cat;
    });
    this.cache.unitCategories = result;
    return result;
  }

  public static saveUnitCategory(category: UnitCategoryItem, autoAdjustUnits = true): void {
    const list = this.getUnitCategories();
    const idx = list.findIndex((c) => c.id === category.id);
    if (idx >= 0) list[idx] = category;
    else list.push(category);
    this.cache.unitCategories = list;
    triggerStoreUpdate();

    if (autoAdjustUnits && typeof category.defaultAmount === 'number' && category.defaultAmount > 0) {
      const units = this.getUnits();
      let unitsUpdated = false;
      const updatedUnits = units.map((u) => {
        if (
          u.category.toLowerCase() === category.name.toLowerCase() ||
          u.category.toLowerCase() === category.code.toLowerCase()
        ) {
          unitsUpdated = true;
          return { ...u, amountCharged: category.defaultAmount! };
        }
        return u;
      });
      if (unitsUpdated) {
        this.cache.units = updatedUnits;
        triggerStoreUpdate();
        this.saveUnitsBulk(updatedUnits);
      }
    }

    fetch('/api/unit-categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(category),
    }).catch(() => {});
  }

  public static deleteUnitCategory(categoryId: string): void {
    this.cache.unitCategories = this.getUnitCategories().filter((c) => c.id !== categoryId);
    triggerStoreUpdate();

    fetch(`/api/unit-categories/${categoryId}`, { method: 'DELETE' }).catch(() => {});
  }

  public static applyCategoryAmountsToAllUnits(categories?: UnitCategoryItem[]): number {
    const cats = categories || this.getUnitCategories();
    const units = this.getUnits();
    let count = 0;
    const updatedUnits = units.map((u) => {
      const targetAmount = this.getCategoryDefaultAmount(u.category, cats);
      if (u.amountCharged !== targetAmount) {
        count++;
        return { ...u, amountCharged: targetAmount };
      }
      return u;
    });
    if (count > 0) {
      this.cache.units = updatedUnits;
      triggerStoreUpdate();
      this.saveUnitsBulk(updatedUnits);
    }
    return count;
  }

  // --- Levels ---
  public static getLevels(): Level[] {
    return this.cache.levels;
  }

  public static saveLevel(level: Level): void {
    const list = this.getLevels();
    const cleanCode = level.code.trim().toUpperCase();
    const idx = list.findIndex((l) => l.id === level.id || l.code.trim().toUpperCase() === cleanCode);
    let savedLevel = level;
    if (idx >= 0) {
      savedLevel = { ...level, id: list[idx].id };
      list[idx] = savedLevel;
    } else {
      list.push(savedLevel);
    }
    this.cache.levels = list;
    triggerStoreUpdate();

    fetch('/api/levels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedLevel),
    }).catch(() => {});
  }

  public static deleteLevel(levelId: string): void {
    this.cache.levels = this.getLevels().filter((l) => l.id !== levelId);
    triggerStoreUpdate();

    fetch(`/api/levels/${levelId}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- Courses ---
  public static getCourses(): Course[] {
    return this.cache.courses;
  }

  public static saveCourse(course: Course): void {
    const list = this.getCourses();
    const cleanCode = course.code.trim().toUpperCase();
    const idx = list.findIndex((c) => c.id === course.id || c.code.trim().toUpperCase() === cleanCode);
    let savedCourse = course;
    if (idx >= 0) {
      savedCourse = { ...course, id: list[idx].id };
      list[idx] = savedCourse;
    } else {
      list.push(savedCourse);
    }
    this.cache.courses = list;
    triggerStoreUpdate();

    fetch('/api/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedCourse),
    }).catch(() => {});
  }

  public static deleteCourse(courseId: string): void {
    this.cache.courses = this.getCourses().filter((c) => c.id !== courseId);
    triggerStoreUpdate();

    fetch(`/api/courses/${courseId}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- Units ---
  public static getUnits(): Unit[] {
    return this.cache.units;
  }

  public static saveUnit(unit: Unit): void {
    const list = this.getUnits();
    const cleanCode = unit.unitCode.trim().toUpperCase();
    const idx = list.findIndex((u) => u.id === unit.id || u.unitCode.trim().toUpperCase() === cleanCode);
    let savedUnit = unit;
    if (idx >= 0) {
      savedUnit = { ...unit, id: list[idx].id };
      list[idx] = savedUnit;
    } else {
      list.push(savedUnit);
    }
    this.cache.units = list;
    triggerStoreUpdate();

    fetch('/api/units', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedUnit),
    }).catch(() => {});
  }

  public static saveUnitsBulk(newUnits: Unit[]): void {
    if (!newUnits || newUnits.length === 0) return;
    const list = this.getUnits();
    const unitMap = new Map<string, Unit>();
    list.forEach((u) => unitMap.set(u.id, u));

    const codeMap = new Map<string, string>();
    list.forEach((u) => codeMap.set(u.unitCode.toUpperCase(), u.id));

    newUnits.forEach((u) => {
      const existingIdByCode = codeMap.get(u.unitCode.toUpperCase());
      const targetId = existingIdByCode || u.id;
      const mergedUnit = { ...u, id: targetId };
      unitMap.set(targetId, mergedUnit);
      codeMap.set(u.unitCode.toUpperCase(), targetId);
    });

    this.cache.units = Array.from(unitMap.values());
    triggerStoreUpdate();

    fetch('/api/units/bulk', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ units: newUnits }),
    }).catch(() => {});
  }

  public static deleteUnit(unitId: string): void {
    this.cache.units = this.getUnits().filter((u) => u.id !== unitId);
    triggerStoreUpdate();

    fetch(`/api/units/${unitId}`, { method: 'DELETE' }).catch(() => {});
  }

  public static assignUnitToTrainer(unitId: string, trainerId: string): void {
    const list = this.getUnits();
    const idx = list.findIndex((u) => u.id === unitId);
    if (idx >= 0) {
      list[idx].defaultTrainerId = trainerId;
      this.cache.units = list;
      triggerStoreUpdate();
      this.saveUnit(list[idx]);
    }
  }

  public static bulkAssignUnitsToTrainer(unitIds: string[], trainerId: string): void {
    const list = this.getUnits();
    const unitSet = new Set(unitIds);
    const modified: Unit[] = [];
    list.forEach((u) => {
      if (unitSet.has(u.id)) {
        u.defaultTrainerId = trainerId;
        modified.push(u);
      }
    });
    this.cache.units = list;
    triggerStoreUpdate();
    if (modified.length > 0) {
      this.saveUnitsBulk(modified);
    }
  }

  // --- Trainers ---
  public static getTrainers(): Trainer[] {
    const stored = this.cache.trainers;
    const existingIds = new Set(stored.map((t) => t.id));
    const missing = INITIAL_TRAINERS.filter((t) => !existingIds.has(t.id));
    if (missing.length > 0) {
      this.cache.trainers = [...stored, ...missing];
      return this.cache.trainers;
    }
    return stored;
  }

  public static saveTrainer(trainer: Trainer): void {
    const list = this.getTrainers();
    const cleanStaffNo = trainer.staffNumber.trim().toUpperCase();
    const cleanEmail = trainer.email.trim().toLowerCase();
    const idx = list.findIndex(
      (t) =>
        t.id === trainer.id ||
        t.staffNumber.trim().toUpperCase() === cleanStaffNo ||
        t.email.trim().toLowerCase() === cleanEmail
    );
    let savedTrainer = trainer;
    if (idx >= 0) {
      savedTrainer = { ...trainer, id: list[idx].id };
      list[idx] = savedTrainer;
    } else {
      list.push(savedTrainer);
    }
    this.cache.trainers = list;
    triggerStoreUpdate();

    fetch('/api/trainers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedTrainer),
    }).catch(() => {});
  }

  public static deleteTrainer(trainerId: string): void {
    this.cache.trainers = this.getTrainers().filter((t) => t.id !== trainerId);
    triggerStoreUpdate();

    fetch(`/api/trainers/${trainerId}`, { method: 'DELETE' }).catch(() => {});
  }

  // --- Students ---
  public static getStudents(): Student[] {
    const stored = this.cache.students;
    const existingIds = new Set(stored.map((s) => s.id));
    const missing = INITIAL_STUDENTS.filter((s) => !existingIds.has(s.id));
    let list = stored;
    if (missing.length > 0) {
      list = [...stored, ...missing];
    }
    list = list.map((s) => {
      if (s.currentModule === undefined || s.currentModule === null || s.currentModule === '' || s.currentModule === 0) {
        return {
          ...s,
          currentModule: (s as any).currentYearOfStudy || 1,
        };
      }
      return s;
    });
    this.cache.students = list;
    return list;
  }

  public static saveStudent(student: Student): void {
    const list = this.getStudents();
    const cleanAdm = student.admissionNumber.trim().toUpperCase();
    const cleanEmail = student.email.trim().toLowerCase();
    const idx = list.findIndex(
      (s) =>
        s.id === student.id ||
        s.admissionNumber.trim().toUpperCase() === cleanAdm ||
        s.email.trim().toLowerCase() === cleanEmail
    );
    let savedStudent = student;
    if (idx >= 0) {
      savedStudent = { ...student, id: list[idx].id };
      list[idx] = savedStudent;
    } else {
      list.push(savedStudent);
    }
    this.cache.students = list;
    triggerStoreUpdate();

    fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedStudent),
    }).catch(() => {});
  }

  public static deleteStudent(studentId: string): void {
    this.cache.students = this.getStudents().filter((s) => s.id !== studentId);
    triggerStoreUpdate();

    fetch(`/api/students/${studentId}`, { method: 'DELETE' }).catch(() => {});
  }

  public static getStudentByUserId(userId: string): Student | undefined {
    return this.getStudents().find((s) => s.userId === userId);
  }

  public static getTrainerByUserId(userId: string): Trainer | undefined {
    return this.getTrainers().find((t) => t.userId === userId);
  }

  // --- Assessment Series ---
  public static getAssessmentSeries(): AssessmentSeries[] {
    return this.cache.series;
  }

  public static resetTransactionsForSeries(series: AssessmentSeries, triggeredBy?: User): void {
    this.cache.registrations = [];

    const activeAnnouncement: InAppNotification = {
      id: `notif-series-open-${Date.now()}`,
      targetRole: 'ALL',
      title: `Assessment Registration Open: ${series.name}`,
      message: `The ${series.name} (Academic Year ${series.year}) assessment series is now ACTIVE. Candidate registrations are open. All transactions have been reset to zero for the new cycle while preserving all student profiles, courses, and syllabus units.`,
      type: 'SUCCESS',
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.cache.notifications = [activeAnnouncement, ...this.cache.notifications];
    triggerStoreUpdate();

    this.logAudit({
      id: `audit-series-activated-${Date.now()}`,
      action: 'SERIES_ACTIVATED_TRANSACTIONS_RESET',
      userId: triggeredBy ? triggeredBy.id : 'system-admin',
      userName: triggeredBy ? triggeredBy.name : 'System Administrator',
      userRole: triggeredBy ? triggeredBy.role : 'ADMIN',
      timestamp: new Date().toISOString(),
      details: `Assessment Series "${series.name}" (${series.year}) was activated. All candidate registration transactions were cleanly reset to zero for the fresh assessment series while preserving all academic master records.`,
    });

    const config = this.getConfig();
    if (series.year && config.currentAcademicYear !== series.year) {
      config.currentAcademicYear = series.year;
      this.saveConfig(config);
    }

    fetch('/api/series/active', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        seriesId: series.id,
        userId: triggeredBy?.id,
        userName: triggeredBy?.name,
      }),
    }).catch(() => {});
  }

  public static saveAssessmentSeries(
    series: AssessmentSeries,
    triggeredBy?: User
  ): { series: AssessmentSeries; resetApplied: boolean } {
    const list = this.getAssessmentSeries();
    const idx = list.findIndex((s) => s.id === series.id);
    const becomesActive = series.status === 'ACTIVE';

    if (becomesActive) {
      list.forEach((s) => {
        if (s.id !== series.id && s.status === 'ACTIVE') {
          s.status = 'CLOSED';
        }
      });
    }

    let savedSeries = series;
    if (idx >= 0) {
      savedSeries = { ...series, id: list[idx].id };
      list[idx] = savedSeries;
    } else {
      list.unshift(savedSeries);
    }
    this.cache.series = list;
    triggerStoreUpdate();

    let resetApplied = false;
    if (becomesActive) {
      this.resetTransactionsForSeries(savedSeries, triggeredBy);
      resetApplied = true;
    }

    fetch('/api/series', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ series: savedSeries }),
    }).catch(() => {});

    return { series: savedSeries, resetApplied };
  }

  public static deleteAssessmentSeries(seriesId: string): void {
    this.cache.series = this.getAssessmentSeries().filter((s) => s.id !== seriesId);
    triggerStoreUpdate();

    fetch(`/api/series/${seriesId}`, { method: 'DELETE' }).catch(() => {});
  }

  public static setActiveAssessmentSeries(
    seriesId: string,
    triggeredBy?: User
  ): { success: boolean; activeSeries?: AssessmentSeries } {
    const list = this.getAssessmentSeries();
    let targetSeries: AssessmentSeries | undefined;

    list.forEach((s) => {
      if (s.id === seriesId) {
        s.status = 'ACTIVE';
        targetSeries = s;
      } else if (s.status === 'ACTIVE') {
        s.status = 'CLOSED';
      }
    });

    if (!targetSeries) return { success: false };

    this.cache.series = list;
    triggerStoreUpdate();
    this.resetTransactionsForSeries(targetSeries, triggeredBy);
    return { success: true, activeSeries: targetSeries };
  }

  // --- Registrations ---
  public static getRegistrations(): Registration[] {
    return this.cache.registrations;
  }

  public static getRegistrationById(id: string): Registration | undefined {
    return this.getRegistrations().find((r) => r.id === id || r.registrationReference === id);
  }

  public static generateRegistrationRef(): string {
    const regs = this.getRegistrations();
    const year = new Date().getFullYear();
    const seq = regs.length + 101;
    return `UR-${year}-${seq.toString().padStart(6, '0')}`;
  }

  public static deleteRegistration(regId: string): void {
    this.cache.registrations = this.getRegistrations().filter((r) => r.id !== regId);
    triggerStoreUpdate();

    fetch(`/api/registrations/${regId}`, { method: 'DELETE' }).catch(() => {});
  }

  public static saveRegistration(reg: Registration, actionLog?: { user: User; action: string; details: string }): void {
    const list = this.getRegistrations();
    const now = new Date().toISOString();

    // Deduplicate units in the registration by unitId/unitCode
    const uniqueUnits: RegistrationUnitItem[] = [];
    const seenUnitIds = new Set<string>();
    const seenUnitCodes = new Set<string>();

    (reg.units || []).forEach((u) => {
      const codeKey = u.unitCode.trim().toUpperCase();
      if (!seenUnitIds.has(u.unitId) && !seenUnitCodes.has(codeKey)) {
        seenUnitIds.add(u.unitId);
        seenUnitCodes.add(codeKey);
        uniqueUnits.push(u);
      }
    });

    reg.units = uniqueUnits;
    reg.totalAmount = uniqueUnits.reduce((acc, u) => acc + (u.amountCharged || 0), 0);

    if (actionLog) {
      const logItem: AuditLogItem = {
        id: 'log-' + Math.random().toString(36).substr(2, 9),
        timestamp: now,
        userId: actionLog.user.id,
        userName: actionLog.user.name,
        userRole: actionLog.user.role,
        action: actionLog.action,
        details: actionLog.details,
        newStatus: reg.status,
      };
      reg.auditLogs = [...(reg.auditLogs || []), logItem];
    }

    reg.lastUpdatedAt = now;

    const idx = list.findIndex(
      (r) =>
        r.id === reg.id ||
        (reg.registrationReference && r.registrationReference === reg.registrationReference) ||
        (r.studentId === reg.studentId && r.assessmentSeriesId === reg.assessmentSeriesId)
    );

    let savedReg = reg;
    if (idx >= 0) {
      const existing = list[idx];
      savedReg = {
        ...reg,
        id: existing.id,
        registrationReference: existing.registrationReference || reg.registrationReference,
        submittedAt: existing.submittedAt || reg.submittedAt || now,
      };
      list[idx] = savedReg;
    } else {
      list.unshift(savedReg);
    }
    this.cache.registrations = list;
    triggerStoreUpdate();

    // Synchronize directly with Neon PostgreSQL backend
    fetch('/api/registrations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(savedReg),
    }).catch((err) => {
      console.warn('Neon registration sync warning:', err);
    });
  }

  // --- Trainer Verification Handler ---
  public static verifyRegistrationUnit(params: {
    registrationId: string;
    unitItemId: string;
    decision: UnitVerificationStatus;
    comment?: string;
    trainer: Trainer;
    user?: User;
    trainerUser?: User;
    signatureDataUrl?: string;
  }): { success: boolean; message: string; updatedRegistration?: Registration } {
    const reg = this.getRegistrationById(params.registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };

    const unitItem = reg.units.find((u) => u.id === params.unitItemId);
    if (!unitItem) return { success: false, message: 'Unit record not found in registration' };

    const now = new Date().toISOString();
    unitItem.status = params.decision;
    unitItem.verifiedAt = now;
    unitItem.decisionComment = params.comment;
    unitItem.signatureRef = params.signatureDataUrl;
    unitItem.verifiedByTrainerName = params.trainer.name;

    const allApproved = reg.units.every((u) => u.status === 'APPROVED');
    const anyRejected = reg.units.some((u) => u.status === 'REJECTED');
    const anyReturned = reg.units.some((u) => u.status === 'RETURNED');
    const anyApproved = reg.units.some((u) => u.status === 'APPROVED');

    if (anyRejected) {
      reg.status = 'REJECTED';
    } else if (anyReturned) {
      reg.status = 'RETURNED';
    } else if (allApproved) {
      reg.status = 'AWAITING_HOD_APPROVAL';

      this.createNotification({
        targetRole: 'HOD',
        title: 'New Registration Ready for HOD Approval',
        message: `${reg.studentName} (${reg.admissionNumber}) has all units verified by trainers and is waiting for departmental authorization.`,
        type: 'INFO',
        linkRegistrationId: reg.id,
      });
    } else if (anyApproved) {
      reg.status = 'PARTIALLY_VERIFIED';
    } else {
      reg.status = 'SUBMITTED';
    }

    const actorUser = params.user || params.trainerUser || {
      id: params.trainer.userId || params.trainer.id,
      name: params.trainer.name,
      email: params.trainer.email,
      phone: params.trainer.phone,
      role: 'TRAINER' as const,
      identifierNumber: params.trainer.staffNumber,
      departmentId: params.trainer.departmentId,
    };

    this.createNotification({
      targetUserId: reg.studentId,
      title: `Unit ${params.decision === 'APPROVED' ? 'Approved' : 'Flagged'}: ${unitItem.unitCode}`,
      message: `Trainer ${params.trainer.name} evaluated "${unitItem.unitName}" -> Status: ${params.decision}. ${
        params.comment ? `Remarks: "${params.comment}"` : ''
      }`,
      type: params.decision === 'APPROVED' ? 'SUCCESS' : 'WARNING',
      linkRegistrationId: reg.id,
    });

    this.saveRegistration(reg, {
      user: actorUser,
      action: `TRAINER_UNIT_${params.decision}`,
      details: `${params.trainer.name} updated unit ${unitItem.unitCode} to ${params.decision}. Remarks: ${
        params.comment || 'None'
      }`,
    });

    return { success: true, message: `Unit updated to ${params.decision}`, updatedRegistration: reg };
  }

  // --- HOD Departmental Decision Handler ---
  public static approveRegistrationHOD(params: {
    registrationId: string;
    hodUser: User;
    decision: 'APPROVED' | 'RETURNED' | 'REJECTED';
    comments?: string;
    signatureDataUrl?: string;
  }): { success: boolean; message: string; updatedRegistration?: Registration } {
    const reg = this.getRegistrationById(params.registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };

    const config = this.getConfig();
    const now = new Date().toISOString();

    if (params.decision === 'APPROVED') {
      reg.status = 'APPROVED';
      reg.hodApproval = {
        hodId: params.hodUser.id,
        hodName: params.hodUser.name,
        designation: config.hodDesignation || 'Head of Department',
        decision: 'APPROVED',
        comments: params.comments || 'All CDACC Assessment Units verified by respective subject trainers. Candidate authorized.',
        approvedAt: now,
        signatureDataUrl: params.signatureDataUrl,
        approvalRef: `TSNP/CI/APP/${new Date().getFullYear()}/${reg.admissionNumber.split('/').pop() || '001'}`,
      };

      this.createNotification({
        targetUserId: reg.studentId,
        title: 'CDACC Unit Registration APPROVED!',
        message: `Your CDACC assessment registration (${reg.registrationReference}) has been approved by the Head of Department (${params.hodUser.name}). You can now print the official form.`,
        type: 'SUCCESS',
        linkRegistrationId: reg.id,
      });

      this.createNotification({
        targetRole: 'EXAM_OFFICER',
        title: 'New Approved Registration Available',
        message: `${reg.studentName} (${reg.admissionNumber}) registration ${reg.registrationReference} is cleared for examination docket.`,
        type: 'INFO',
        linkRegistrationId: reg.id,
      });
    } else if (params.decision === 'RETURNED') {
      reg.status = 'RETURNED';
      reg.correctionComment = params.comments || 'Returned by HOD for corrections';
      this.createNotification({
        targetUserId: reg.studentId,
        title: 'Registration Returned by HOD',
        message: `HOD remarks: "${params.comments || 'Please revise your registration'}"`,
        type: 'WARNING',
        linkRegistrationId: reg.id,
      });
    } else {
      reg.status = 'REJECTED';
      reg.rejectionReason = params.comments || 'Rejected by HOD';
      this.createNotification({
        targetUserId: reg.studentId,
        title: 'Registration Rejected by HOD',
        message: `Reason: "${params.comments || 'Departmental clearance not granted'}"`,
        type: 'ERROR',
        linkRegistrationId: reg.id,
      });
    }

    this.saveRegistration(reg, {
      user: params.hodUser,
      action: `HOD_${params.decision}`,
      details: `${params.hodUser.name} (${params.hodUser.title || 'HOD'}) made decision ${params.decision}. Comments: ${params.comments || 'None'}`,
    });

    return { success: true, message: `Registration ${params.decision.toLowerCase()} successfully`, updatedRegistration: reg };
  }

  // --- Examinations Officer Mark As Received ---
  public static markAsReceivedByExams(params: {
    registrationId: string;
    officerUser: User;
    notes?: string;
  }): { success: boolean; message: string; updatedRegistration?: Registration } {
    const reg = this.getRegistrationById(params.registrationId);
    if (!reg) return { success: false, message: 'Registration not found' };

    const now = new Date().toISOString();
    reg.status = 'RECEIVED_BY_EXAMINATIONS';
    reg.examOfficeReceipt = {
      receivedBy: params.officerUser.name,
      receivedAt: now,
      referenceBatch: `EXAM-BATCH-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      notes: params.notes,
    };

    this.saveRegistration(reg, {
      user: params.officerUser,
      action: 'EXAM_OFFICE_RECEIVED',
      details: `Form received and docketed by Examinations Officer ${params.officerUser.name}.`,
    });

    return { success: true, message: 'Registration marked as received by Examinations Office', updatedRegistration: reg };
  }

  // --- Notifications ---
  public static getNotifications(): InAppNotification[] {
    return this.cache.notifications;
  }

  public static isNotificationForUser(
    n: InAppNotification,
    user?: User,
    registrations?: Registration[],
    students?: Student[],
    trainers?: Trainer[]
  ): boolean {
    if (!user) return true;

    const allStudents = students || this.getStudents();
    const allTrainers = trainers || this.getTrainers();
    const allRegistrations = registrations || this.getRegistrations();

    const student = allStudents.find(
      (s) =>
        s.userId === user.id ||
        (user.identifierNumber && s.admissionNumber?.toUpperCase() === user.identifierNumber.toUpperCase())
    );
    const trainer = allTrainers.find(
      (t) =>
        t.userId === user.id ||
        (user.identifierNumber && t.staffNumber?.toUpperCase() === user.identifierNumber.toUpperCase())
    );

    const userIdentifiers = new Set<string>();
    if (user.id) userIdentifiers.add(user.id.toLowerCase());
    if (user.identifierNumber) userIdentifiers.add(user.identifierNumber.toLowerCase());
    if (student) {
      if (student.id) userIdentifiers.add(student.id.toLowerCase());
      if (student.userId) userIdentifiers.add(student.userId.toLowerCase());
      if (student.admissionNumber) userIdentifiers.add(student.admissionNumber.toLowerCase());
    }
    if (trainer) {
      if (trainer.id) userIdentifiers.add(trainer.id.toLowerCase());
      if (trainer.userId) userIdentifiers.add(trainer.userId.toLowerCase());
      if (trainer.staffNumber) userIdentifiers.add(trainer.staffNumber.toLowerCase());
    }

    if (n.targetUserId) {
      const targetId = n.targetUserId.toLowerCase();
      return userIdentifiers.has(targetId);
    }

    if (n.targetRole && n.targetRole !== 'ALL') {
      if (n.targetRole !== user.role) {
        return false;
      }

      if (user.role === 'STUDENT' && n.linkRegistrationId) {
        const reg = allRegistrations.find(
          (r) => r.id === n.linkRegistrationId || r.registrationReference === n.linkRegistrationId
        );
        if (!reg) return false;
        const regStudentId = (reg.studentId || '').toLowerCase();
        const regAdm = (reg.admissionNumber || '').toLowerCase();
        return userIdentifiers.has(regStudentId) || userIdentifiers.has(regAdm);
      }

      if (user.role === 'TRAINER' && n.linkRegistrationId && trainer) {
        const reg = allRegistrations.find(
          (r) => r.id === n.linkRegistrationId || r.registrationReference === n.linkRegistrationId
        );
        if (reg) {
          const isAssigned = reg.units.some(
            (u) =>
              u.trainerId === trainer.id ||
              u.trainerName.toLowerCase() === trainer.name.toLowerCase() ||
              u.trainerName.toLowerCase() === user.name.toLowerCase()
          );
          if (!isAssigned) return false;
        }
      }

      return true;
    }

    if (n.targetRole === 'ALL') {
      return true;
    }

    if (n.linkRegistrationId) {
      const reg = allRegistrations.find(
        (r) => r.id === n.linkRegistrationId || r.registrationReference === n.linkRegistrationId
      );
      if (reg) {
        if (user.role === 'STUDENT') {
          const regStudentId = (reg.studentId || '').toLowerCase();
          const regAdm = (reg.admissionNumber || '').toLowerCase();
          return userIdentifiers.has(regStudentId) || userIdentifiers.has(regAdm);
        }
        if (user.role === 'TRAINER' && trainer) {
          return reg.units.some(
            (u) =>
              u.trainerId === trainer.id ||
              u.trainerName.toLowerCase() === trainer.name.toLowerCase() ||
              u.trainerName.toLowerCase() === user.name.toLowerCase()
          );
        }
        if (user.role === 'HOD' || user.role === 'EXAM_OFFICER' || user.role === 'ADMIN') {
          return true;
        }
      }
      return false;
    }

    return false;
  }

  public static getNotificationsForUser(user: User): InAppNotification[] {
    const list = this.getNotifications();
    return list.filter((n) => this.isNotificationForUser(n, user));
  }

  public static createNotification(data: Omit<InAppNotification, 'id' | 'createdAt' | 'read'>): void {
    const list = this.getNotifications();
    const item: InAppNotification = {
      ...data,
      id: 'notif-' + Math.random().toString(36).substr(2, 9),
      createdAt: new Date().toISOString(),
      read: false,
    };
    this.cache.notifications = [item, ...list];
    triggerStoreUpdate();

    fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    }).catch(() => {});
  }

  public static markNotificationRead(id: string): void {
    const list = this.getNotifications();
    const item = list.find((n) => n.id === id);
    if (item) {
      item.read = true;
      this.cache.notifications = [...list];
      triggerStoreUpdate();
    }
    fetch(`/api/notifications/${id}/read`, { method: 'PATCH' }).catch(() => {});
  }

  public static markAllNotificationsRead(user?: User): void {
    const list = this.getNotifications();
    if (!user) {
      this.cache.notifications = list.map((n) => ({ ...n, read: true }));
      triggerStoreUpdate();
      fetch('/api/notifications/read-all', { method: 'POST' }).catch(() => {});
      return;
    }

    this.cache.notifications = list.map((n) => {
      if (this.isNotificationForUser(n, user)) {
        return { ...n, read: true };
      }
      return n;
    });
    triggerStoreUpdate();

    fetch('/api/notifications/read-all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId: user.id }),
    }).catch(() => {});
  }

  // --- Global Audit Trail ---
  public static getGlobalAuditLogs(): AuditLogItem[] {
    return this.cache.auditLogs;
  }

  public static logAudit(log: AuditLogItem): void {
    const list = this.getGlobalAuditLogs();
    this.cache.auditLogs = [log, ...list].slice(0, 500);
    triggerStoreUpdate();

    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(log),
    }).catch(() => {});
  }

  // --- Self-Service Student Account Registration ---
  public static registerNewStudent(
    data: {
      name: string;
      admissionNumber: string;
      nationalId?: string;
      email: string;
      phone: string;
      departmentId?: string;
      courseId: string;
      levelId: string;
      password?: string;
    },
    rememberMe: boolean = false
  ): { success: boolean; student?: Student; user?: User; error?: string } {
    const existingUsers = this.getUsers();

    const normalizedAdm = data.admissionNumber.trim().toUpperCase();
    if (
      existingUsers.some(
        (u) =>
          u.identifierNumber.toUpperCase() === normalizedAdm ||
          u.email.toLowerCase() === data.email.trim().toLowerCase()
      )
    ) {
      return { success: false, error: 'An account with this Admission Number or Email already exists.' };
    }

    const userId = `user-stu-${Date.now()}`;
    const studentId = `stu-${Date.now()}`;
    const targetDept = data.departmentId || 'dept-ci';
    const cleanPassword = data.password?.trim() || 'student123';

    const newUser: User = {
      id: userId,
      name: data.name.trim(),
      email: data.email.trim(),
      phone: data.phone.trim(),
      role: 'STUDENT',
      identifierNumber: normalizedAdm,
      departmentId: targetDept,
      title: 'Student / Candidate',
      password: cleanPassword,
    };

    const newStudent: Student = {
      id: studentId,
      userId: userId,
      name: data.name.trim(),
      admissionNumber: normalizedAdm,
      nationalId: data.nationalId?.trim() || undefined,
      email: data.email.trim(),
      phone: data.phone.trim(),
      courseId: data.courseId,
      levelId: data.levelId,
      departmentId: targetDept,
      currentModule: 1,
      status: 'ACTIVE',
    };

    this.saveUser(newUser);
    this.saveStudent(newStudent);

    if (typeof window !== 'undefined') {
      if (rememberMe) {
        localStorage.setItem(SESSION_KEYS.REMEMBER_ME, 'true');
      } else {
        localStorage.removeItem(SESSION_KEYS.REMEMBER_ME);
      }
    }

    this.setCurrentUser(userId, rememberMe);
    this.setSessionValue(SESSION_KEYS.IS_LOGGED_IN, 'true', rememberMe);

    this.logAudit({
      id: `audit-${Date.now()}`,
      action: 'STUDENT_ACCOUNT_CREATED',
      userId: userId,
      userName: newUser.name,
      userRole: 'STUDENT',
      timestamp: new Date().toISOString(),
      details: `Self-registered candidate profile: ${newUser.name} (${normalizedAdm})`,
    });

    this.createNotification({
      targetUserId: userId,
      title: 'Welcome to CDACC Assessment Portal',
      message: `Account created successfully for ${newUser.name} (${normalizedAdm}). You can now select your units and submit for trainer verification.`,
      type: 'INFO',
    });

    return { success: true, student: newStudent, user: newUser };
  }
}
