import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  getDocs,
  deleteDoc,
  writeBatch,
  Firestore,
} from 'firebase/firestore';
import fs from 'fs';
import path from 'path';
import {
  InstitutionConfig,
  Department,
  Level,
  Course,
  Trainer,
  Student,
  Unit,
  UnitCategoryItem,
  AssessmentSeries,
  User,
  Registration,
  InAppNotification,
  AuditLogItem,
} from '../types';

let firestoreInstance: Firestore | null = null;
let firestoreInitialized = false;

export function getFirestoreDb(): Firestore | null {
  if (firestoreInstance) return firestoreInstance;

  try {
    const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
    if (!fs.existsSync(configPath)) {
      return null;
    }

    const raw = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(raw);

    if (!config.projectId || !config.firestoreDatabaseId) {
      return null;
    }

    const app = getApps().length === 0 ? initializeApp(config) : getApp();
    firestoreInstance = getFirestore(app, config.firestoreDatabaseId);
    return firestoreInstance;
  } catch (err) {
    console.warn('Firestore initialization error:', err);
    return null;
  }
}

export async function testFirestoreConnection(): Promise<{
  connected: boolean;
  databaseId?: string;
  projectId?: string;
  message: string;
}> {
  const db = getFirestoreDb();
  if (!db) {
    return {
      connected: false,
      message: 'Firestore configuration not found or invalid in firebase-applet-config.json',
    };
  }

  try {
    const testDocRef = doc(db, 'institution_config', 'default_config');
    const snap = await getDoc(testDocRef);
    const dbId = (db as any)._databaseId?.database || (db as any).databaseId || '(default)';
    return {
      connected: true,
      databaseId: dbId,
      projectId: db.app.options.projectId,
      message: `Successfully connected to Google Cloud Firestore (${dbId}).`,
    };
  } catch (err: any) {
    const dbId = (db as any)._databaseId?.database || (db as any).databaseId || '(default)';
    return {
      connected: false,
      databaseId: dbId,
      projectId: db.app.options.projectId,
      message: `Firestore connection error: ${err?.message || String(err)}`,
    };
  }
}

export class FirestoreStorageService {
  private static instance: FirestoreStorageService;

  public static getInstance(): FirestoreStorageService {
    if (!FirestoreStorageService.instance) {
      FirestoreStorageService.instance = new FirestoreStorageService();
    }
    return FirestoreStorageService.instance;
  }

  // --- Seed Initial Data to Firestore if Empty ---
  public async ensureFirestoreSeeded(initialData: {
    config: InstitutionConfig;
    departments: Department[];
    levels: Level[];
    courses: Course[];
    trainers: Trainer[];
    students: Student[];
    units: Unit[];
    categories: UnitCategoryItem[];
    series: AssessmentSeries[];
    users: User[];
    registrations: Registration[];
    notifications: InAppNotification[];
  }): Promise<void> {
    const db = getFirestoreDb();
    if (!db || firestoreInitialized) return;

    try {
      const cfgRef = doc(db, 'institution_config', 'default_config');
      const cfgSnap = await getDoc(cfgRef);

      if (!cfgSnap.exists()) {
        console.log('⚡ Seeding initial institutional data into Google Cloud Firestore...');
        await setDoc(cfgRef, { data: initialData.config, updatedAt: new Date().toISOString() });

        // Batch insert initial data
        const batch = writeBatch(db);

        for (const dep of initialData.departments) {
          batch.set(doc(db, 'departments', dep.id), dep);
        }
        for (const lvl of initialData.levels) {
          batch.set(doc(db, 'levels', lvl.id), lvl);
        }
        for (const crs of initialData.courses) {
          batch.set(doc(db, 'courses', crs.id), crs);
        }
        for (const trn of initialData.trainers) {
          batch.set(doc(db, 'trainers', trn.id), trn);
        }
        for (const unt of initialData.units) {
          batch.set(doc(db, 'units', unt.id), unt);
        }
        for (const cat of initialData.categories) {
          batch.set(doc(db, 'unit_categories', cat.id), cat);
        }
        for (const ser of initialData.series) {
          batch.set(doc(db, 'series', ser.id), ser);
        }
        for (const usr of initialData.users) {
          batch.set(doc(db, 'users', usr.id), usr);
        }
        for (const stu of initialData.students) {
          batch.set(doc(db, 'students', stu.id), stu);
        }
        for (const reg of initialData.registrations) {
          batch.set(doc(db, 'registrations', reg.id), reg);
        }
        for (const not of initialData.notifications) {
          batch.set(doc(db, 'notifications', not.id), not);
        }

        await batch.commit();
        console.log('✅ Baseline institutional data successfully seeded into Google Cloud Firestore!');
      }

      firestoreInitialized = true;
    } catch (err) {
      console.warn('Firestore seeding check error:', err);
    }
  }

  // --- Load Full State from Firestore ---
  public async loadAllData(): Promise<{
    config?: InstitutionConfig;
    departments: Department[];
    levels: Level[];
    courses: Course[];
    trainers: Trainer[];
    students: Student[];
    units: Unit[];
    categories: UnitCategoryItem[];
    series: AssessmentSeries[];
    users: User[];
    registrations: Registration[];
    notifications: InAppNotification[];
    auditLogs: AuditLogItem[];
  } | null> {
    const db = getFirestoreDb();
    if (!db) return null;

    try {
      const [
        cfgSnap,
        depsSnap,
        lvlsSnap,
        crssSnap,
        trnsSnap,
        stusSnap,
        untsSnap,
        catsSnap,
        sersSnap,
        usrsSnap,
        regsSnap,
        notsSnap,
        logsSnap,
      ] = await Promise.all([
        getDoc(doc(db, 'institution_config', 'default_config')),
        getDocs(collection(db, 'departments')),
        getDocs(collection(db, 'levels')),
        getDocs(collection(db, 'courses')),
        getDocs(collection(db, 'trainers')),
        getDocs(collection(db, 'students')),
        getDocs(collection(db, 'units')),
        getDocs(collection(db, 'unit_categories')),
        getDocs(collection(db, 'series')),
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'registrations')),
        getDocs(collection(db, 'notifications')),
        getDocs(collection(db, 'audit_logs')),
      ]);

      const config = cfgSnap.exists() ? (cfgSnap.data().data as InstitutionConfig) : undefined;
      const departments = depsSnap.docs.map((d) => d.data() as Department);
      const levels = lvlsSnap.docs.map((d) => d.data() as Level);
      const courses = crssSnap.docs.map((d) => d.data() as Course);
      const trainers = trnsSnap.docs.map((d) => d.data() as Trainer);
      const students = stusSnap.docs.map((d) => d.data() as Student);
      const units = untsSnap.docs.map((d) => d.data() as Unit);
      const categories = catsSnap.docs.map((d) => d.data() as UnitCategoryItem);
      const series = sersSnap.docs.map((d) => d.data() as AssessmentSeries);
      const users = usrsSnap.docs.map((d) => d.data() as User);
      const registrations = regsSnap.docs.map((d) => d.data() as Registration);
      const notifications = notsSnap.docs.map((d) => d.data() as InAppNotification);
      const auditLogs = logsSnap.docs.map((d) => d.data() as AuditLogItem);

      return {
        config,
        departments,
        levels,
        courses,
        trainers,
        students,
        units,
        categories,
        series,
        users,
        registrations,
        notifications,
        auditLogs,
      };
    } catch (err) {
      console.warn('Error loading all data from Firestore:', err);
      return null;
    }
  }

  // --- Document Write Helpers ---
  public async saveDocument(collectionName: string, id: string, data: any): Promise<boolean> {
    const db = getFirestoreDb();
    if (!db) return false;
    try {
      await setDoc(doc(db, collectionName, id), data, { merge: true });
      return true;
    } catch (err) {
      console.warn(`Firestore save error on ${collectionName}/${id}:`, err);
      return false;
    }
  }

  public async deleteDocument(collectionName: string, id: string): Promise<boolean> {
    const db = getFirestoreDb();
    if (!db) return false;
    try {
      await deleteDoc(doc(db, collectionName, id));
      return true;
    } catch (err) {
      console.warn(`Firestore delete error on ${collectionName}/${id}:`, err);
      return false;
    }
  }
}

export const firestoreStorage = FirestoreStorageService.getInstance();
