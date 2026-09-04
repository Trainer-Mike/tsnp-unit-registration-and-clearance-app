# Neon / Cloud SQL Database Configuration Guide

This project is configured to use **Neon** (or any PostgreSQL instance) using **Drizzle ORM** with automated fallback to local memory/storage if `DATABASE_URL` is not supplied.

---

## 1. Getting Your Neon Connection String

1. Log in to [Neon Console](https://console.neon.tech).
2. Create or select your project.
3. On the dashboard, locate the **Connection Details** section.
4. Select **Node.js** or **Direct connection / Pooled connection** and copy the connection string.
   It looks like:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_xyz@ep-plain-glade-123456-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```

---

## 2. Setting Environment Variables

### In Vercel / Cloud Deployment:
1. Open your Vercel Project Settings -> **Environment Variables**.
2. Add a new variable:
   - **Key**: `DATABASE_URL`
   - **Value**: `postgresql://<user>:<password>@<host>/<dbname>?sslmode=require`
3. Redeploy your project.

### In Local Development:
1. Create or update `.env` in the project root:
   ```env
   DATABASE_URL="postgresql://<user>:<password>@<host>/<dbname>?sslmode=require"
   ```

---

## 3. Database Migration & Seeding

Run Drizzle schema migration to automatically generate the required relational tables:

```bash
# Push schema tables to Neon
npm run db:push
```

You can also visit `/api/seed` (POST) to populate all standard CDACC qualification courses, departments, assessment series, syllabus units, and administrative roles.

---

## 4. Tables Created in PostgreSQL

- `institution_config` - Institution details, fees, and clearance policies
- `departments` - Academic departments (Computing & Informatics, etc.)
- `levels` - Level 4 (Artisan), Level 5 (Certificate), Level 6 (Diploma)
- `courses` - Diploma and Certificate programs
- `unit_categories` - Basic, Common, Core categories
- `units` - CDACC unit codes, descriptions, and assigned trainers
- `trainers` - Trainer directories and assigned credentials
- `students` - Trainee records and academic module tracking
- `assessment_series` - Active & upcoming examination series
- `registrations` - Candidate assessment registrations, status workflows, and trainer verifications
- `notifications` - In-app clearance alerts and workflow status updates
- `audit_logs_global` - Administrative and verification audit trails
