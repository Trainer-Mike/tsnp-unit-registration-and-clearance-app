import { pgTable, text, timestamp, integer, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  role: text('role').notNull(),
  identifierNumber: text('identifier_number').notNull(),
  departmentId: text('department_id').notNull(),
  avatarUrl: text('avatar_url'),
  signatureDataUrl: text('signature_data_url'),
  title: text('title'),
  password: text('password'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const departments = pgTable('departments', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  hodName: text('hod_name').notNull(),
  hodDesignation: text('hod_designation').notNull(),
  hodEmail: text('hod_email').notNull(),
});

export const levels = pgTable('levels', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description').notNull(),
});

export const courses = pgTable('courses', {
  id: text('id').primaryKey(),
  code: text('code').notNull(),
  name: text('name').notNull(),
  departmentId: text('department_id').notNull(),
  levelId: text('level_id').notNull(),
  durationSemesters: integer('duration_semesters').default(6),
});

export const unitCategories = pgTable('unit_categories', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  code: text('code').notNull(),
  description: text('description'),
  badgeColor: text('badge_color'),
  defaultAmount: integer('default_amount').default(1500),
});

export const units = pgTable('units', {
  id: text('id').primaryKey(),
  unitCode: text('unit_code').notNull(),
  unitName: text('unit_name').notNull(),
  category: text('category').notNull(),
  courseId: text('course_id').notNull(),
  levelId: text('level_id').notNull(),
  amountCharged: integer('amount_charged').notNull(),
  defaultTrainerId: text('default_trainer_id').notNull(),
  description: text('description'),
  prerequisites: jsonb('prerequisites'),
  status: text('status').notNull().default('ACTIVE'),
});

export const trainers = pgTable('trainers', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  staffNumber: text('staff_number').notNull(),
  departmentId: text('department_id').notNull(),
  phone: text('phone').notNull(),
  specialization: text('specialization').notNull(),
  signatureDataUrl: text('signature_data_url'),
  password: text('password'),
});

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull(),
  admissionNumber: text('admission_number').notNull(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  courseId: text('course_id').notNull(),
  levelId: text('level_id').notNull(),
  departmentId: text('department_id').notNull(),
  nationalId: text('national_id'),
  currentModule: text('current_module').notNull().default('1'),
  currentYearOfStudy: text('current_year_of_study').default('1'),
  status: text('status').notNull().default('ACTIVE'),
});

export const assessmentSeries = pgTable('assessment_series', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  year: text('year').notNull(),
  openingDate: text('opening_date').notNull(),
  closingDate: text('closing_date').notNull(),
  status: text('status').notNull().default('ACTIVE'),
});

export const registrations = pgTable('registrations', {
  id: text('id').primaryKey(),
  registrationReference: text('registration_reference').notNull(),
  studentId: text('student_id').notNull(),
  studentName: text('student_name').notNull(),
  admissionNumber: text('admission_number').notNull(),
  courseId: text('course_id').notNull(),
  courseName: text('course_name').notNull(),
  courseCode: text('course_code').notNull(),
  levelId: text('level_id').notNull(),
  levelName: text('level_name').notNull(),
  departmentId: text('department_id').notNull(),
  departmentName: text('department_name').notNull(),
  assessmentSeriesId: text('assessment_series_id').notNull(),
  assessmentSeriesName: text('assessment_series_name').notNull(),
  year: text('year').notNull(),
  module: text('module'),
  units: jsonb('units').notNull(),
  totalAmount: integer('total_amount').notNull(),
  status: text('status').notNull().default('SUBMITTED'),
  submittedAt: text('submitted_at').notNull(),
  lastUpdatedAt: text('last_updated_at').notNull(),
  hodApproval: jsonb('hod_approval'),
  examOfficeReceipt: jsonb('exam_office_receipt'),
  rejectionReason: text('rejection_reason'),
  correctionComment: text('correction_comment'),
  resubmissionCount: integer('resubmission_count').default(0),
  auditLogs: jsonb('audit_logs'),
});

export const notifications = pgTable('notifications', {
  id: text('id').primaryKey(),
  targetUserId: text('target_user_id'),
  targetRole: text('target_role'),
  title: text('title').notNull(),
  message: text('message').notNull(),
  type: text('type').notNull().default('INFO'),
  read: boolean('read').default(false),
  createdAt: text('created_at').notNull(),
  linkRegistrationId: text('link_registration_id'),
});

export const institutionConfig = pgTable('institution_config', {
  id: text('id').primaryKey().default('default_config'),
  data: jsonb('data').notNull(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const auditLogsGlobal = pgTable('audit_logs_global', {
  id: text('id').primaryKey(),
  timestamp: text('timestamp').notNull(),
  userId: text('user_id').notNull(),
  userName: text('user_name').notNull(),
  userRole: text('user_role').notNull(),
  action: text('action').notNull(),
  details: text('details').notNull(),
  previousStatus: text('previous_status'),
  newStatus: text('new_status'),
  ipAddress: text('ip_address'),
});
