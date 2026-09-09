# CDACC Examination Clearance & Registration Portal

Automated TVET CDACC Assessment Series Clearance, Trainer Verification, HOD Approval, and Exam Office Endorsement System.

---

## 🚀 Quick Start with Neon PostgreSQL & GitHub

### 1. Export to GitHub from AI Studio
1. In the top-right header menu of Google AI Studio, click the **Settings / Export** icon (or **Export to GitHub** / **Download ZIP**).
2. Choose **Export to GitHub** and select your GitHub account/repository.

---

### 2. Connect Your Neon PostgreSQL Database

1. Sign up / Log in to [Neon Console](https://console.neon.tech).
2. Create a new project (e.g. `cdacc-clearance`).
3. Under **Connection Details**, copy your pooled connection string:
   ```env
   DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
   ```

---

### 3. Setup Environment Variables

#### On Vercel / Render / Cloud Run:
Add the following Environment Variable in your deployment dashboard:
- `DATABASE_URL`: Your Neon connection string.

#### In Local Development:
Create a `.env` file in the root folder:
```env
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require"
```

---

### 4. Push Database Schema to Neon

Run Drizzle push to automatically create all relational tables:
```bash
npm install
npm run db:push
```

---

### 5. Automated Data Seeding

Once the server starts with `DATABASE_URL` configured, it will **automatically initialize & seed**:
- All CDACC qualification levels (Level 4, 5, 6)
- Academic departments & courses
- Syllabus units & assessment fees
- Active assessment series (`NOVEMBER/DECEMBER 2026 SERIES`)
- Institutional configurations and roles

You can also manually trigger a seed reset anytime by sending a `POST` request to `/api/seed`.

---

## 🛠 Tech Stack
- **Frontend**: React 19, Tailwind CSS, Motion, Lucide Icons, jsPDF & jsPDF-AutoTable
- **Backend**: Node.js, Express, tsx, esbuild
- **Database & ORM**: PostgreSQL (Neon-ready), Drizzle ORM, `postgres` driver
