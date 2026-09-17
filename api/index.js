var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server.ts
import express from "express";
import path from "path";
import dotenv from "dotenv";

// src/db/index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { sql } from "drizzle-orm";

// src/db/schema.ts
var schema_exports = {};
__export(schema_exports, {
  assessmentSeries: () => assessmentSeries,
  auditLogsGlobal: () => auditLogsGlobal,
  courses: () => courses,
  departments: () => departments,
  institutionConfig: () => institutionConfig,
  levels: () => levels,
  notifications: () => notifications,
  registrations: () => registrations,
  students: () => students,
  trainers: () => trainers,
  unitCategories: () => unitCategories,
  units: () => units,
  users: () => users
});
import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
var users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  role: text("role").notNull(),
  identifierNumber: text("identifier_number").notNull(),
  departmentId: text("department_id").notNull(),
  avatarUrl: text("avatar_url"),
  signatureDataUrl: text("signature_data_url"),
  title: text("title"),
  password: text("password"),
  createdAt: timestamp("created_at").defaultNow()
});
var departments = pgTable("departments", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  hodName: text("hod_name").notNull(),
  hodDesignation: text("hod_designation").notNull(),
  hodEmail: text("hod_email").notNull()
});
var levels = pgTable("levels", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description").notNull()
});
var courses = pgTable("courses", {
  id: text("id").primaryKey(),
  code: text("code").notNull(),
  name: text("name").notNull(),
  departmentId: text("department_id").notNull(),
  levelId: text("level_id").notNull(),
  durationSemesters: integer("duration_semesters").default(6)
});
var unitCategories = pgTable("unit_categories", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull(),
  description: text("description"),
  badgeColor: text("badge_color"),
  defaultAmount: integer("default_amount").default(1500)
});
var units = pgTable("units", {
  id: text("id").primaryKey(),
  unitCode: text("unit_code").notNull(),
  unitName: text("unit_name").notNull(),
  category: text("category").notNull(),
  courseId: text("course_id").notNull(),
  levelId: text("level_id").notNull(),
  amountCharged: integer("amount_charged").notNull(),
  defaultTrainerId: text("default_trainer_id").notNull(),
  description: text("description"),
  prerequisites: jsonb("prerequisites"),
  status: text("status").notNull().default("ACTIVE")
});
var trainers = pgTable("trainers", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  staffNumber: text("staff_number").notNull(),
  departmentId: text("department_id").notNull(),
  phone: text("phone").notNull(),
  specialization: text("specialization").notNull(),
  signatureDataUrl: text("signature_data_url"),
  password: text("password")
});
var students = pgTable("students", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  admissionNumber: text("admission_number").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  courseId: text("course_id").notNull(),
  levelId: text("level_id").notNull(),
  departmentId: text("department_id").notNull(),
  nationalId: text("national_id"),
  currentModule: text("current_module").notNull().default("1"),
  currentYearOfStudy: text("current_year_of_study").default("1"),
  status: text("status").notNull().default("ACTIVE")
});
var assessmentSeries = pgTable("assessment_series", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  openingDate: text("opening_date").notNull(),
  closingDate: text("closing_date").notNull(),
  status: text("status").notNull().default("ACTIVE")
});
var registrations = pgTable("registrations", {
  id: text("id").primaryKey(),
  registrationReference: text("registration_reference").notNull(),
  studentId: text("student_id").notNull(),
  studentName: text("student_name").notNull(),
  admissionNumber: text("admission_number").notNull(),
  courseId: text("course_id").notNull(),
  courseName: text("course_name").notNull(),
  courseCode: text("course_code").notNull(),
  levelId: text("level_id").notNull(),
  levelName: text("level_name").notNull(),
  departmentId: text("department_id").notNull(),
  departmentName: text("department_name").notNull(),
  assessmentSeriesId: text("assessment_series_id").notNull(),
  assessmentSeriesName: text("assessment_series_name").notNull(),
  year: text("year").notNull(),
  module: text("module"),
  units: jsonb("units").notNull(),
  totalAmount: integer("total_amount").notNull(),
  status: text("status").notNull().default("SUBMITTED"),
  submittedAt: text("submitted_at").notNull(),
  lastUpdatedAt: text("last_updated_at").notNull(),
  hodApproval: jsonb("hod_approval"),
  examOfficeReceipt: jsonb("exam_office_receipt"),
  rejectionReason: text("rejection_reason"),
  correctionComment: text("correction_comment"),
  resubmissionCount: integer("resubmission_count").default(0),
  auditLogs: jsonb("audit_logs")
});
var notifications = pgTable("notifications", {
  id: text("id").primaryKey(),
  targetUserId: text("target_user_id"),
  targetRole: text("target_role"),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull().default("INFO"),
  read: boolean("read").default(false),
  createdAt: text("created_at").notNull(),
  linkRegistrationId: text("link_registration_id")
});
var institutionConfig = pgTable("institution_config", {
  id: text("id").primaryKey().default("default_config"),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at").defaultNow()
});
var auditLogsGlobal = pgTable("audit_logs_global", {
  id: text("id").primaryKey(),
  timestamp: text("timestamp").notNull(),
  userId: text("user_id").notNull(),
  userName: text("user_name").notNull(),
  userRole: text("user_role").notNull(),
  action: text("action").notNull(),
  details: text("details").notNull(),
  previousStatus: text("previous_status"),
  newStatus: text("new_status"),
  ipAddress: text("ip_address")
});

// src/services/demoData.ts
var INITIAL_UNIT_CATEGORIES = [
  { id: "cat-core", name: "Core", code: "CR", description: "Core Competency Units of Learning", badgeColor: "purple", defaultAmount: 2500 },
  { id: "cat-common", name: "Common", code: "CC", description: "Common Broad Vocational Competencies", badgeColor: "blue", defaultAmount: 1800 },
  { id: "cat-basic", name: "Basic", code: "BC", description: "Basic Foundational Competencies", badgeColor: "slate", defaultAmount: 1200 },
  { id: "cat-elective", name: "Elective", code: "EL", description: "Specialized Elective Competencies", badgeColor: "emerald", defaultAmount: 2e3 },
  { id: "cat-practical", name: "Practical", code: "PR", description: "Workshop & Laboratory Practical Competencies", badgeColor: "amber", defaultAmount: 3e3 }
];
var INITIAL_INSTITUTION_CONFIG = {
  institutionName: "THE SHAMBERERE NATIONAL POLYTECHNIC",
  departmentName: "DEPARTMENT OF COMPUTING AND INFORMATICS",
  formReference: "TSNP/CI/URF/006",
  postalAddress: "P.O. BOX 1316-50100, Kakamega",
  email: "info@shambererenationalpoly.ac.ke",
  altEmail: "shambereretti@yahoo.com",
  phone: "0739-922-223",
  website: "www.shambererenationalpoly.ac.ke",
  hodDesignation: "Head of Department - Computing & Informatics",
  defaultCurrency: "KES",
  currentAcademicYear: "2026",
  autoRoutingEnabled: true,
  allowPartialApproval: false,
  maxUnitsPerRegistration: 10,
  requireSignatures: true,
  reassessmentFee: 2e3
};
var INITIAL_DEPARTMENTS = [
  {
    id: "dept-ci",
    name: "Department of Computing and Informatics",
    code: "CI",
    hodName: "Dr. Kennedy Musumba",
    hodDesignation: "Head of Department",
    hodEmail: "hod.computing@shambererenationalpoly.ac.ke"
  },
  {
    id: "dept-eng",
    name: "Department of Electrical & Electronic Engineering",
    code: "EEE",
    hodName: "Eng. Patrick Wekesa",
    hodDesignation: "Head of Department",
    hodEmail: "hod.electrical@shambererenationalpoly.ac.ke"
  },
  {
    id: "dept-biz",
    name: "Department of Business Studies",
    code: "BS",
    hodName: "Mrs. Judith Omwamba",
    hodDesignation: "Head of Department",
    hodEmail: "hod.business@shambererenationalpoly.ac.ke"
  }
];
var INITIAL_LEVELS = [
  { id: "lvl-6", name: "Level 6 (Diploma)", code: "LEVEL 6", description: "Diploma Qualification Framework" },
  { id: "lvl-5", name: "Level 5 (Certificate)", code: "LEVEL 5", description: "Craft Certificate Qualification" },
  { id: "lvl-4", name: "Level 4 (Artisan)", code: "LEVEL 4", description: "Artisan Vocational Qualification" }
];
var INITIAL_COURSES = [
  {
    id: "course-dict",
    code: "DICT",
    name: "Diploma in Information Communication Technology",
    departmentId: "dept-ci",
    levelId: "lvl-6",
    durationSemesters: 6
  },
  {
    id: "course-dcs",
    code: "DCS",
    name: "Diploma in Computer Science & Software Engineering",
    departmentId: "dept-ci",
    levelId: "lvl-6",
    durationSemesters: 6
  },
  {
    id: "course-cit",
    code: "CIT",
    name: "Certificate in Information Technology",
    departmentId: "dept-ci",
    levelId: "lvl-5",
    durationSemesters: 4
  },
  {
    id: "course-art",
    code: "ACA",
    name: "Artisan Certificate in Computer Applications",
    departmentId: "dept-ci",
    levelId: "lvl-4",
    durationSemesters: 2
  }
];
var INITIAL_TRAINERS = [
  {
    id: "tr-mike",
    userId: "user-tr-mike",
    name: "Mr. Mike Trainer",
    email: "miketrainer051@gmail.com",
    staffNumber: "TSNP/TR/051",
    departmentId: "dept-ci",
    phone: "0700-051-051",
    specialization: "Web Applications, Mobile Development & Cloud Solutions"
  },
  {
    id: "tr-01",
    userId: "user-tr-01",
    name: "Mr. Moses Wanjala",
    email: "m.wanjala@shambererenationalpoly.ac.ke",
    staffNumber: "TSNP/TR/084",
    departmentId: "dept-ci",
    phone: "0712-345-678",
    specialization: "Computer Networks, Web Development & Hardware Maintenance"
  },
  {
    id: "tr-02",
    userId: "user-tr-02",
    name: "Ms. Faith Chebet",
    email: "f.chebet@shambererenationalpoly.ac.ke",
    staffNumber: "TSNP/TR/112",
    departmentId: "dept-ci",
    phone: "0723-456-789",
    specialization: "Database Systems, OOP & Data Structures"
  },
  {
    id: "tr-03",
    userId: "user-tr-03",
    name: "Mr. Geoffrey Omondi",
    email: "g.omondi@shambererenationalpoly.ac.ke",
    staffNumber: "TSNP/TR/095",
    departmentId: "dept-ci",
    phone: "0734-567-890",
    specialization: "Digital Literacy, Communication Skills & Entrepreneurship"
  },
  {
    id: "tr-04",
    userId: "user-tr-04",
    name: "Mrs. Everline Makokha",
    email: "e.makokha@shambererenationalpoly.ac.ke",
    staffNumber: "TSNP/TR/130",
    departmentId: "dept-ci",
    phone: "0745-678-901",
    specialization: "System Analysis, Cybersecurity & Cloud Computing"
  }
];
var INITIAL_UNITS = [
  {
    id: "unit-01",
    unitCode: "ICT/CU/IT/BC/01/6/A",
    unitName: "Demonstrate Communication Skills",
    category: "Basic",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 1200,
    defaultTrainerId: "tr-03",
    description: "Oral, written, non-verbal communication and reporting in ICT enterprise",
    status: "ACTIVE"
  },
  {
    id: "unit-02",
    unitCode: "ICT/CU/IT/BC/02/6/A",
    unitName: "Demonstrate Digital Literacy",
    category: "Basic",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 1200,
    defaultTrainerId: "tr-03",
    description: "Operating systems, office suites, digital productivity tools and cloud storage",
    status: "ACTIVE"
  },
  {
    id: "unit-03",
    unitCode: "ICT/CU/IT/BC/03/6/A",
    unitName: "Demonstrate Entrepreneurship Skills",
    category: "Basic",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 1200,
    defaultTrainerId: "tr-03",
    description: "Business opportunity identification, financial planning and venture management",
    status: "ACTIVE"
  },
  {
    id: "unit-04",
    unitCode: "ICT/CU/IT/CC/01/6/A",
    unitName: "Apply Computer Networks Concepts",
    category: "Common",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 1800,
    defaultTrainerId: "tr-01",
    description: "LAN/WAN architecture, TCP/IP subnetting, cabling, switches and routers setup",
    status: "ACTIVE"
  },
  {
    id: "unit-05",
    unitCode: "ICT/CU/IT/CC/02/6/A",
    unitName: "Apply Database Management Systems",
    category: "Common",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 1800,
    defaultTrainerId: "tr-02",
    description: "Relational database design, ER modeling, SQL querying and normalization",
    status: "ACTIVE"
  },
  {
    id: "unit-06",
    unitCode: "ICT/CU/IT/CR/01/6/A",
    unitName: "Develop Web Applications",
    category: "Core",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 2500,
    defaultTrainerId: "tr-mike",
    description: "HTML5, CSS3, JavaScript, server-side frameworks and database integration",
    status: "ACTIVE"
  },
  {
    id: "unit-07",
    unitCode: "ICT/CU/IT/CR/02/6/A",
    unitName: "Develop Object Oriented Programs",
    category: "Core",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 2500,
    defaultTrainerId: "tr-02",
    description: "Classes, encapsulation, inheritance, polymorphism, Java/C# applications",
    status: "ACTIVE"
  },
  {
    id: "unit-08",
    unitCode: "ICT/CU/IT/CR/03/6/A",
    unitName: "Perform System Analysis and Design",
    category: "Core",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 2500,
    defaultTrainerId: "tr-04",
    description: "SDLC methodologies, UML modeling, requirements engineering and UI design",
    status: "ACTIVE"
  },
  {
    id: "unit-09",
    unitCode: "ICT/CU/IT/CR/04/6/A",
    unitName: "Install & Maintain Computer Hardware",
    category: "Core",
    courseId: "course-dict",
    levelId: "lvl-6",
    amountCharged: 2200,
    defaultTrainerId: "tr-01",
    description: "PC assembly, troubleshooting, BIOS setup, peripheral devices and preventative servicing",
    status: "ACTIVE"
  },
  // Certificate Units
  {
    id: "unit-cit-01",
    unitCode: "ICT/CU/IT/BC/01/5/A",
    unitName: "Demonstrate Communication Skills (Cert)",
    category: "Basic",
    courseId: "course-cit",
    levelId: "lvl-5",
    amountCharged: 1e3,
    defaultTrainerId: "tr-03",
    status: "ACTIVE"
  },
  {
    id: "unit-cit-02",
    unitCode: "ICT/CU/IT/CC/01/5/A",
    unitName: "Computer Maintenance and Troubleshooting",
    category: "Common",
    courseId: "course-cit",
    levelId: "lvl-5",
    amountCharged: 1500,
    defaultTrainerId: "tr-01",
    status: "ACTIVE"
  },
  {
    id: "unit-cit-03",
    unitCode: "ICT/CU/IT/CR/01/5/A",
    unitName: "Computer Applications Support",
    category: "Core",
    courseId: "course-cit",
    levelId: "lvl-5",
    amountCharged: 1800,
    defaultTrainerId: "tr-02",
    status: "ACTIVE"
  }
];
var INITIAL_ASSESSMENT_SERIES = [
  {
    id: "series-2026-nov",
    name: "NOVEMBER/DECEMBER 2026 SERIES",
    year: "2026",
    openingDate: "2026-08-01",
    closingDate: "2026-12-20",
    status: "ACTIVE"
  },
  {
    id: "series-2026-july",
    name: "JULY/AUGUST 2026 SERIES",
    year: "2026",
    openingDate: "2026-05-01",
    closingDate: "2026-08-30",
    status: "CLOSED"
  },
  {
    id: "series-2027-march",
    name: "MARCH/APRIL 2027 SERIES",
    year: "2027",
    openingDate: "2027-01-15",
    closingDate: "2027-04-10",
    status: "UPCOMING"
  }
];
var INITIAL_USERS = [
  // Student 1
  {
    id: "user-stu-01",
    name: "Emmanuel Barasa",
    email: "e.barasa@students.shambererenationalpoly.ac.ke",
    phone: "0711-223-344",
    role: "STUDENT",
    identifierNumber: "TSNP/DICT/2024/0482",
    departmentId: "dept-ci",
    title: "Level 6 Student",
    password: "student123"
  },
  // Student 2
  {
    id: "user-stu-02",
    name: "Mercy Nekesa",
    email: "m.nekesa@students.shambererenationalpoly.ac.ke",
    phone: "0722-334-455",
    role: "STUDENT",
    identifierNumber: "TSNP/DICT/2024/0519",
    departmentId: "dept-ci",
    title: "Level 6 Student",
    password: "student123"
  },
  // Student 3
  {
    id: "user-stu-03",
    name: "Brian Kipruto",
    email: "b.kipruto@students.shambererenationalpoly.ac.ke",
    phone: "0733-445-566",
    role: "STUDENT",
    identifierNumber: "TSNP/CIT/2025/0114",
    departmentId: "dept-ci",
    title: "Level 5 Student",
    password: "student123"
  },
  // Student 4 (Earlier Trainee Cohort - Cycle 1)
  {
    id: "user-stu-04",
    name: "Johnstone Makokha",
    email: "j.makokha@students.shambererenationalpoly.ac.ke",
    phone: "0714-998-877",
    role: "STUDENT",
    identifierNumber: "TSNP/DICT/2023/0019",
    departmentId: "dept-ci",
    title: "Cycle 1 Trainee (Earlier Cohort)",
    password: "student123"
  },
  // Student 5 (Earlier Trainee Cohort - Cycle 2)
  {
    id: "user-stu-05",
    name: "Grace Nyambura",
    email: "g.nyambura@students.shambererenationalpoly.ac.ke",
    phone: "0725-112-233",
    role: "STUDENT",
    identifierNumber: "TSNP/CIT/2023/0045",
    departmentId: "dept-ci",
    title: "Cycle 2 Trainee (Earlier Cohort)",
    password: "student123"
  },
  // Trainer: Mike Trainer (miketrainer051@gmail.com)
  {
    id: "user-tr-mike",
    name: "Mr. Mike Trainer",
    email: "miketrainer051@gmail.com",
    phone: "0700-051-051",
    role: "TRAINER",
    identifierNumber: "TSNP/TR/051",
    departmentId: "dept-ci",
    title: "Trainer (Web Applications & Systems)",
    password: "trainer123"
  },
  // Trainer 1: Moses Wanjala
  {
    id: "user-tr-01",
    name: "Mr. Moses Wanjala",
    email: "m.wanjala@shambererenationalpoly.ac.ke",
    phone: "0712-345-678",
    role: "TRAINER",
    identifierNumber: "TSNP/TR/084",
    departmentId: "dept-ci",
    title: "Senior ICT Trainer",
    password: "trainer123"
  },
  // Trainer 2: Faith Chebet
  {
    id: "user-tr-02",
    name: "Ms. Faith Chebet",
    email: "f.chebet@shambererenationalpoly.ac.ke",
    phone: "0723-456-789",
    role: "TRAINER",
    identifierNumber: "TSNP/TR/112",
    departmentId: "dept-ci",
    title: "Trainer (Software & Databases)",
    password: "trainer123"
  },
  // Trainer 3: Geoffrey Omondi
  {
    id: "user-tr-03",
    name: "Mr. Geoffrey Omondi",
    email: "g.omondi@shambererenationalpoly.ac.ke",
    phone: "0734-567-890",
    role: "TRAINER",
    identifierNumber: "TSNP/TR/095",
    departmentId: "dept-ci",
    title: "Trainer (Basic & Digital Skills)",
    password: "trainer123"
  },
  // Trainer 4: Everline Makokha
  {
    id: "user-tr-04",
    name: "Mrs. Everline Makokha",
    email: "e.makokha@shambererenationalpoly.ac.ke",
    phone: "0745-678-901",
    role: "TRAINER",
    identifierNumber: "TSNP/TR/130",
    departmentId: "dept-ci",
    title: "Trainer (System Analysis)",
    password: "trainer123"
  },
  // HOD: Dr. Kennedy Musumba
  {
    id: "user-hod-01",
    name: "Dr. Kennedy Musumba",
    email: "hod.computing@shambererenationalpoly.ac.ke",
    phone: "0799-887-766",
    role: "HOD",
    identifierNumber: "TSNP/HOD/012",
    departmentId: "dept-ci",
    title: "Head of Department, Computing & Informatics",
    password: "hod123"
  },
  // Examinations Officer: Beatrice Agutu
  {
    id: "user-exam-01",
    name: "Mrs. Beatrice Agutu",
    email: "exams@shambererenationalpoly.ac.ke",
    phone: "0788-776-655",
    role: "EXAM_OFFICER",
    identifierNumber: "TSNP/EXAM/004",
    departmentId: "dept-ci",
    title: "Senior Examinations Officer",
    password: "exam123"
  },
  // System Admin
  {
    id: "user-adm-01",
    name: "Eng. David Shikuku",
    email: "admin.ict@shambererenationalpoly.ac.ke",
    phone: "0777-665-544",
    role: "ADMIN",
    identifierNumber: "TSNP/ADM/001",
    departmentId: "dept-ci",
    title: "Principal ICT Systems Administrator",
    password: "admin123"
  }
];
var INITIAL_STUDENTS = [
  {
    id: "stu-01",
    userId: "user-stu-01",
    admissionNumber: "TSNP/DICT/2024/0482",
    name: "Emmanuel Barasa",
    email: "e.barasa@students.shambererenationalpoly.ac.ke",
    phone: "0711-223-344",
    courseId: "course-dict",
    levelId: "lvl-6",
    departmentId: "dept-ci",
    nationalId: "38942150",
    currentModule: 2,
    status: "ACTIVE"
  },
  {
    id: "stu-02",
    userId: "user-stu-02",
    admissionNumber: "TSNP/DICT/2024/0519",
    name: "Mercy Nekesa",
    email: "m.nekesa@students.shambererenationalpoly.ac.ke",
    phone: "0722-334-455",
    courseId: "course-dict",
    levelId: "lvl-6",
    departmentId: "dept-ci",
    nationalId: "39218471",
    currentModule: 2,
    status: "ACTIVE"
  },
  {
    id: "stu-03",
    userId: "user-stu-03",
    admissionNumber: "TSNP/CIT/2025/0114",
    name: "Brian Kipruto",
    email: "b.kipruto@students.shambererenationalpoly.ac.ke",
    phone: "0733-445-566",
    courseId: "course-cit",
    levelId: "lvl-5",
    departmentId: "dept-ci",
    nationalId: "40192834",
    currentModule: 1,
    status: "ACTIVE"
  },
  {
    id: "stu-04",
    userId: "user-stu-04",
    admissionNumber: "TSNP/DICT/2023/0019",
    name: "Johnstone Makokha",
    email: "j.makokha@students.shambererenationalpoly.ac.ke",
    phone: "0714-998-877",
    courseId: "course-dict",
    levelId: "lvl-6",
    departmentId: "dept-ci",
    nationalId: "36881920",
    currentModule: "Cycle 1",
    status: "ACTIVE"
  },
  {
    id: "stu-05",
    userId: "user-stu-05",
    admissionNumber: "TSNP/CIT/2023/0045",
    name: "Grace Nyambura",
    email: "g.nyambura@students.shambererenationalpoly.ac.ke",
    phone: "0725-112-233",
    courseId: "course-cit",
    levelId: "lvl-5",
    departmentId: "dept-ci",
    nationalId: "37901824",
    currentModule: "Cycle 2",
    status: "ACTIVE"
  }
];
var INITIAL_REGISTRATIONS = [
  // 1. Fully APPROVED Registration (Ready for Print / Download with Official Form matching TSNP/CI/URF/006)
  {
    id: "reg-001",
    registrationReference: "UR-2026-000142",
    studentId: "stu-01",
    studentName: "Emmanuel Barasa",
    admissionNumber: "TSNP/DICT/2024/0482",
    courseId: "course-dict",
    courseName: "Diploma in Information Communication Technology",
    courseCode: "DICT",
    levelId: "lvl-6",
    levelName: "LEVEL 6",
    departmentId: "dept-ci",
    departmentName: "DEPARTMENT OF COMPUTING AND INFORMATICS",
    assessmentSeriesId: "series-2026-nov",
    assessmentSeriesName: "NOVEMBER/DECEMBER 2026 SERIES",
    year: "2026",
    module: 2,
    totalAmount: 12900,
    status: "APPROVED",
    submittedAt: "2026-06-10T09:30:00Z",
    lastUpdatedAt: "2026-06-12T14:45:00Z",
    units: [
      {
        id: "ru-01",
        unitId: "unit-01",
        unitCode: "ICT/CU/IT/BC/01/6/A",
        unitName: "Demonstrate Communication Skills",
        category: "Basic",
        amountCharged: 1200,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-11T10:15:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Satisfies class attendance and practical presentations requirement.",
        signatureRef: "TSNP-VER-OMONDI-9021"
      },
      {
        id: "ru-02",
        unitId: "unit-02",
        unitCode: "ICT/CU/IT/BC/02/6/A",
        unitName: "Demonstrate Digital Literacy",
        category: "Basic",
        amountCharged: 1200,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-11T10:18:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Continuous assessment tests completed.",
        signatureRef: "TSNP-VER-OMONDI-9022"
      },
      {
        id: "ru-03",
        unitId: "unit-03",
        unitCode: "ICT/CU/IT/BC/03/6/A",
        unitName: "Demonstrate Entrepreneurship Skills",
        category: "Basic",
        amountCharged: 1200,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-11T10:20:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Business plan proposal submitted.",
        signatureRef: "TSNP-VER-OMONDI-9023"
      },
      {
        id: "ru-04",
        unitId: "unit-04",
        unitCode: "ICT/CU/IT/CC/01/6/A",
        unitName: "Apply Computer Networks Concepts",
        category: "Common",
        amountCharged: 1800,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "APPROVED",
        verifiedAt: "2026-06-11T11:45:00Z",
        verifiedByTrainerName: "Mr. Moses Wanjala",
        decisionComment: "Cisco Packet Tracer lab practicals verified.",
        signatureRef: "TSNP-VER-WANJALA-4410"
      },
      {
        id: "ru-05",
        unitId: "unit-05",
        unitCode: "ICT/CU/IT/CC/02/6/A",
        unitName: "Apply Database Management Systems",
        category: "Common",
        amountCharged: 1800,
        trainerId: "tr-02",
        trainerName: "Ms. Faith Chebet",
        status: "APPROVED",
        verifiedAt: "2026-06-11T14:30:00Z",
        verifiedByTrainerName: "Ms. Faith Chebet",
        decisionComment: "MySQL practical project cleared.",
        signatureRef: "TSNP-VER-CHEBET-8812"
      },
      {
        id: "ru-06",
        unitId: "unit-06",
        unitCode: "ICT/CU/IT/CR/01/6/A",
        unitName: "Develop Web Applications",
        category: "Core",
        amountCharged: 2500,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "APPROVED",
        verifiedAt: "2026-06-11T11:50:00Z",
        verifiedByTrainerName: "Mr. Moses Wanjala",
        decisionComment: "Portfolio website and backend portal hosted and inspected.",
        signatureRef: "TSNP-VER-WANJALA-4411"
      },
      {
        id: "ru-07",
        unitId: "unit-07",
        unitCode: "ICT/CU/IT/CR/02/6/A",
        unitName: "Develop Object Oriented Programs",
        category: "Core",
        amountCharged: 2500,
        trainerId: "tr-02",
        trainerName: "Ms. Faith Chebet",
        status: "APPROVED",
        verifiedAt: "2026-06-11T14:35:00Z",
        verifiedByTrainerName: "Ms. Faith Chebet",
        decisionComment: "Java OOP final coursework submitted.",
        signatureRef: "TSNP-VER-CHEBET-8813"
      }
    ],
    hodApproval: {
      hodId: "user-hod-01",
      hodName: "Dr. Kennedy Musumba",
      designation: "Head of Department, Computing & Informatics",
      decision: "APPROVED",
      comments: "All 7 CDACC Assessment Units verified by respective subject trainers. Candidate eligible for July/August 2026 Series.",
      approvedAt: "2026-06-12T14:45:00Z",
      approvalRef: "TSNP/CI/APP/2026/0482"
    },
    resubmissionCount: 0,
    auditLogs: [
      {
        id: "log-01",
        timestamp: "2026-06-10T09:30:00Z",
        userId: "user-stu-01",
        userName: "Emmanuel Barasa",
        userRole: "STUDENT",
        action: "SUBMIT_REGISTRATION",
        details: "Submitted registration with 7 units for July/August 2026 Series.",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED"
      },
      {
        id: "log-02",
        timestamp: "2026-06-11T10:20:00Z",
        userId: "user-tr-03",
        userName: "Mr. Geoffrey Omondi",
        userRole: "TRAINER",
        action: "VERIFY_UNITS",
        details: "Approved units: BC/01, BC/02, BC/03.",
        previousStatus: "SUBMITTED",
        newStatus: "PARTIALLY_VERIFIED"
      },
      {
        id: "log-03",
        timestamp: "2026-06-11T11:50:00Z",
        userId: "user-tr-01",
        userName: "Mr. Moses Wanjala",
        userRole: "TRAINER",
        action: "VERIFY_UNITS",
        details: "Approved units: CC/01, CR/01."
      },
      {
        id: "log-04",
        timestamp: "2026-06-11T14:35:00Z",
        userId: "user-tr-02",
        userName: "Ms. Faith Chebet",
        userRole: "TRAINER",
        action: "VERIFY_UNITS",
        details: "Approved units: CC/02, CR/02. All units verified.",
        previousStatus: "PARTIALLY_VERIFIED",
        newStatus: "AWAITING_HOD_APPROVAL"
      },
      {
        id: "log-05",
        timestamp: "2026-06-12T14:45:00Z",
        userId: "user-hod-01",
        userName: "Dr. Kennedy Musumba",
        userRole: "HOD",
        action: "HOD_APPROVE",
        details: "Granted departmental clearance and digital signature.",
        previousStatus: "AWAITING_HOD_APPROVAL",
        newStatus: "APPROVED"
      }
    ]
  },
  // 2. Multi-Trainer In-Progress (Mercy Nekesa: some verified, some pending)
  {
    id: "reg-002",
    registrationReference: "UR-2026-000143",
    studentId: "stu-02",
    studentName: "Mercy Nekesa",
    admissionNumber: "TSNP/DICT/2024/0519",
    courseId: "course-dict",
    courseName: "Diploma in Information Communication Technology",
    courseCode: "DICT",
    levelId: "lvl-6",
    levelName: "LEVEL 6",
    departmentId: "dept-ci",
    departmentName: "DEPARTMENT OF COMPUTING AND INFORMATICS",
    assessmentSeriesId: "series-2026-nov",
    assessmentSeriesName: "NOVEMBER/DECEMBER 2026 SERIES",
    year: "2026",
    totalAmount: 9800,
    status: "PARTIALLY_VERIFIED",
    submittedAt: "2026-06-14T08:15:00Z",
    lastUpdatedAt: "2026-06-14T11:00:00Z",
    units: [
      {
        id: "ru-11",
        unitId: "unit-01",
        unitCode: "ICT/CU/IT/BC/01/6/A",
        unitName: "Demonstrate Communication Skills",
        category: "Basic",
        amountCharged: 1200,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-14T10:00:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Eligible and completed communication portfolio.",
        signatureRef: "TSNP-VER-OMONDI-9104"
      },
      {
        id: "ru-12",
        unitId: "unit-04",
        unitCode: "ICT/CU/IT/CC/01/6/A",
        unitName: "Apply Computer Networks Concepts",
        category: "Common",
        amountCharged: 1800,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "PENDING"
      },
      {
        id: "ru-13",
        unitId: "unit-05",
        unitCode: "ICT/CU/IT/CC/02/6/A",
        unitName: "Apply Database Management Systems",
        category: "Common",
        amountCharged: 1800,
        trainerId: "tr-02",
        trainerName: "Ms. Faith Chebet",
        status: "PENDING"
      },
      {
        id: "ru-14",
        unitId: "unit-06",
        unitCode: "ICT/CU/IT/CR/01/6/A",
        unitName: "Develop Web Applications",
        category: "Core",
        amountCharged: 2500,
        trainerId: "tr-mike",
        trainerName: "Mr. Mike Trainer",
        status: "PENDING"
      },
      {
        id: "ru-15",
        unitId: "unit-07",
        unitCode: "ICT/CU/IT/CR/02/6/A",
        unitName: "Develop Object Oriented Programs",
        category: "Core",
        amountCharged: 2500,
        trainerId: "tr-02",
        trainerName: "Ms. Faith Chebet",
        status: "PENDING"
      }
    ],
    resubmissionCount: 0,
    auditLogs: [
      {
        id: "log-11",
        timestamp: "2026-06-14T08:15:00Z",
        userId: "user-stu-02",
        userName: "Mercy Nekesa",
        userRole: "STUDENT",
        action: "SUBMIT_REGISTRATION",
        details: "Submitted registration for 5 units in July/August 2026 Series.",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED"
      },
      {
        id: "log-12",
        timestamp: "2026-06-14T10:00:00Z",
        userId: "user-tr-03",
        userName: "Mr. Geoffrey Omondi",
        userRole: "TRAINER",
        action: "VERIFY_UNITS",
        details: "Approved unit BC/01.",
        previousStatus: "SUBMITTED",
        newStatus: "PARTIALLY_VERIFIED"
      }
    ]
  },
  // 3. Awaiting HOD Approval (Brian Kipruto - all 3 units verified by trainers)
  {
    id: "reg-003",
    registrationReference: "UR-2026-000144",
    studentId: "stu-03",
    studentName: "Brian Kipruto",
    admissionNumber: "TSNP/CIT/2025/0114",
    courseId: "course-cit",
    courseName: "Certificate in Information Technology",
    courseCode: "CIT",
    levelId: "lvl-5",
    levelName: "LEVEL 5",
    departmentId: "dept-ci",
    departmentName: "DEPARTMENT OF COMPUTING AND INFORMATICS",
    assessmentSeriesId: "series-2026-nov",
    assessmentSeriesName: "NOVEMBER/DECEMBER 2026 SERIES",
    year: "2026",
    totalAmount: 4300,
    status: "AWAITING_HOD_APPROVAL",
    submittedAt: "2026-06-13T10:00:00Z",
    lastUpdatedAt: "2026-06-13T16:20:00Z",
    units: [
      {
        id: "ru-21",
        unitId: "unit-cit-01",
        unitCode: "ICT/CU/IT/BC/01/5/A",
        unitName: "Demonstrate Communication Skills (Cert)",
        category: "Basic",
        amountCharged: 1e3,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-13T14:10:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Passed coursework 1 and 2.",
        signatureRef: "TSNP-VER-OMONDI-9090"
      },
      {
        id: "ru-22",
        unitId: "unit-cit-02",
        unitCode: "ICT/CU/IT/CC/01/5/A",
        unitName: "Computer Maintenance and Troubleshooting",
        category: "Common",
        amountCharged: 1500,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "APPROVED",
        verifiedAt: "2026-06-13T15:30:00Z",
        verifiedByTrainerName: "Mr. Moses Wanjala",
        decisionComment: "Lab practicals and hardware teardown signed off.",
        signatureRef: "TSNP-VER-WANJALA-4422"
      },
      {
        id: "ru-23",
        unitId: "unit-cit-03",
        unitCode: "ICT/CU/IT/CR/01/5/A",
        unitName: "Computer Applications Support",
        category: "Core",
        amountCharged: 1800,
        trainerId: "tr-02",
        trainerName: "Ms. Faith Chebet",
        status: "APPROVED",
        verifiedAt: "2026-06-13T16:20:00Z",
        verifiedByTrainerName: "Ms. Faith Chebet",
        decisionComment: "Applications project assessment cleared.",
        signatureRef: "TSNP-VER-CHEBET-8840"
      }
    ],
    resubmissionCount: 0,
    auditLogs: [
      {
        id: "log-21",
        timestamp: "2026-06-13T10:00:00Z",
        userId: "user-stu-03",
        userName: "Brian Kipruto",
        userRole: "STUDENT",
        action: "SUBMIT_REGISTRATION",
        details: "Submitted 3 units registration.",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED"
      },
      {
        id: "log-22",
        timestamp: "2026-06-13T16:20:00Z",
        userId: "user-tr-02",
        userName: "Ms. Faith Chebet",
        userRole: "TRAINER",
        action: "VERIFY_UNITS",
        details: "All trainers completed verification. Registration routed to HOD approval queue.",
        previousStatus: "PARTIALLY_VERIFIED",
        newStatus: "AWAITING_HOD_APPROVAL"
      }
    ]
  },
  // 4. Cycle 1 Earlier Trainee Cohort Registration (Approved)
  {
    id: "reg-004",
    registrationReference: "UR-2026-000088",
    studentId: "stu-04",
    studentName: "Johnstone Makokha",
    admissionNumber: "TSNP/DICT/2023/0019",
    courseId: "course-dict",
    courseName: "Diploma in Information Communication Technology",
    courseCode: "DICT",
    levelId: "lvl-6",
    levelName: "LEVEL 6",
    departmentId: "dept-ci",
    departmentName: "DEPARTMENT OF COMPUTING AND INFORMATICS",
    assessmentSeriesId: "series-2026-nov",
    assessmentSeriesName: "NOVEMBER/DECEMBER 2026 SERIES",
    year: "2026",
    module: "Cycle 1",
    totalAmount: 6500,
    status: "APPROVED",
    submittedAt: "2026-06-08T08:30:00Z",
    lastUpdatedAt: "2026-06-09T15:10:00Z",
    units: [
      {
        id: "ru-41",
        unitId: "unit-01",
        unitCode: "ICT/CU/IT/BC/01/6/A",
        unitName: "Demonstrate Communication Skills",
        category: "Basic",
        amountCharged: 1200,
        trainerId: "tr-03",
        trainerName: "Mr. Geoffrey Omondi",
        status: "APPROVED",
        verifiedAt: "2026-06-08T11:00:00Z",
        verifiedByTrainerName: "Mr. Geoffrey Omondi",
        decisionComment: "Earlier cohort coursework validated.",
        signatureRef: "TSNP-VER-OMONDI-8101"
      },
      {
        id: "ru-42",
        unitId: "unit-04",
        unitCode: "ICT/CU/IT/CC/01/6/A",
        unitName: "Apply Computer Networks Concepts",
        category: "Common",
        amountCharged: 1800,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "APPROVED",
        verifiedAt: "2026-06-08T14:30:00Z",
        verifiedByTrainerName: "Mr. Moses Wanjala",
        decisionComment: "Network topology and lab practicals verified.",
        signatureRef: "TSNP-VER-WANJALA-4401"
      },
      {
        id: "ru-43",
        unitId: "unit-06",
        unitCode: "ICT/CU/IT/CR/01/6/A",
        unitName: "Develop Web Applications",
        category: "Core",
        amountCharged: 2500,
        trainerId: "tr-01",
        trainerName: "Mr. Moses Wanjala",
        status: "APPROVED",
        verifiedAt: "2026-06-08T14:40:00Z",
        verifiedByTrainerName: "Mr. Moses Wanjala",
        decisionComment: "Web projects inspected.",
        signatureRef: "TSNP-VER-WANJALA-4402"
      }
    ],
    hodApproval: {
      hodId: "user-hod-01",
      hodName: "Dr. Kennedy Musumba",
      designation: "Head of Department, Computing & Informatics",
      decision: "APPROVED",
      comments: "Earlier trainee Cycle 1 candidate approved for assessment series.",
      approvedAt: "2026-06-09T15:10:00Z",
      approvalRef: "TSNP-HOD-APP-2026-0044"
    },
    resubmissionCount: 0,
    auditLogs: [
      {
        id: "log-41",
        timestamp: "2026-06-08T08:30:00Z",
        userId: "user-stu-04",
        userName: "Johnstone Makokha",
        userRole: "STUDENT",
        action: "SUBMIT_REGISTRATION",
        details: "Submitted registration for Cycle 1 units.",
        previousStatus: "DRAFT",
        newStatus: "SUBMITTED"
      },
      {
        id: "log-42",
        timestamp: "2026-06-09T15:10:00Z",
        userId: "user-hod-01",
        userName: "Dr. Kennedy Musumba",
        userRole: "HOD",
        action: "HOD_APPROVE_REGISTRATION",
        details: "Authorized Cycle 1 registration docket.",
        previousStatus: "AWAITING_HOD_APPROVAL",
        newStatus: "APPROVED"
      }
    ]
  }
];
var INITIAL_NOTIFICATIONS = [
  {
    id: "notif-01",
    targetUserId: "user-stu-01",
    title: "Registration Approved & Cleared",
    message: "Your CDACC Assessment Unit Registration UR-2026-000142 has been officially approved by the Head of Department. You may now download and print your official institutional form.",
    type: "SUCCESS",
    read: false,
    createdAt: "2026-06-12T14:45:00Z",
    linkRegistrationId: "reg-001"
  },
  {
    id: "notif-02",
    targetRole: "TRAINER",
    title: "New Unit Verification Tasks",
    message: "Mercy Nekesa (TSNP/DICT/2024/0519) submitted units requiring your electronic verification.",
    type: "INFO",
    read: false,
    createdAt: "2026-06-14T08:15:00Z",
    linkRegistrationId: "reg-002"
  },
  {
    id: "notif-03",
    targetRole: "HOD",
    title: "Registration Ready for Final HOD Approval",
    message: "Brian Kipruto (TSNP/CIT/2025/0114) has all units successfully verified by assigned trainers. Ready for departmental approval stamp.",
    type: "WARNING",
    read: false,
    createdAt: "2026-06-13T16:20:00Z",
    linkRegistrationId: "reg-003"
  }
];

// src/db/index.ts
var dbInstance = null;
var clientInstance = null;
var currentConnUrl = null;
var schemaInitialized = false;
function parseConnectionString(rawInput) {
  if (!rawInput) return null;
  let str = rawInput.trim();
  str = str.replace(/^["'`]+|["'`]+$/g, "").trim();
  str = str.replace(/\\"/g, '"').replace(/^["']+|["']+$/g, "").trim();
  if (!str.startsWith("postgres://") && !str.startsWith("postgresql://")) {
    const match = str.match(/^(?:export\s+)?[A-Z0-9_]+\s*=\s*(.*)$/is);
    if (match && match[1]) {
      str = match[1].trim();
      str = str.replace(/^["'`]+|["'`]+$/g, "").trim();
      str = str.replace(/\\"/g, '"').replace(/^["']+|["']+$/g, "").trim();
    }
  }
  str = str.replace(/[;,]+$/, "").trim();
  if (str.startsWith("postgres://") || str.startsWith("postgresql://")) {
    return str;
  }
  return null;
}
function isPlaceholderConnectionString(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const user = decodeURIComponent(parsed.username || "").toLowerCase();
    const pass = decodeURIComponent(parsed.password || "").toLowerCase();
    if (host.includes("sample") || host.includes("example") || host === "ep-sample-pooler.region.neon.tech" || user === "user" || user === "username" || pass === "password" || pass === "your_password" || user.includes("your_") || pass.includes("your_")) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}
function getConnectionString() {
  const envVars = [
    "DATABASE_URL",
    "POSTGRES_URL",
    "POSTGRES_URL_NON_POOLING",
    "POSTGRES_PRISMA_URL",
    "NEON_DATABASE_URL"
  ];
  for (const name of envVars) {
    const raw = process.env[name];
    if (!raw) continue;
    const parsed = parseConnectionString(raw);
    if (parsed) {
      return { url: parsed, sourceVar: name };
    }
  }
  return null;
}
function getDb() {
  const conn = getConnectionString();
  if (!conn) {
    if (clientInstance) {
      try {
        clientInstance.end();
      } catch {
      }
      clientInstance = null;
      dbInstance = null;
      currentConnUrl = null;
    }
    return null;
  }
  const connectionString = conn.url;
  if (isPlaceholderConnectionString(connectionString)) {
    return null;
  }
  if (!dbInstance || currentConnUrl !== connectionString) {
    if (clientInstance) {
      try {
        clientInstance.end();
      } catch {
      }
      clientInstance = null;
      dbInstance = null;
    }
    try {
      const parsedUrl = new URL(connectionString);
      if (!parsedUrl.hostname) {
        return null;
      }
      const isNeon = parsedUrl.hostname.includes("neon.tech") || connectionString.includes("sslmode=require");
      clientInstance = postgres(connectionString, {
        ssl: isNeon ? "require" : false,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false
        // Recommended for serverless environments (Neon/Vercel)
      });
      dbInstance = drizzle(clientInstance, { schema: schema_exports });
      currentConnUrl = connectionString;
    } catch (err) {
      console.warn("PostgreSQL database connection initialized with warning or invalid URL:", err);
      dbInstance = null;
      clientInstance = null;
      currentConnUrl = null;
      return null;
    }
  }
  return dbInstance;
}
async function testDbConnection() {
  const conn = getConnectionString();
  if (!conn) {
    const rawVal = process.env.DATABASE_URL || process.env.POSTGRES_URL || process.env.NEON_DATABASE_URL;
    if (rawVal) {
      return {
        connected: false,
        source: "Neon PostgreSQL",
        message: `Database variable found (${rawVal.slice(0, 32)}...), but it could not be parsed into a valid postgresql:// URI. Please check formatting.`
      };
    }
    return {
      connected: false,
      source: "Neon PostgreSQL",
      message: "DATABASE_URL environment variable is not configured. Add your real Neon connection string in Google AI Studio Settings or Vercel Environment Variables."
    };
  }
  let host = "unknown";
  try {
    const parsed = new URL(conn.url);
    host = parsed.hostname;
  } catch {
  }
  if (isPlaceholderConnectionString(conn.url)) {
    return {
      connected: false,
      source: "Neon PostgreSQL",
      variableUsed: conn.sourceVar,
      host,
      isPlaceholder: true,
      message: `DATABASE_URL is currently using the example placeholder ("${host}" with sample credentials). To connect your real Neon database, replace this with your actual connection string from https://console.neon.tech.`
    };
  }
  const db = getDb();
  if (!db) {
    return {
      connected: false,
      source: "Neon PostgreSQL",
      variableUsed: conn.sourceVar,
      host,
      message: `Database URL in ${conn.sourceVar} could not establish a connection to ${host}.`
    };
  }
  const startTime = Date.now();
  try {
    const result = await db.execute(
      sql`SELECT NOW() as current_time, current_database() as db_name, version() as version`
    );
    const latencyMs = Date.now() - startTime;
    const row = result[0] || result.rows?.[0] || {};
    const tablesRes = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tablesCount = tablesRes[0]?.count || tablesRes.rows?.[0]?.count || 0;
    return {
      connected: true,
      source: "Neon PostgreSQL",
      variableUsed: conn.sourceVar,
      host,
      databaseName: row.db_name || "neondb",
      serverTime: row.current_time ? new Date(row.current_time).toISOString() : (/* @__PURE__ */ new Date()).toISOString(),
      latencyMs,
      tablesCount,
      message: `Successfully connected to Neon PostgreSQL (${row.db_name || "neondb"} on ${host}). Latency: ${latencyMs}ms.`
    };
  } catch (err) {
    return {
      connected: false,
      source: "Neon PostgreSQL",
      variableUsed: conn.sourceVar,
      host,
      message: `Neon query failed on ${host}: ${err?.message || String(err)}`
    };
  }
}
async function ensureSchemaAndSeed() {
  const db = getDb();
  if (!db || schemaInitialized) return;
  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        role TEXT NOT NULL,
        identifier_number TEXT NOT NULL,
        department_id TEXT NOT NULL,
        avatar_url TEXT,
        signature_data_url TEXT,
        title TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS departments (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        hod_name TEXT NOT NULL,
        hod_designation TEXT NOT NULL,
        hod_email TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS levels (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS courses (
        id TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        name TEXT NOT NULL,
        department_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        duration_semesters INTEGER DEFAULT 6
      );

      CREATE TABLE IF NOT EXISTS unit_categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        code TEXT NOT NULL,
        description TEXT,
        badge_color TEXT,
        default_amount INTEGER DEFAULT 1500
      );

      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY,
        unit_code TEXT NOT NULL,
        unit_name TEXT NOT NULL,
        category TEXT NOT NULL,
        course_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        amount_charged INTEGER NOT NULL,
        default_trainer_id TEXT NOT NULL,
        description TEXT,
        prerequisites JSONB,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS trainers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        staff_number TEXT NOT NULL,
        department_id TEXT NOT NULL,
        phone TEXT NOT NULL,
        specialization TEXT NOT NULL,
        signature_data_url TEXT,
        password TEXT
      );

      CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        admission_number TEXT NOT NULL,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        course_id TEXT NOT NULL,
        level_id TEXT NOT NULL,
        department_id TEXT NOT NULL,
        national_id TEXT,
        current_module TEXT NOT NULL DEFAULT '1',
        current_year_of_study TEXT DEFAULT '1',
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS assessment_series (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        year TEXT NOT NULL,
        opening_date TEXT NOT NULL,
        closing_date TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'ACTIVE'
      );

      CREATE TABLE IF NOT EXISTS registrations (
        id TEXT PRIMARY KEY,
        registration_reference TEXT NOT NULL,
        student_id TEXT NOT NULL,
        student_name TEXT NOT NULL,
        admission_number TEXT NOT NULL,
        course_id TEXT NOT NULL,
        course_name TEXT NOT NULL,
        course_code TEXT NOT NULL,
        level_id TEXT NOT NULL,
        level_name TEXT NOT NULL,
        department_id TEXT NOT NULL,
        department_name TEXT NOT NULL,
        assessment_series_id TEXT NOT NULL,
        assessment_series_name TEXT NOT NULL,
        year TEXT NOT NULL,
        module TEXT,
        units JSONB NOT NULL,
        total_amount INTEGER NOT NULL,
        status TEXT NOT NULL DEFAULT 'SUBMITTED',
        submitted_at TEXT NOT NULL,
        last_updated_at TEXT NOT NULL,
        hod_approval JSONB,
        exam_office_receipt JSONB,
        rejection_reason TEXT,
        correction_comment TEXT,
        resubmission_count INTEGER DEFAULT 0,
        audit_logs JSONB
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        target_user_id TEXT,
        target_role TEXT,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'INFO',
        read BOOLEAN DEFAULT FALSE,
        created_at TEXT NOT NULL,
        link_registration_id TEXT
      );

      CREATE TABLE IF NOT EXISTS institution_config (
        id TEXT PRIMARY KEY DEFAULT 'default_config',
        data JSONB NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS audit_logs_global (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT NOT NULL,
        user_role TEXT NOT NULL,
        action TEXT NOT NULL,
        details TEXT NOT NULL,
        previous_status TEXT,
        new_status TEXT,
        ip_address TEXT
      );
    `);
    const userCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM users`);
    const count = userCountRes[0]?.count || userCountRes.rows?.[0]?.count || 0;
    if (count === 0) {
      console.log("Neon PostgreSQL is empty. Seeding baseline institutional data...");
      for (const d of INITIAL_DEPARTMENTS) {
        await db.insert(departments).values(d).onConflictDoNothing();
      }
      for (const l of INITIAL_LEVELS) {
        await db.insert(levels).values(l).onConflictDoNothing();
      }
      for (const c of INITIAL_COURSES) {
        await db.insert(courses).values(c).onConflictDoNothing();
      }
      for (const cat of INITIAL_UNIT_CATEGORIES) {
        await db.insert(unitCategories).values(cat).onConflictDoNothing();
      }
      for (const u of INITIAL_UNITS) {
        await db.insert(units).values({
          ...u,
          prerequisites: u.prerequisites
        }).onConflictDoNothing();
      }
      for (const t of INITIAL_TRAINERS) {
        await db.insert(trainers).values(t).onConflictDoNothing();
      }
      for (const s of INITIAL_STUDENTS) {
        await db.insert(students).values({
          ...s,
          currentModule: String(s.currentModule ?? 1),
          currentYearOfStudy: String(s.currentYearOfStudy || 1)
        }).onConflictDoNothing();
      }
      for (const u of INITIAL_USERS) {
        await db.insert(users).values(u).onConflictDoNothing();
      }
      for (const s of INITIAL_ASSESSMENT_SERIES) {
        await db.insert(assessmentSeries).values(s).onConflictDoNothing();
      }
      for (const r of INITIAL_REGISTRATIONS) {
        await db.insert(registrations).values({
          ...r,
          module: String(r.module ?? 1),
          units: r.units,
          hodApproval: r.hodApproval,
          examOfficeReceipt: r.examOfficeReceipt,
          auditLogs: r.auditLogs
        }).onConflictDoNothing();
      }
      for (const n of INITIAL_NOTIFICATIONS) {
        await db.insert(notifications).values(n).onConflictDoNothing();
      }
      await db.insert(institutionConfig).values({
        id: "default_config",
        data: INITIAL_INSTITUTION_CONFIG
      }).onConflictDoNothing();
      console.log("\u2705 Baseline institutional data seeded successfully into Neon PostgreSQL!");
    }
    schemaInitialized = true;
  } catch (err) {
    console.error("Error in ensureSchemaAndSeed:", err);
  }
}

// src/server/serverStorage.ts
import { eq, desc } from "drizzle-orm";
var ServerStorageService = class {
  constructor() {
    this.memoryState = {
      config: INITIAL_INSTITUTION_CONFIG,
      departments: INITIAL_DEPARTMENTS,
      levels: INITIAL_LEVELS,
      courses: INITIAL_COURSES,
      trainers: INITIAL_TRAINERS,
      students: INITIAL_STUDENTS,
      units: INITIAL_UNITS,
      unitCategories: INITIAL_UNIT_CATEGORIES,
      series: INITIAL_ASSESSMENT_SERIES,
      users: INITIAL_USERS,
      registrations: INITIAL_REGISTRATIONS,
      notifications: INITIAL_NOTIFICATIONS,
      auditLogs: [],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      source: "memory_preview"
    };
  }
  // --- Bootstrap Data: Neon PostgreSQL is the Single Source of Truth ---
  async getBootstrapData() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const [
          depList,
          lvlList,
          crsList,
          trnList,
          untList,
          catList,
          serList,
          usrList,
          stuList,
          regList,
          notList,
          cfgList,
          logList
        ] = await Promise.all([
          db.select().from(departments),
          db.select().from(levels),
          db.select().from(courses),
          db.select().from(trainers),
          db.select().from(units),
          db.select().from(unitCategories),
          db.select().from(assessmentSeries),
          db.select().from(users),
          db.select().from(students),
          db.select().from(registrations).orderBy(desc(registrations.submittedAt)),
          db.select().from(notifications).orderBy(desc(notifications.createdAt)),
          db.select().from(institutionConfig).limit(1),
          db.select().from(auditLogsGlobal).orderBy(desc(auditLogsGlobal.timestamp)).limit(200)
        ]);
        return {
          config: cfgList[0]?.data || INITIAL_INSTITUTION_CONFIG,
          departments: depList || [],
          levels: lvlList || [],
          courses: crsList || [],
          trainers: trnList || [],
          units: untList || [],
          unitCategories: catList || [],
          series: serList || [],
          users: usrList || [],
          students: stuList || [],
          registrations: regList || [],
          notifications: notList || [],
          auditLogs: logList || [],
          lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
          source: "neon_postgresql"
        };
      } catch (err) {
        console.error("Neon PostgreSQL query error during bootstrap:", err);
      }
    }
    return this.memoryState;
  }
  // --- Registrations ---
  async getRegistrations() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const regs = await db.select().from(registrations).orderBy(desc(registrations.submittedAt));
        return regs;
      } catch (err) {
        console.error("Error fetching registrations from Neon:", err);
      }
    }
    return this.memoryState.registrations;
  }
  async saveRegistration(reg) {
    const now = (/* @__PURE__ */ new Date()).toISOString();
    const fullReg = {
      ...reg,
      lastUpdatedAt: now,
      submittedAt: reg.submittedAt || now
    };
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(registrations).values({
          id: fullReg.id,
          registrationReference: fullReg.registrationReference,
          studentId: fullReg.studentId,
          studentName: fullReg.studentName,
          admissionNumber: fullReg.admissionNumber,
          courseId: fullReg.courseId,
          courseName: fullReg.courseName,
          courseCode: fullReg.courseCode,
          levelId: fullReg.levelId,
          levelName: fullReg.levelName,
          departmentId: fullReg.departmentId,
          departmentName: fullReg.departmentName,
          assessmentSeriesId: fullReg.assessmentSeriesId,
          assessmentSeriesName: fullReg.assessmentSeriesName,
          year: fullReg.year,
          module: fullReg.module !== void 0 ? String(fullReg.module) : "1",
          units: fullReg.units,
          totalAmount: fullReg.totalAmount,
          status: fullReg.status,
          submittedAt: fullReg.submittedAt,
          lastUpdatedAt: fullReg.lastUpdatedAt,
          hodApproval: fullReg.hodApproval,
          examOfficeReceipt: fullReg.examOfficeReceipt,
          rejectionReason: fullReg.rejectionReason,
          correctionComment: fullReg.correctionComment,
          resubmissionCount: fullReg.resubmissionCount || 0,
          auditLogs: fullReg.auditLogs
        }).onConflictDoUpdate({
          target: registrations.id,
          set: {
            registrationReference: fullReg.registrationReference,
            studentName: fullReg.studentName,
            admissionNumber: fullReg.admissionNumber,
            courseId: fullReg.courseId,
            courseName: fullReg.courseName,
            courseCode: fullReg.courseCode,
            levelId: fullReg.levelId,
            levelName: fullReg.levelName,
            departmentId: fullReg.departmentId,
            departmentName: fullReg.departmentName,
            assessmentSeriesId: fullReg.assessmentSeriesId,
            assessmentSeriesName: fullReg.assessmentSeriesName,
            year: fullReg.year,
            module: fullReg.module !== void 0 ? String(fullReg.module) : "1",
            units: fullReg.units,
            totalAmount: fullReg.totalAmount,
            status: fullReg.status,
            lastUpdatedAt: fullReg.lastUpdatedAt,
            hodApproval: fullReg.hodApproval,
            examOfficeReceipt: fullReg.examOfficeReceipt,
            rejectionReason: fullReg.rejectionReason,
            correctionComment: fullReg.correctionComment,
            resubmissionCount: fullReg.resubmissionCount || 0,
            auditLogs: fullReg.auditLogs
          }
        });
      } catch (err) {
        console.error("Neon PostgreSQL registration write error:", err);
      }
    }
    const idx = this.memoryState.registrations.findIndex((r) => r.id === reg.id);
    if (idx >= 0) this.memoryState.registrations[idx] = fullReg;
    else this.memoryState.registrations.unshift(fullReg);
    return fullReg;
  }
  async updateRegistration(id, updates) {
    const db = getDb();
    const now = (/* @__PURE__ */ new Date()).toISOString();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const updatePayload = { ...updates, lastUpdatedAt: now };
        if (updates.module !== void 0) updatePayload.module = String(updates.module);
        await db.update(registrations).set(updatePayload).where(eq(registrations.id, id));
        const rows = await db.select().from(registrations).where(eq(registrations.id, id));
        if (rows.length > 0) return rows[0];
      } catch (err) {
        console.error("Neon PostgreSQL registration update error:", err);
      }
    }
    const idx = this.memoryState.registrations.findIndex((r) => r.id === id);
    if (idx >= 0) {
      const updated = { ...this.memoryState.registrations[idx], ...updates, lastUpdatedAt: now };
      this.memoryState.registrations[idx] = updated;
      return updated;
    }
    return null;
  }
  async deleteRegistration(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(registrations).where(eq(registrations.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL registration delete error:", err);
      }
    }
    this.memoryState.registrations = this.memoryState.registrations.filter((r) => r.id !== id);
  }
  async resetRegistrations() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(registrations);
      } catch (err) {
        console.error("Neon PostgreSQL registration reset error:", err);
      }
    }
    this.memoryState.registrations = [];
  }
  // --- Users ---
  async getUsers() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(users);
        return rows;
      } catch (err) {
        console.error("Neon PostgreSQL users fetch error:", err);
      }
    }
    return this.memoryState.users;
  }
  async saveUser(user) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(users).values(user).onConflictDoUpdate({
          target: users.id,
          set: user
        });
      } catch (err) {
        console.error("Neon PostgreSQL user write error:", err);
      }
    }
    const idx = this.memoryState.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.memoryState.users[idx] = { ...this.memoryState.users[idx], ...user };
    else this.memoryState.users.push(user);
    return user;
  }
  async deleteUser(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(users).where(eq(users.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL user delete error:", err);
      }
    }
    this.memoryState.users = this.memoryState.users.filter((u) => u.id !== id);
  }
  // --- Students ---
  async getStudents() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(students);
        return rows;
      } catch (err) {
        console.error("Neon PostgreSQL students fetch error:", err);
      }
    }
    return this.memoryState.students;
  }
  async saveStudent(student) {
    const formattedStu = {
      ...student,
      currentModule: student.currentModule !== void 0 ? String(student.currentModule) : "1",
      currentYearOfStudy: student.currentYearOfStudy !== void 0 ? String(student.currentYearOfStudy) : "1"
    };
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(students).values(formattedStu).onConflictDoUpdate({
          target: students.id,
          set: formattedStu
        });
      } catch (err) {
        console.error("Neon PostgreSQL student write error:", err);
      }
    }
    const idx = this.memoryState.students.findIndex((s) => s.id === student.id);
    if (idx >= 0) this.memoryState.students[idx] = { ...this.memoryState.students[idx], ...student };
    else this.memoryState.students.push(student);
    return student;
  }
  async deleteStudent(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(students).where(eq(students.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL student delete error:", err);
      }
    }
    this.memoryState.students = this.memoryState.students.filter((s) => s.id !== id);
  }
  // --- Trainers ---
  async getTrainers() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(trainers);
        return rows;
      } catch (err) {
        console.error("Neon PostgreSQL trainers fetch error:", err);
      }
    }
    return this.memoryState.trainers;
  }
  async saveTrainer(trainer) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(trainers).values(trainer).onConflictDoUpdate({
          target: trainers.id,
          set: trainer
        });
      } catch (err) {
        console.error("Neon PostgreSQL trainer write error:", err);
      }
    }
    const idx = this.memoryState.trainers.findIndex((t) => t.id === trainer.id);
    if (idx >= 0) this.memoryState.trainers[idx] = { ...this.memoryState.trainers[idx], ...trainer };
    else this.memoryState.trainers.push(trainer);
    return trainer;
  }
  async deleteTrainer(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(trainers).where(eq(trainers.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL trainer delete error:", err);
      }
    }
    this.memoryState.trainers = this.memoryState.trainers.filter((t) => t.id !== id);
  }
  // --- Units ---
  async getUnits() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(units);
        return rows;
      } catch (err) {
        console.error("Neon PostgreSQL units fetch error:", err);
      }
    }
    return this.memoryState.units;
  }
  async saveUnit(unit) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(units).values({
          ...unit,
          prerequisites: unit.prerequisites
        }).onConflictDoUpdate({
          target: units.id,
          set: {
            ...unit,
            prerequisites: unit.prerequisites
          }
        });
      } catch (err) {
        console.error("Neon PostgreSQL unit write error:", err);
      }
    }
    const idx = this.memoryState.units.findIndex((u) => u.id === unit.id);
    if (idx >= 0) this.memoryState.units[idx] = { ...this.memoryState.units[idx], ...unit };
    else this.memoryState.units.push(unit);
    return unit;
  }
  async saveUnitsBulk(unitsList) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        for (const u of unitsList) {
          await db.insert(units).values({
            ...u,
            prerequisites: u.prerequisites
          }).onConflictDoUpdate({
            target: units.id,
            set: {
              ...u,
              prerequisites: u.prerequisites
            }
          });
        }
      } catch (err) {
        console.error("Neon PostgreSQL units bulk write error:", err);
      }
    }
    for (const u of unitsList) {
      const idx = this.memoryState.units.findIndex((unit) => unit.id === u.id);
      if (idx >= 0) this.memoryState.units[idx] = { ...this.memoryState.units[idx], ...u };
      else this.memoryState.units.push(u);
    }
    return unitsList.length;
  }
  async deleteUnit(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(units).where(eq(units.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL unit delete error:", err);
      }
    }
    this.memoryState.units = this.memoryState.units.filter((u) => u.id !== id);
  }
  // --- Series ---
  async getSeries() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(assessmentSeries);
        return rows;
      } catch (err) {
        console.error("Neon PostgreSQL series fetch error:", err);
      }
    }
    return this.memoryState.series;
  }
  async saveSeries(series) {
    const isActive = series.status === "ACTIVE";
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        if (isActive) {
          await db.update(assessmentSeries).set({ status: "CLOSED" });
          await db.delete(registrations);
        }
        await db.insert(assessmentSeries).values(series).onConflictDoUpdate({
          target: assessmentSeries.id,
          set: series
        });
      } catch (err) {
        console.error("Neon PostgreSQL series write error:", err);
      }
    }
    if (isActive) {
      this.memoryState.series.forEach((s) => {
        if (s.id !== series.id && s.status === "ACTIVE") s.status = "CLOSED";
      });
      this.memoryState.registrations = [];
    }
    const idx = this.memoryState.series.findIndex((s) => s.id === series.id);
    if (idx >= 0) this.memoryState.series[idx] = series;
    else this.memoryState.series.unshift(series);
    return { series, resetApplied: isActive };
  }
  async activateSeries(seriesId) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.update(assessmentSeries).set({ status: "CLOSED" });
        await db.update(assessmentSeries).set({ status: "ACTIVE" }).where(eq(assessmentSeries.id, seriesId));
        await db.delete(registrations);
      } catch (err) {
        console.error("Neon PostgreSQL series activate error:", err);
      }
    }
    this.memoryState.series.forEach((s) => {
      if (s.id === seriesId) s.status = "ACTIVE";
      else if (s.status === "ACTIVE") s.status = "CLOSED";
    });
    this.memoryState.registrations = [];
  }
  async deleteSeries(seriesId) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(assessmentSeries).where(eq(assessmentSeries.id, seriesId));
      } catch (err) {
        console.error("Neon PostgreSQL series delete error:", err);
      }
    }
    this.memoryState.series = this.memoryState.series.filter((s) => s.id !== seriesId);
  }
  // --- Courses, Levels, Departments, Categories ---
  async saveCourse(course) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(courses).values(course).onConflictDoUpdate({
          target: courses.id,
          set: course
        });
      } catch (err) {
        console.error("Neon PostgreSQL course write error:", err);
      }
    }
    const idx = this.memoryState.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) this.memoryState.courses[idx] = course;
    else this.memoryState.courses.push(course);
    return course;
  }
  async deleteCourse(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(courses).where(eq(courses.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL course delete error:", err);
      }
    }
    this.memoryState.courses = this.memoryState.courses.filter((c) => c.id !== id);
  }
  async saveLevel(level) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(levels).values(level).onConflictDoUpdate({
          target: levels.id,
          set: level
        });
      } catch (err) {
        console.error("Neon PostgreSQL level write error:", err);
      }
    }
    const idx = this.memoryState.levels.findIndex((l) => l.id === level.id);
    if (idx >= 0) this.memoryState.levels[idx] = level;
    else this.memoryState.levels.push(level);
    return level;
  }
  async deleteLevel(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(levels).where(eq(levels.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL level delete error:", err);
      }
    }
    this.memoryState.levels = this.memoryState.levels.filter((l) => l.id !== id);
  }
  async saveDepartment(department) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(departments).values(department).onConflictDoUpdate({
          target: departments.id,
          set: department
        });
      } catch (err) {
        console.error("Neon PostgreSQL department write error:", err);
      }
    }
    const idx = this.memoryState.departments.findIndex((d) => d.id === department.id);
    if (idx >= 0) this.memoryState.departments[idx] = department;
    else this.memoryState.departments.push(department);
    return department;
  }
  async deleteDepartment(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(departments).where(eq(departments.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL department delete error:", err);
      }
    }
    this.memoryState.departments = this.memoryState.departments.filter((d) => d.id !== id);
  }
  async saveUnitCategory(category) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(unitCategories).values(category).onConflictDoUpdate({
          target: unitCategories.id,
          set: category
        });
      } catch (err) {
        console.error("Neon PostgreSQL unit category write error:", err);
      }
    }
    const idx = this.memoryState.unitCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) this.memoryState.unitCategories[idx] = category;
    else this.memoryState.unitCategories.push(category);
    return category;
  }
  async deleteUnitCategory(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(unitCategories).where(eq(unitCategories.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL unit category delete error:", err);
      }
    }
    this.memoryState.unitCategories = this.memoryState.unitCategories.filter((c) => c.id !== id);
  }
  // --- Institution Config ---
  async saveConfig(config) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(institutionConfig).values({
          id: "default_config",
          data: config
        }).onConflictDoUpdate({
          target: institutionConfig.id,
          set: {
            data: config
          }
        });
      } catch (err) {
        console.error("Neon PostgreSQL config write error:", err);
      }
    }
    this.memoryState.config = { ...this.memoryState.config, ...config };
    return this.memoryState.config;
  }
  // --- Notifications ---
  async createNotification(notif) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(notifications).values({
          id: notif.id,
          targetRole: notif.targetRole,
          targetUserId: notif.targetUserId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          linkRegistrationId: notif.linkRegistrationId,
          read: notif.read,
          createdAt: notif.createdAt
        }).onConflictDoNothing();
      } catch (err) {
        console.error("Neon PostgreSQL notification write error:", err);
      }
    }
    this.memoryState.notifications.unshift(notif);
    if (this.memoryState.notifications.length > 200) {
      this.memoryState.notifications.length = 200;
    }
    return notif;
  }
  async markNotificationRead(id) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
      } catch (err) {
        console.error("Neon PostgreSQL notification read error:", err);
      }
    }
    const notif = this.memoryState.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }
  async markAllNotificationsRead(targetUserId) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        if (targetUserId) {
          await db.update(notifications).set({ read: true }).where(eq(notifications.targetUserId, targetUserId));
        } else {
          await db.update(notifications).set({ read: true });
        }
      } catch (err) {
        console.error("Neon PostgreSQL notification mark all read error:", err);
      }
    }
    this.memoryState.notifications.forEach((n) => {
      if (!targetUserId || n.targetUserId === targetUserId) {
        n.read = true;
      }
    });
  }
  // --- Audit Logs ---
  async logAudit(log) {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(auditLogsGlobal).values(log).onConflictDoNothing();
      } catch (err) {
        console.error("Neon PostgreSQL audit log write error:", err);
      }
    }
    this.memoryState.auditLogs.unshift(log);
    if (this.memoryState.auditLogs.length > 500) {
      this.memoryState.auditLogs.length = 500;
    }
  }
  // --- Reset to Baseline Institutional Defaults ---
  async resetToDefaults() {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(registrations);
        await db.delete(notifications);
        await db.delete(auditLogsGlobal);
      } catch (err) {
        console.error("Neon PostgreSQL reset error:", err);
      }
    }
    this.memoryState = {
      config: INITIAL_INSTITUTION_CONFIG,
      departments: INITIAL_DEPARTMENTS,
      levels: INITIAL_LEVELS,
      courses: INITIAL_COURSES,
      trainers: INITIAL_TRAINERS,
      students: INITIAL_STUDENTS,
      units: INITIAL_UNITS,
      unitCategories: INITIAL_UNIT_CATEGORIES,
      series: INITIAL_ASSESSMENT_SERIES,
      users: INITIAL_USERS,
      registrations: [],
      notifications: [],
      auditLogs: [],
      lastUpdated: (/* @__PURE__ */ new Date()).toISOString(),
      source: db ? "neon_postgresql" : "memory_preview"
    };
    return this.getBootstrapData();
  }
};
var serverStorage = new ServerStorageService();

// server.ts
dotenv.config();
var app = express();
var PORT = 3e3;
app.use(express.json({ limit: "15mb" }));
app.use((req, res, next) => {
  const matched = req.headers["x-matched-path"] || req.headers["x-vercel-matched-path"];
  if (matched && typeof matched === "string" && matched.startsWith("/api") && (req.url === "/" || req.url === "/api")) {
    req.url = matched;
  }
  next();
});
var apiRouter = express.Router();
apiRouter.get("/", (req, res) => {
  return res.json({
    status: "ok",
    service: "TSNP Assessment & Clearance API",
    institution: "The Shamberere National Polytechnic",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
});
apiRouter.get("/health", async (req, res) => {
  const dbHealth = await testDbConnection();
  const state = await serverStorage.getBootstrapData();
  return res.json({
    status: dbHealth.connected ? "ok" : "degraded",
    database: {
      provider: "Neon PostgreSQL",
      connected: dbHealth.connected,
      variableUsed: dbHealth.variableUsed,
      host: dbHealth.host,
      isPlaceholder: dbHealth.isPlaceholder,
      message: dbHealth.message,
      latencyMs: dbHealth.latencyMs,
      databaseName: dbHealth.databaseName,
      serverTime: dbHealth.serverTime,
      tablesCount: dbHealth.tablesCount
    },
    metrics: {
      registeredStudentsCount: state.students.length,
      registeredCandidatesCount: state.registrations.length,
      activeSeriesCount: state.series.filter((s) => s.status === "ACTIVE").length,
      lastUpdated: state.lastUpdated
    }
  });
});
apiRouter.get("/db-check", async (req, res) => {
  const dbHealth = await testDbConnection();
  return res.status(dbHealth.connected ? 200 : 503).json({
    success: dbHealth.connected,
    ...dbHealth
  });
});
apiRouter.get("/bootstrap", async (req, res) => {
  try {
    const data = await serverStorage.getBootstrapData();
    return res.json({
      success: true,
      source: data.source,
      config: data.config,
      departments: data.departments,
      levels: data.levels,
      courses: data.courses,
      trainers: data.trainers,
      units: data.units,
      series: data.series,
      users: data.users,
      students: data.students,
      registrations: data.registrations,
      notifications: data.notifications,
      unitCategories: data.unitCategories,
      auditLogs: data.auditLogs,
      lastUpdated: data.lastUpdated
    });
  } catch (err) {
    console.error("Bootstrap error:", err);
    return res.status(500).json({ error: err?.message || "Bootstrap error" });
  }
});
apiRouter.get("/registrations", async (req, res) => {
  try {
    const regs = await serverStorage.getRegistrations();
    return res.json({ success: true, registrations: regs });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/registrations", async (req, res) => {
  try {
    const regData = req.body;
    if (!regData || !regData.id) {
      return res.status(400).json({ error: "Invalid registration payload" });
    }
    const saved = await serverStorage.saveRegistration(regData);
    return res.json({ success: true, registration: saved });
  } catch (err) {
    console.error("Error saving registration:", err);
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.patch("/registrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await serverStorage.updateRegistration(id, updates);
    return res.json({ success: true, registration: updated });
  } catch (err) {
    console.error("Error updating registration:", err);
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/registrations/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteRegistration(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/registrations/reset", async (req, res) => {
  try {
    await serverStorage.resetRegistrations();
    return res.json({ success: true, message: "All student registrations have been reset." });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.get("/users", async (req, res) => {
  try {
    const users2 = await serverStorage.getUsers();
    return res.json({ success: true, users: users2 });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/users", async (req, res) => {
  try {
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({ error: "Invalid user payload" });
    }
    const saved = await serverStorage.saveUser(userData);
    return res.json({ success: true, user: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteUser(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.get("/students", async (req, res) => {
  try {
    const students2 = await serverStorage.getStudents();
    return res.json({ success: true, students: students2 });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/students", async (req, res) => {
  try {
    const stuData = req.body;
    if (!stuData || !stuData.id) {
      return res.status(400).json({ error: "Invalid student payload" });
    }
    const saved = await serverStorage.saveStudent(stuData);
    return res.json({ success: true, student: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteStudent(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.get("/trainers", async (req, res) => {
  try {
    const trainers2 = await serverStorage.getTrainers();
    return res.json({ success: true, trainers: trainers2 });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/trainers", async (req, res) => {
  try {
    const trainerData = req.body;
    if (!trainerData || !trainerData.id) {
      return res.status(400).json({ error: "Invalid trainer payload" });
    }
    const saved = await serverStorage.saveTrainer(trainerData);
    return res.json({ success: true, trainer: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/trainers/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteTrainer(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.get("/units", async (req, res) => {
  try {
    const units2 = await serverStorage.getUnits();
    return res.json({ success: true, units: units2 });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/units", async (req, res) => {
  try {
    const unitData = req.body;
    if (!unitData || !unitData.id) {
      return res.status(400).json({ error: "Invalid unit payload" });
    }
    const saved = await serverStorage.saveUnit(unitData);
    return res.json({ success: true, unit: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/units/bulk", async (req, res) => {
  try {
    const unitsList = req.body?.units || [];
    const count = await serverStorage.saveUnitsBulk(unitsList);
    return res.json({ success: true, count });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/units/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteUnit(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.get("/series", async (req, res) => {
  try {
    const series = await serverStorage.getSeries();
    return res.json({ success: true, series });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/series", async (req, res) => {
  try {
    const seriesData = req.body?.series || req.body;
    if (!seriesData || !seriesData.id) {
      return res.status(400).json({ error: "Invalid series payload" });
    }
    const result = await serverStorage.saveSeries(seriesData);
    return res.json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/series/active", async (req, res) => {
  try {
    const { seriesId } = req.body;
    if (seriesId) {
      await serverStorage.activateSeries(seriesId);
    }
    return res.json({ success: true, seriesId, message: "Series activated and student registrations reset to 0." });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/series/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteSeries(id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/courses", async (req, res) => {
  try {
    const saved = await serverStorage.saveCourse(req.body);
    return res.json({ success: true, course: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/courses/:id", async (req, res) => {
  try {
    await serverStorage.deleteCourse(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/levels", async (req, res) => {
  try {
    const saved = await serverStorage.saveLevel(req.body);
    return res.json({ success: true, level: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/levels/:id", async (req, res) => {
  try {
    await serverStorage.deleteLevel(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/departments", async (req, res) => {
  try {
    const saved = await serverStorage.saveDepartment(req.body);
    return res.json({ success: true, department: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/departments/:id", async (req, res) => {
  try {
    await serverStorage.deleteDepartment(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/unit-categories", async (req, res) => {
  try {
    const saved = await serverStorage.saveUnitCategory(req.body);
    return res.json({ success: true, unitCategory: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.delete("/unit-categories/:id", async (req, res) => {
  try {
    await serverStorage.deleteUnitCategory(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/config", async (req, res) => {
  try {
    const saved = await serverStorage.saveConfig(req.body);
    return res.json({ success: true, config: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/notifications", async (req, res) => {
  try {
    const saved = await serverStorage.createNotification(req.body);
    return res.json({ success: true, notification: saved });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.patch("/notifications/:id/read", async (req, res) => {
  try {
    await serverStorage.markNotificationRead(req.params.id);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/notifications/read-all", async (req, res) => {
  try {
    await serverStorage.markAllNotificationsRead(req.body?.targetUserId);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/audit", async (req, res) => {
  try {
    await serverStorage.logAudit(req.body);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
apiRouter.post("/reset", async (req, res) => {
  try {
    const resetState = await serverStorage.resetToDefaults();
    return res.json({ success: true, state: resetState });
  } catch (err) {
    return res.status(500).json({ error: err?.message });
  }
});
app.use("/api", apiRouter);
app.use("/", apiRouter);
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`TSNP Clearance Server running on port ${PORT}`);
  });
}
var isServerless = Boolean(
  process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || process.env.NETLIFY
);
if (!isServerless) {
  startServer();
}
var server_default = app;

// src/server/vercelHandler.ts
process.env.VERCEL = process.env.VERCEL || "1";
function handler(req, res) {
  const originalPath = req.headers?.["x-matched-path"] || req.headers?.["x-vercel-matched-path"] || req.headers?.["x-forwarded-uri"] || req.headers?.["x-original-url"] || req.headers?.["x-rewrite-url"];
  if (originalPath && typeof originalPath === "string" && originalPath.startsWith("/api") && (!req.url || req.url === "/" || req.url === "/api")) {
    req.url = originalPath;
  }
  return server_default(req, res);
}
export {
  handler as default
};
