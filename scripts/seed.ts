import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../src/db/schema';
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
} from '../src/services/demoData';

async function seed() {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('No DATABASE_URL supplied');
    process.exit(1);
  }

  console.log('Connecting to Neon PostgreSQL...');
  const client = postgres(dbUrl, { ssl: 'require', max: 5 });
  const db = drizzle(client, { schema });

  try {
    console.log('Seeding departments...');
    for (const d of INITIAL_DEPARTMENTS) {
      await db.insert(schema.departments).values(d).onConflictDoNothing();
    }

    console.log('Seeding levels...');
    for (const l of INITIAL_LEVELS) {
      await db.insert(schema.levels).values(l).onConflictDoNothing();
    }

    console.log('Seeding courses...');
    for (const c of INITIAL_COURSES) {
      await db.insert(schema.courses).values(c).onConflictDoNothing();
    }

    console.log('Seeding unit categories...');
    for (const cat of INITIAL_UNIT_CATEGORIES) {
      await db.insert(schema.unitCategories).values(cat).onConflictDoNothing();
    }

    console.log('Seeding units...');
    for (const u of INITIAL_UNITS) {
      await db.insert(schema.units).values({
        ...u,
        prerequisites: u.prerequisites as any,
      }).onConflictDoNothing();
    }

    console.log('Seeding trainers...');
    for (const t of INITIAL_TRAINERS) {
      await db.insert(schema.trainers).values(t).onConflictDoNothing();
    }

    console.log('Seeding students...');
    for (const s of INITIAL_STUDENTS) {
      await db.insert(schema.students).values({
        ...s,
        currentModule: String(s.currentModule ?? 1),
        currentYearOfStudy: String((s as any).currentYearOfStudy || 1),
      }).onConflictDoNothing();
    }

    console.log('Seeding users...');
    for (const u of INITIAL_USERS) {
      await db.insert(schema.users).values(u).onConflictDoNothing();
    }

    console.log('Seeding assessment series...');
    for (const s of INITIAL_ASSESSMENT_SERIES) {
      await db.insert(schema.assessmentSeries).values(s).onConflictDoNothing();
    }

    console.log('Seeding registrations...');
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

    console.log('Seeding institution configuration...');
    await db.insert(schema.institutionConfig).values({
      id: 'default_config',
      data: INITIAL_INSTITUTION_CONFIG as any,
    }).onConflictDoNothing();

    console.log('✅ Neon PostgreSQL database seeded successfully!');
  } catch (err) {
    console.error('Error during seeding:', err);
  } finally {
    await client.end();
  }
}

seed();
