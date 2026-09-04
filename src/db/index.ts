import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { sql } from 'drizzle-orm';
import * as schema from './schema';
import {
  INITIAL_INSTITUTION_CONFIG,
  INITIAL_DEPARTMENTS,
  INITIAL_LEVELS,
  INITIAL_COURSES,
  INITIAL_TRAINERS,
  INITIAL_STUDENTS,
  INITIAL_UNITS,
  INITIAL_UNIT_CATEGORIES,
  INITIAL_ASSESSMENT_SERIES,
  INITIAL_USERS,
  INITIAL_REGISTRATIONS,
  INITIAL_NOTIFICATIONS,
} from '../services/demoData';

let dbInstance: ReturnType<typeof drizzle<typeof schema>> | null = null;
let clientInstance: postgres.Sql | null = null;
let currentConnUrl: string | null = null;
let schemaInitialized = false;

export function parseConnectionString(rawInput?: string): string | null {
  if (!rawInput) return null;
  let str = rawInput.trim();

  // Strip wrapping quotes (double, single, backticks)
  str = str.replace(/^["'`]+|["'`]+$/g, '').trim();
  // Strip escaped quotes like \"
  str = str.replace(/\\"/g, '"').replace(/^["']+|["']+$/g, '').trim();

  // If user pasted a full variable assignment like DATABASE_URL=postgresql://... or export DATABASE_URL="postgresql://..."
  // IMPORTANT: Only check for assignment prefixes if the string does NOT already start with postgres:// or postgresql://
  // This prevents URL query strings (such as ?sslmode=require) from being accidentally split!
  if (!str.startsWith('postgres://') && !str.startsWith('postgresql://')) {
    const match = str.match(/^(?:export\s+)?[A-Z0-9_]+\s*=\s*(.*)$/is);
    if (match && match[1]) {
      str = match[1].trim();
      str = str.replace(/^["'`]+|["'`]+$/g, '').trim();
      str = str.replace(/\\"/g, '"').replace(/^["']+|["']+$/g, '').trim();
    }
  }

  // Strip trailing semicolon or comma
  str = str.replace(/[;,]+$/, '').trim();

  if (str.startsWith('postgres://') || str.startsWith('postgresql://')) {
    return str;
  }
  return null;
}

export function isPlaceholderConnectionString(url: string): boolean {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const user = decodeURIComponent(parsed.username || '').toLowerCase();
    const pass = decodeURIComponent(parsed.password || '').toLowerCase();

    if (
      host.includes('sample') ||
      host.includes('example') ||
      host === 'ep-sample-pooler.region.neon.tech' ||
      user === 'user' ||
      user === 'username' ||
      pass === 'password' ||
      pass === 'your_password' ||
      user.includes('your_') ||
      pass.includes('your_')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function getConnectionString(): { url: string; sourceVar: string } | null {
  const envVars = [
    'DATABASE_URL',
    'POSTGRES_URL',
    'POSTGRES_URL_NON_POOLING',
    'POSTGRES_PRISMA_URL',
    'NEON_DATABASE_URL',
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

export function getDb() {
  const conn = getConnectionString();
  if (!conn) {
    if (clientInstance) {
      try {
        clientInstance.end();
      } catch {}
      clientInstance = null;
      dbInstance = null;
      currentConnUrl = null;
    }
    return null;
  }

  const connectionString = conn.url;

  // Do not attempt network connection if URL is an example placeholder
  if (isPlaceholderConnectionString(connectionString)) {
    return null;
  }

  if (!dbInstance || currentConnUrl !== connectionString) {
    if (clientInstance) {
      try {
        clientInstance.end();
      } catch {}
      clientInstance = null;
      dbInstance = null;
    }

    try {
      const parsedUrl = new URL(connectionString);
      if (!parsedUrl.hostname) {
        return null;
      }

      const isNeon = parsedUrl.hostname.includes('neon.tech') || connectionString.includes('sslmode=require');

      clientInstance = postgres(connectionString, {
        ssl: isNeon ? 'require' : false,
        max: 10,
        idle_timeout: 20,
        connect_timeout: 10,
        prepare: false, // Recommended for serverless environments (Neon/Vercel)
      });
      dbInstance = drizzle(clientInstance, { schema });
      currentConnUrl = connectionString;
    } catch (err) {
      console.warn('PostgreSQL database connection initialized with warning or invalid URL:', err);
      dbInstance = null;
      clientInstance = null;
      currentConnUrl = null;
      return null;
    }
  }

  return dbInstance;
}

// Real Neon Connectivity Health Check
export async function testDbConnection(): Promise<{
  connected: boolean;
  source: string;
  variableUsed?: string;
  host?: string;
  databaseName?: string;
  serverTime?: string;
  latencyMs?: number;
  tablesCount?: number;
  isPlaceholder?: boolean;
  message: string;
}> {
  const conn = getConnectionString();
  if (!conn) {
    const rawVal =
      process.env.DATABASE_URL ||
      process.env.POSTGRES_URL ||
      process.env.NEON_DATABASE_URL;

    if (rawVal) {
      return {
        connected: false,
        source: 'Neon PostgreSQL',
        message: `Database variable found (${rawVal.slice(0, 32)}...), but it could not be parsed into a valid postgresql:// URI. Please check formatting.`,
      };
    }

    return {
      connected: false,
      source: 'Neon PostgreSQL',
      message:
        'DATABASE_URL environment variable is not configured. Add your real Neon connection string in Google AI Studio Settings or Vercel Environment Variables.',
    };
  }

  let host = 'unknown';
  try {
    const parsed = new URL(conn.url);
    host = parsed.hostname;
  } catch {}

  // Check for placeholder credentials
  if (isPlaceholderConnectionString(conn.url)) {
    return {
      connected: false,
      source: 'Neon PostgreSQL',
      variableUsed: conn.sourceVar,
      host,
      isPlaceholder: true,
      message: `DATABASE_URL is currently using the example placeholder ("${host}" with sample credentials). To connect your real Neon database, replace this with your actual connection string from https://console.neon.tech.`,
    };
  }

  const db = getDb();
  if (!db) {
    return {
      connected: false,
      source: 'Neon PostgreSQL',
      variableUsed: conn.sourceVar,
      host,
      message: `Database URL in ${conn.sourceVar} could not establish a connection to ${host}.`,
    };
  }

  const startTime = Date.now();
  try {
    const result = await db.execute(
      sql`SELECT NOW() as current_time, current_database() as db_name, version() as version`
    );
    const latencyMs = Date.now() - startTime;
    const row = (result as any)[0] || (result as any).rows?.[0] || {};

    // Count existing tables in public schema
    const tablesRes = await db.execute(
      sql`SELECT COUNT(*)::int as count FROM information_schema.tables WHERE table_schema = 'public'`
    );
    const tablesCount = (tablesRes as any)[0]?.count || (tablesRes as any).rows?.[0]?.count || 0;

    return {
      connected: true,
      source: 'Neon PostgreSQL',
      variableUsed: conn.sourceVar,
      host,
      databaseName: row.db_name || 'neondb',
      serverTime: row.current_time ? new Date(row.current_time).toISOString() : new Date().toISOString(),
      latencyMs,
      tablesCount,
      message: `Successfully connected to Neon PostgreSQL (${row.db_name || 'neondb'} on ${host}). Latency: ${latencyMs}ms.`,
    };
  } catch (err: any) {
    return {
      connected: false,
      source: 'Neon PostgreSQL',
      variableUsed: conn.sourceVar,
      host,
      message: `Neon query failed on ${host}: ${err?.message || String(err)}`,
    };
  }
}

// Automatically create database tables and seed baseline institutional data if empty
export async function ensureSchemaAndSeed(): Promise<void> {
  const db = getDb();
  if (!db || schemaInitialized) return;

  try {
    // 1. Create tables if they do not exist
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

    // Ensure backwards-compatible column types for Cycle 1 / Cycle 2 strings
    try {
      await db.execute(sql`
        DO $$
        BEGIN
          BEGIN
            ALTER TABLE registrations ALTER COLUMN module TYPE TEXT USING module::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE students ALTER COLUMN current_module TYPE TEXT USING current_module::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
          BEGIN
            ALTER TABLE students ALTER COLUMN current_year_of_study TYPE TEXT USING current_year_of_study::text;
          EXCEPTION WHEN OTHERS THEN NULL;
          END;
        END $$;
      `);
    } catch (migErr) {
      console.warn('Column migration note:', migErr);
    }

    // 2. Check if users table is empty; if so, seed baseline data
    const userCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM users`);
    const count = (userCountRes as any)[0]?.count || (userCountRes as any).rows?.[0]?.count || 0;

    if (count === 0) {
      console.log('Neon PostgreSQL is empty. Seeding baseline institutional data...');

      for (const d of INITIAL_DEPARTMENTS) {
        await db.insert(schema.departments).values(d).onConflictDoNothing();
      }
      for (const l of INITIAL_LEVELS) {
        await db.insert(schema.levels).values(l).onConflictDoNothing();
      }
      for (const c of INITIAL_COURSES) {
        await db.insert(schema.courses).values(c).onConflictDoNothing();
      }
      for (const cat of INITIAL_UNIT_CATEGORIES) {
        await db.insert(schema.unitCategories).values(cat).onConflictDoNothing();
      }
      for (const u of INITIAL_UNITS) {
        await db.insert(schema.units).values({
          ...u,
          prerequisites: u.prerequisites as any,
        }).onConflictDoNothing();
      }
      for (const t of INITIAL_TRAINERS) {
        await db.insert(schema.trainers).values(t).onConflictDoNothing();
      }
      for (const s of INITIAL_STUDENTS) {
        await db.insert(schema.students).values({
          ...s,
          currentModule: String(s.currentModule ?? 1),
          currentYearOfStudy: String((s as any).currentYearOfStudy || 1),
        }).onConflictDoNothing();
      }
      for (const u of INITIAL_USERS) {
        await db.insert(schema.users).values(u).onConflictDoNothing();
      }
      for (const s of INITIAL_ASSESSMENT_SERIES) {
        await db.insert(schema.assessmentSeries).values(s).onConflictDoNothing();
      }
      for (const r of INITIAL_REGISTRATIONS) {
        await db.insert(schema.registrations).values({
          ...r,
          module: String(r.module ?? 1),
          units: r.units as any,
          hodApproval: r.hodApproval as any,
          examOfficeReceipt: r.examOfficeReceipt as any,
          auditLogs: r.auditLogs as any,
        }).onConflictDoNothing();
      }
      for (const n of INITIAL_NOTIFICATIONS) {
        await db.insert(schema.notifications).values(n).onConflictDoNothing();
      }
      await db.insert(schema.institutionConfig).values({
        id: 'default_config',
        data: INITIAL_INSTITUTION_CONFIG as any,
      }).onConflictDoNothing();

      console.log('✅ Baseline institutional data seeded successfully into Neon PostgreSQL!');
    }

    schemaInitialized = true;
  } catch (err) {
    console.error('Error in ensureSchemaAndSeed:', err);
  }
}

export { schema };
