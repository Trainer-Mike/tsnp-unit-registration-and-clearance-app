# TSNP CDACC Assessment Unit Registration & Clearance System
## Comprehensive System Documentation & Technical Manual

**Institution**: The Shamberere National Polytechnic (TSNP)  
**System Classification**: TVET CDACC Competency-Based Assessment Registration, Coursework Verification & Institutional Clearance Engine  
**Version**: 2.4.0 (Production-Ready Release)  
**Database**: PostgreSQL / Neon Serverless with Drizzle ORM  
**Frontend**: React 19, TypeScript, Tailwind CSS, Motion  
**Backend**: Node.js & Express REST API  

---

## Table of Contents
1. [Executive Overview & Objectives](#1-executive-overview--objectives)
2. [High-Level Architecture](#2-high-level-architecture)
3. [User Roles & Access Control (RBAC)](#3-user-roles--access-control-rbac)
4. [End-to-End Business Workflow](#4-end-to-end-business-workflow)
5. [Trainee Registration & Trainer Selection Logic](#5-trainee-registration--trainer-selection-logic)
6. [Trainer Verification & Sign-off Engine](#6-trainer-verification--sign-off-engine)
7. [System Administrator Monitoring & Trainer Alert Subsystem](#7-system-administrator-monitoring--trainer-alert-subsystem)
8. [Departmental (HOD) & Examination Office Clearance](#8-departmental-hod--examination-office-clearance)
9. [QR Gateway & Cryptographic Docket Verification](#9-qr-gateway--cryptographic-docket-verification)
10. [Database Architecture & Schema Reference](#10-database-architecture--schema-reference)
11. [REST API Specification](#11-rest-api-specification)
12. [Deployment & Environment Configuration Guide](#12-deployment--environment-configuration-guide)
13. [Troubleshooting, Backup & Disaster Recovery](#13-troubleshooting-backup--disaster-recovery)

---

## 1. Executive Overview & Objectives

In traditional TVET CDACC assessment workflows, trainees navigate paper clearance booklets, manually search for subject trainers across lecture halls, collect physical signatures for continuous assessment (CATs/practicals), queue at department offices for HOD stamping, and wait at the Examination Office for manual receipting. This manual approach often results in:
- Lost or misplaced clearance sheets.
- Verification bottlenecks prior to assessment deadlines.
- Inability to track unverified units or unresponsive trainers.
- Inconsistent fee calculations for normal candidates vs. re-sits/re-assessments.
- Lack of audit accountability for retroactive grade changes or clearance authorizations.

The **TSNP CDACC Assessment Unit Registration & Clearance System** completely digitizes this lifecycle:
- **Trainee-Centric Selection**: Trainees choose their units and designate the specific trainer who taught them that unit.
- **Granular Subject Trainer Verification**: Trainers log into personal dashboards to inspect coursework evidence and sign off with digital signatures or PINs.
- **Administrative Orchestration**: System Administrators have real-time visibility into all pending clearances, with tools to broadcast urgent alerts or copy WhatsApp/SMS notices directly to trainers.
- **Multi-Tier Approvals**: HODs and the Examination Office review verified registrations through sequential authorization gates.
- **Tamper-Evident Examination Cards**: The system generates print-ready PDF exam dockets featuring high-resolution QR verification gateways for instant invigilator gate validation.

---

## 2. High-Level Architecture

```
                                  +---------------------------------------+
                                  |            Client Browser             |
                                  |    (React 19 + TypeScript + Vite)     |
                                  +---------------------------------------+
                                                      |
                                          HTTP / REST (JSON API)
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |         Express Backend Server        |
                                  |  - Role Authentication & Sessions     |
                                  |  - Unit & Registration Services       |
                                  |  - In-App & Admin Notification Hub    |
                                  |  - Audit Log Collector                |
                                  +---------------------------------------+
                                                      |
                                      Drizzle ORM (SQL Connection Pool)
                                                      |
                                                      v
                                  +---------------------------------------+
                                  |     Neon PostgreSQL Cloud Database    |
                                  |  - 13 Relational Normalized Tables   |
                                  |  - JSONB Nested Unit Collections      |
                                  |  - Auto-Migration & Seeding Fallback  |
                                  +---------------------------------------+
```

### Technology Highlights
- **Client Tier**:
  - **Framework**: React 19 with Vite.
  - **Styling**: Tailwind CSS with dark-mode aesthetic and accessibility standards.
  - **Animations & Interactivity**: `motion` and `canvas-confetti`.
  - **Document Generation**: `jspdf` and `jspdf-autotable` for pixel-accurate institutional assessment cards.
  - **Security & QR**: `qrcode` generation for real-time mobile verification.
- **Server Tier**:
  - **Engine**: Node.js, Express, `tsx`.
  - **ORM**: Drizzle ORM with `postgres` connection pool driver.
  - **Resilience**: Memory caching layer with automatic database write-through guarantees.

---

## 3. User Roles & Access Control (RBAC)

The platform enforces five distinct institutional roles:

| Role Code | Institutional Persona | Primary Responsibilities |
| :--- | :--- | :--- |
| `ADMIN` | **System Administrator** | Institutional settings, adding trainers, managing syllabus units, scheduling assessment series, setting fee schedules, monitoring pending verifications, broadcasting trainer reminders, and inspecting global audit trails. |
| `STUDENT` | **Trainee / Candidate** | Account registration, selecting academic module/cycle, choosing syllabus units, assigning specific subject trainers per unit, tagging reassessment/first-attempt units, tracking real-time clearance status, and downloading the official examination card. |
| `TRAINER` | **Subject Trainer** | Reviewing candidate continuous assessment coursework, validating practical logs, approving/returning/rejecting individual units, supplying digital signatures/PIN clearance, and providing feedback notes. |
| `HOD` | **Head of Department** | Departmental oversight, validating that all units have achieved trainer verification, granting or withholding departmental endorsement with official remarks and digital signature. |
| `EXAM_OFFICE` | **Examination Officer** | Financial reconciliation verification, applying institutional seal and stamp, signing off candidate entry, and authorizing generation of the final QR-coded CDACC examination docket. |

---

## 4. End-to-End Business Workflow

```
[ STEP 1: Trainee ]
   Selects Level, Course, and Module (e.g., Cycle 1 / Module 2)
   Selects Units (Core & Common) & designates Attempt Type (First / Reassessment)
   Selects the Specific Trainer who taught each unit
   Submits Registration
         │
         ├──> System notifies assigned Subject Trainers
         └──> System generates Admin Alert with detailed trainer assignments
         │
[ STEP 2: Subject Trainers ]
   Trainers log into their individual dashboards
   Review coursework, practicals, and continuous assessment
   Electronically Approve (with signature/PIN) or Flag/Return unit
         │
         v (Once 100% of units are Approved)
[ STEP 3: Head of Department (HOD) ]
   HOD receives "Ready for HOD Review" alert
   Inspects departmental candidates and trainer sign-offs
   Grants Departmental Approval with digital stamp & signature
         │
         v
[ STEP 4: Examination Office ]
   Exam Officer verifies fee compliance & clearance status
   Applies Institutional Seal & official Exam Office authorization
         │
         v
[ STEP 5: Final Candidate Docket Issued ]
   Status changes to "APPROVED / CLEARED"
   Trainee downloads/prints official CDACC Examination Docket
   Invigilators scan QR code at the exam room door for instant verification
```

---

## 5. Trainee Registration & Trainer Selection Logic

### Flexible Trainer Allocation
- The System Administrator manages the Master List of Subject Trainers (Names, Staff IDs, Departments, Emails, and Phone Numbers).
- During registration, trainees choose their course units and **select which trainer taught them for that specific unit**.
- This accommodates scenarios where multiple trainers teach different streams, classes, or modules within the same institution.

### Fee Calculation & Reassessment Support
- **First Attempt Units**: Included in regular institutional tuition or charged at standard entry rates.
- **Reassessment Units**: Flagged by the trainee with `attemptType: 'REASSESSMENT'`. The system calculates per-unit reassessment fees (default: KES 2,000 per unit).
- **Tuition & Balance Protection**: Summarizes total amounts charged, breakdown of fees, and generates receipt references.

### Backwards Compatibility: Numeric Modules & Cohort Cycles
- Supports traditional numeric modules (`Module 1`, `Module 2`, `Module 3`).
- Fully supports TVET CDACC cohort terms (`Cycle 1`, `Cycle 2`). Database columns dynamically handle alphanumeric module labels.

---

## 6. Trainer Verification & Sign-off Engine

### Trainer Verification Dashboard
When a subject trainer logs in (using their Staff ID or institutional email):
1. **Queue Matching**: The engine scans all candidate registrations and matches units where `unit.trainerId`, `unit.trainerName`, or staff number matches the logged-in trainer.
2. **Key Metric Indicators**:
   - **Pending Verification**: Units awaiting evaluation.
   - **Approved Units**: Units signed off.
   - **Flagged / Returned**: Units sent back for continuous assessment revision.
3. **Verification Modal**:
   - Coursework validation checklist.
   - Decision selection: **APPROVED**, **RETURNED (For Correction)**, or **REJECTED**.
   - Justification remarks (e.g., *"Passed all 3 practical projects and scored 74% in internal CATs"*).
   - Sign-off method: Draw e-signature on the interactive canvas or enter a 4-digit security PIN.
4. **Batch Approval**: Fast-track clearance option allowing trainers to sign off on multiple verified candidates in a single action.

---

## 7. System Administrator Monitoring & Trainer Alert Subsystem

The **Trainer Clearances & Alerts** tab in the Admin Dashboard provides oversight over pending clearances:

### Real-Time Admin Alerts
- Immediately upon a candidate's submission, an in-app notification is routed to the `ADMIN` role.
- Outlines the trainee's name, admission number, module, and a complete breakdown of every assigned trainer and their respective units.

### Monitoring Views
- **By Trainer (Default)**: Groups pending units by subject trainer. Shows contact details (phone, email), number of candidates waiting, and specific unit codes.
- **By Trainee**: Displays all candidate registration dossiers, their course, module, submission timestamp, and the status of each assigned unit.

### One-Click Alert Actions
1. **Send In-App Alert**: Dispatches a high-priority notification directly to the specific trainer's account.
2. **Copy WhatsApp / SMS Message**: Copies an institutional clearance reminder to the clipboard, ready to paste into WhatsApp staff groups or SMS gateways:
   ```text
   *TSNP ASSESSMENT CLEARANCE ALERT*

   Dear Douglas Omutanyi (Staff ID: TSNP/TR/005),
   You have 2 pending assessment unit(s) submitted by 1 candidate(s) awaiting your electronic verification on the TSNP Examination Portal:
   - Candidates: Brenda kavere musoga (L5ICT/13903/24M)
   Please log in to your trainer portal account to review continuous assessment records and clear the units.
   _TSNP Examination & Assessment Directorate_
   ```
3. **Alert All Pending Trainers**: Single-click broadcast triggering priority notifications to all trainers with outstanding tasks.

---

## 8. Departmental (HOD) & Examination Office Clearance

### Head of Department Gate
- Activates automatically once 100% of a candidate's units have achieved `APPROVED` status from trainers.
- HOD reviews the trainee's profile, unit list, and the signatures of all verifying trainers.
- Authorizes the registration with a departmental endorsement, comments, and signature.

### Examination Office Gate
- The final institutional clearance barrier.
- Checks fee clearance and validates that both trainer and HOD authorizations are present.
- Issues an institutional receipt number and applies the final exam office stamp.
- Transitions the status to `APPROVED`, unlocking the print-ready examination card.

---

## 9. QR Gateway & Cryptographic Docket Verification

### Tamper-Evident Examination Cards
- Exportable as high-resolution PDFs formatted according to TVET CDACC institutional guidelines.
- Features:
  - Trainee photo placeholder, National ID, Admission number, and Series title.
  - Itemized table of cleared units with trainer signatures.
  - Institutional seal, HOD sign-off, and Exam Office receipt number.

### Real-Time Mobile QR Gateway
- Every generated docket contains an embedded QR code pointing to the platform's verification endpoint:
  ```text
  /verify?ref=UR-2026-000105
  ```
- Examination room invigilators can scan the QR code with any standard smartphone camera.
- The portal instantly displays:
  - Trainee identity and passport details.
  - Genuine clearance status (**AUTHENTIC & CLEARED** vs. **UNAUTHORIZED / TAMPERED**).
  - List of approved units for which the student is authorized to sit.

---

## 10. Database Architecture & Schema Reference

The system relies on a PostgreSQL schema managed via Drizzle ORM:

```
├── departments             (id, name, code, hod_name, hod_user_id)
├── levels                  (id, name, level_number, description)
├── courses                 (id, name, code, department_id, level_id, total_modules)
├── trainers                (id, user_id, name, staff_number, email, phone, department_id)
├── units                   (id, course_id, unit_code, unit_name, module, category, credit_hours, nominal_fee)
├── unit_categories         (id, name, description, is_default, color)
├── assessment_series       (id, name, series_code, academic_year, start_date, end_date, registration_deadline, status)
├── users                   (id, name, email, phone, role, identifier_number, department_id, is_active, password)
├── students                (id, user_id, name, admission_number, course_id, department_id, current_module, status)
├── registrations           (id, registration_reference, student_id, student_name, admission_number, course_name, 
│                            module [TEXT], series_name, status, total_amount_charged, units [JSONB], 
│                            hod_approval [JSONB], exam_office_receipt [JSONB], audit_logs [JSONB])
├── notifications           (id, target_user_id, target_role, title, message, type, read, created_at, link_registration_id)
├── audit_logs_global       (id, timestamp, user_id, user_name, user_role, action, details, previous_status, new_status, ip_address)
└── institution_config      (id, data [JSONB], updated_at)
```

### Key JSONB Schemas
- **`registrations.units`**:
  ```json
  [
    {
      "id": "ru-1",
      "unitId": "unit-101",
      "unitCode": "IT/OS/ICT/CR/1/5",
      "unitName": "Perform Computer Networking",
      "category": "Core",
      "trainerId": "tr-1788506137954",
      "trainerName": "Douglas Omutanyi",
      "status": "APPROVED",
      "attemptType": "REASSESSMENT",
      "amountCharged": 2000,
      "verifiedAt": "2026-09-04T08:30:00Z",
      "verifiedByTrainerName": "Douglas Omutanyi",
      "decisionComment": "Continuous assessment completed successfully.",
      "signatureRef": "data:image/png;base64,..."
    }
  ]
  ```

---

## 11. REST API Specification

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/health` | Verifies server uptime, database pool latency, and table counts. |
| `GET` | `/api/bootstrap` | Bootstraps institutional data (departments, courses, units, registrations). |
| `POST` | `/api/registrations` | Saves or updates a candidate registration dossier. |
| `GET` | `/api/registrations` | Returns all registrations with parsed units and approval objects. |
| `POST` | `/api/trainers` | Creates a new subject trainer profile. |
| `POST` | `/api/notifications` | Emits a targeted in-app notification. |
| `PATCH` | `/api/notifications/:id/read` | Marks an individual notification as read. |
| `POST` | `/api/notifications/read-all` | Marks all notifications for a specific user as read. |
| `POST` | `/api/audit` | Inserts an immutable entry into the global audit trail. |
| `POST` | `/api/students/self-register` | Self-service registration endpoint for new candidates. |
| `POST` | `/api/config` | Updates institutional configurations (logo, seal, fee parameters). |

---

## 12. Deployment & Environment Configuration Guide

### 1. Environment Variables
Create a `.env` file in the project root:
```env
# Database Configuration (Neon PostgreSQL connection string)
DATABASE_URL="postgresql://neondb_owner:YOUR_SECRET@ep-sample-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Server Port (Default container port)
PORT=3000

# Node Environment
NODE_ENV=production
```

### 2. Installation & Build
```bash
# Install dependencies
npm install

# Run automated linter check
npm run lint

# Compile production bundle (Vite + esbuild server bundle)
npm run build

# Start production server
npm start
```

### 3. Docker / Container Execution
The app is fully compatible with Google Cloud Run, AWS ECS, Render, or Docker containers:
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 13. Troubleshooting, Backup & Disaster Recovery

### Common Scenarios

1. **Missing Pending Units for a Trainer**:
   - Check that the trainee assigned that specific trainer during unit selection.
   - Verify that the trainer's Staff ID or Name matches the registration unit record.
   - In the Admin Dashboard under **Trainer Clearances & Alerts**, look up the trainee to confirm assignment.

2. **Database Migration / Column Type Errors**:
   - If older databases have `module` defined as integer, the automatic migration in `src/db/index.ts` automatically executes:
     ```sql
     ALTER TABLE registrations ALTER COLUMN module TYPE TEXT USING module::text;
     ```

3. **Data Backup**:
   - To back up your Neon PostgreSQL database, execute standard pg_dump:
     ```bash
     pg_dump "$DATABASE_URL" -Fc > tsnp_cdacc_backup_$(date +%F).dump
     ```

---

*Document Author: Directorate of Examination, Assessment & ICT Systems*  
*The Shamberere National Polytechnic (TSNP)*  
*All Rights Reserved © 2026*
