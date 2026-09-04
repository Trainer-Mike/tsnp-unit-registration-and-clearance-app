import { getDb, ensureSchemaAndSeed } from '../db/index';
import {
  users as dbUsers,
  departments as dbDepartments,
  levels as dbLevels,
  courses as dbCourses,
  trainers as dbTrainers,
  students as dbStudents,
  units as dbUnits,
  unitCategories as dbUnitCategories,
  assessmentSeries as dbAssessmentSeries,
  registrations as dbRegistrations,
  notifications as dbNotifications,
  institutionConfig as dbInstitutionConfig,
  auditLogsGlobal as dbAuditLogsGlobal,
} from '../db/schema';
import { eq, desc } from 'drizzle-orm';
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

export interface ServerState {
  config: InstitutionConfig;
  departments: Department[];
  levels: Level[];
  courses: Course[];
  trainers: Trainer[];
  students: Student[];
  units: Unit[];
  unitCategories: UnitCategoryItem[];
  series: AssessmentSeries[];
  users: User[];
  registrations: Registration[];
  notifications: InAppNotification[];
  auditLogs: AuditLogItem[];
  lastUpdated: string;
  source: 'neon_postgresql' | 'memory_preview';
}

class ServerStorageService {
  // Ephemeral in-memory state used only when DATABASE_URL is not yet configured
  private memoryState: ServerState;

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
      lastUpdated: new Date().toISOString(),
      source: 'memory_preview',
    };
  }

  // --- Bootstrap Data: Neon PostgreSQL is the Single Source of Truth ---
  public async getBootstrapData(): Promise<ServerState> {
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
          logList,
        ] = await Promise.all([
          db.select().from(dbDepartments),
          db.select().from(dbLevels),
          db.select().from(dbCourses),
          db.select().from(dbTrainers),
          db.select().from(dbUnits),
          db.select().from(dbUnitCategories),
          db.select().from(dbAssessmentSeries),
          db.select().from(dbUsers),
          db.select().from(dbStudents),
          db.select().from(dbRegistrations).orderBy(desc(dbRegistrations.submittedAt)),
          db.select().from(dbNotifications).orderBy(desc(dbNotifications.createdAt)),
          db.select().from(dbInstitutionConfig).limit(1),
          db.select().from(dbAuditLogsGlobal).orderBy(desc(dbAuditLogsGlobal.timestamp)).limit(200),
        ]);

        return {
          config: (cfgList[0]?.data as any) || INITIAL_INSTITUTION_CONFIG,
          departments: (depList as any) || [],
          levels: (lvlList as any) || [],
          courses: (crsList as any) || [],
          trainers: (trnList as any) || [],
          units: (untList as any) || [],
          unitCategories: (catList as any) || [],
          series: (serList as any) || [],
          users: (usrList as any) || [],
          students: (stuList as any) || [],
          registrations: (regList as any) || [],
          notifications: (notList as any) || [],
          auditLogs: (logList as any) || [],
          lastUpdated: new Date().toISOString(),
          source: 'neon_postgresql',
        };
      } catch (err) {
        console.error('Neon PostgreSQL query error during bootstrap:', err);
      }
    }

    return this.memoryState;
  }

  // --- Registrations ---
  public async getRegistrations(): Promise<Registration[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const regs = await db.select().from(dbRegistrations).orderBy(desc(dbRegistrations.submittedAt));
        return regs as any;
      } catch (err) {
        console.error('Error fetching registrations from Neon:', err);
      }
    }
    return this.memoryState.registrations;
  }

  public async saveRegistration(reg: Registration): Promise<Registration> {
    const now = new Date().toISOString();
    const fullReg: Registration = {
      ...reg,
      lastUpdatedAt: now,
      submittedAt: reg.submittedAt || now,
    };

    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db
          .insert(dbRegistrations)
          .values({
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
            module: fullReg.module !== undefined ? String(fullReg.module) : '1',
            units: fullReg.units as any,
            totalAmount: fullReg.totalAmount,
            status: fullReg.status,
            submittedAt: fullReg.submittedAt,
            lastUpdatedAt: fullReg.lastUpdatedAt,
            hodApproval: fullReg.hodApproval as any,
            examOfficeReceipt: fullReg.examOfficeReceipt as any,
            rejectionReason: fullReg.rejectionReason,
            correctionComment: fullReg.correctionComment,
            resubmissionCount: fullReg.resubmissionCount || 0,
            auditLogs: fullReg.auditLogs as any,
          })
          .onConflictDoUpdate({
            target: dbRegistrations.id,
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
              module: fullReg.module !== undefined ? String(fullReg.module) : '1',
              units: fullReg.units as any,
              totalAmount: fullReg.totalAmount,
              status: fullReg.status,
              lastUpdatedAt: fullReg.lastUpdatedAt,
              hodApproval: fullReg.hodApproval as any,
              examOfficeReceipt: fullReg.examOfficeReceipt as any,
              rejectionReason: fullReg.rejectionReason,
              correctionComment: fullReg.correctionComment,
              resubmissionCount: fullReg.resubmissionCount || 0,
              auditLogs: fullReg.auditLogs as any,
            },
          });
      } catch (err) {
        console.error('Neon PostgreSQL registration write error:', err);
      }
    }

    const idx = this.memoryState.registrations.findIndex((r) => r.id === reg.id);
    if (idx >= 0) this.memoryState.registrations[idx] = fullReg;
    else this.memoryState.registrations.unshift(fullReg);

    return fullReg;
  }

  public async updateRegistration(id: string, updates: Partial<Registration>): Promise<Registration | null> {
    const db = getDb();
    const now = new Date().toISOString();

    if (db) {
      try {
        await ensureSchemaAndSeed();
        const updatePayload: any = { ...updates, lastUpdatedAt: now };
        if (updates.module !== undefined) updatePayload.module = String(updates.module);

        await db.update(dbRegistrations).set(updatePayload).where(eq(dbRegistrations.id, id));

        const rows = await db.select().from(dbRegistrations).where(eq(dbRegistrations.id, id));
        if (rows.length > 0) return rows[0] as any;
      } catch (err) {
        console.error('Neon PostgreSQL registration update error:', err);
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

  public async deleteRegistration(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbRegistrations).where(eq(dbRegistrations.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL registration delete error:', err);
      }
    }
    this.memoryState.registrations = this.memoryState.registrations.filter((r) => r.id !== id);
  }

  public async resetRegistrations(): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbRegistrations);
      } catch (err) {
        console.error('Neon PostgreSQL registration reset error:', err);
      }
    }
    this.memoryState.registrations = [];
  }

  // --- Users ---
  public async getUsers(): Promise<User[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(dbUsers);
        return rows as any;
      } catch (err) {
        console.error('Neon PostgreSQL users fetch error:', err);
      }
    }
    return this.memoryState.users;
  }

  public async saveUser(user: User): Promise<User> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbUsers).values(user).onConflictDoUpdate({
          target: dbUsers.id,
          set: user,
        });
      } catch (err) {
        console.error('Neon PostgreSQL user write error:', err);
      }
    }

    const idx = this.memoryState.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) this.memoryState.users[idx] = { ...this.memoryState.users[idx], ...user };
    else this.memoryState.users.push(user);

    return user;
  }

  public async deleteUser(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbUsers).where(eq(dbUsers.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL user delete error:', err);
      }
    }
    this.memoryState.users = this.memoryState.users.filter((u) => u.id !== id);
  }

  // --- Students ---
  public async getStudents(): Promise<Student[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(dbStudents);
        return rows as any;
      } catch (err) {
        console.error('Neon PostgreSQL students fetch error:', err);
      }
    }
    return this.memoryState.students;
  }

  public async saveStudent(student: Student): Promise<Student> {
    const formattedStu = {
      ...student,
      currentModule: student.currentModule !== undefined ? String(student.currentModule) : '1',
      currentYearOfStudy: (student as any).currentYearOfStudy !== undefined ? String((student as any).currentYearOfStudy) : '1',
    };

    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbStudents).values(formattedStu).onConflictDoUpdate({
          target: dbStudents.id,
          set: formattedStu,
        });
      } catch (err) {
        console.error('Neon PostgreSQL student write error:', err);
      }
    }

    const idx = this.memoryState.students.findIndex((s) => s.id === student.id);
    if (idx >= 0) this.memoryState.students[idx] = { ...this.memoryState.students[idx], ...student };
    else this.memoryState.students.push(student);

    return student;
  }

  public async deleteStudent(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbStudents).where(eq(dbStudents.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL student delete error:', err);
      }
    }
    this.memoryState.students = this.memoryState.students.filter((s) => s.id !== id);
  }

  // --- Trainers ---
  public async getTrainers(): Promise<Trainer[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(dbTrainers);
        return rows as any;
      } catch (err) {
        console.error('Neon PostgreSQL trainers fetch error:', err);
      }
    }
    return this.memoryState.trainers;
  }

  public async saveTrainer(trainer: Trainer): Promise<Trainer> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbTrainers).values(trainer).onConflictDoUpdate({
          target: dbTrainers.id,
          set: trainer,
        });
      } catch (err) {
        console.error('Neon PostgreSQL trainer write error:', err);
      }
    }

    const idx = this.memoryState.trainers.findIndex((t) => t.id === trainer.id);
    if (idx >= 0) this.memoryState.trainers[idx] = { ...this.memoryState.trainers[idx], ...trainer };
    else this.memoryState.trainers.push(trainer);

    return trainer;
  }

  public async deleteTrainer(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbTrainers).where(eq(dbTrainers.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL trainer delete error:', err);
      }
    }
    this.memoryState.trainers = this.memoryState.trainers.filter((t) => t.id !== id);
  }

  // --- Units ---
  public async getUnits(): Promise<Unit[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(dbUnits);
        return rows as any;
      } catch (err) {
        console.error('Neon PostgreSQL units fetch error:', err);
      }
    }
    return this.memoryState.units;
  }

  public async saveUnit(unit: Unit): Promise<Unit> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbUnits).values({
          ...unit,
          prerequisites: unit.prerequisites as any,
        }).onConflictDoUpdate({
          target: dbUnits.id,
          set: {
            ...unit,
            prerequisites: unit.prerequisites as any,
          },
        });
      } catch (err) {
        console.error('Neon PostgreSQL unit write error:', err);
      }
    }

    const idx = this.memoryState.units.findIndex((u) => u.id === unit.id);
    if (idx >= 0) this.memoryState.units[idx] = { ...this.memoryState.units[idx], ...unit };
    else this.memoryState.units.push(unit);

    return unit;
  }

  public async saveUnitsBulk(unitsList: Unit[]): Promise<number> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        for (const u of unitsList) {
          await db.insert(dbUnits).values({
            ...u,
            prerequisites: u.prerequisites as any,
          }).onConflictDoUpdate({
            target: dbUnits.id,
            set: {
              ...u,
              prerequisites: u.prerequisites as any,
            },
          });
        }
      } catch (err) {
        console.error('Neon PostgreSQL units bulk write error:', err);
      }
    }

    for (const u of unitsList) {
      const idx = this.memoryState.units.findIndex((unit) => unit.id === u.id);
      if (idx >= 0) this.memoryState.units[idx] = { ...this.memoryState.units[idx], ...u };
      else this.memoryState.units.push(u);
    }

    return unitsList.length;
  }

  public async deleteUnit(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbUnits).where(eq(dbUnits.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL unit delete error:', err);
      }
    }
    this.memoryState.units = this.memoryState.units.filter((u) => u.id !== id);
  }

  // --- Series ---
  public async getSeries(): Promise<AssessmentSeries[]> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        const rows = await db.select().from(dbAssessmentSeries);
        return rows as any;
      } catch (err) {
        console.error('Neon PostgreSQL series fetch error:', err);
      }
    }
    return this.memoryState.series;
  }

  public async saveSeries(series: AssessmentSeries): Promise<{ series: AssessmentSeries; resetApplied: boolean }> {
    const isActive = series.status === 'ACTIVE';

    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        if (isActive) {
          await db.update(dbAssessmentSeries).set({ status: 'CLOSED' });
          await db.delete(dbRegistrations);
        }
        await db.insert(dbAssessmentSeries).values(series).onConflictDoUpdate({
          target: dbAssessmentSeries.id,
          set: series,
        });
      } catch (err) {
        console.error('Neon PostgreSQL series write error:', err);
      }
    }

    if (isActive) {
      this.memoryState.series.forEach((s) => {
        if (s.id !== series.id && s.status === 'ACTIVE') s.status = 'CLOSED';
      });
      this.memoryState.registrations = [];
    }

    const idx = this.memoryState.series.findIndex((s) => s.id === series.id);
    if (idx >= 0) this.memoryState.series[idx] = series;
    else this.memoryState.series.unshift(series);

    return { series, resetApplied: isActive };
  }

  public async activateSeries(seriesId: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.update(dbAssessmentSeries).set({ status: 'CLOSED' });
        await db.update(dbAssessmentSeries).set({ status: 'ACTIVE' }).where(eq(dbAssessmentSeries.id, seriesId));
        await db.delete(dbRegistrations);
      } catch (err) {
        console.error('Neon PostgreSQL series activate error:', err);
      }
    }

    this.memoryState.series.forEach((s) => {
      if (s.id === seriesId) s.status = 'ACTIVE';
      else if (s.status === 'ACTIVE') s.status = 'CLOSED';
    });
    this.memoryState.registrations = [];
  }

  public async deleteSeries(seriesId: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbAssessmentSeries).where(eq(dbAssessmentSeries.id, seriesId));
      } catch (err) {
        console.error('Neon PostgreSQL series delete error:', err);
      }
    }
    this.memoryState.series = this.memoryState.series.filter((s) => s.id !== seriesId);
  }

  // --- Courses, Levels, Departments, Categories ---
  public async saveCourse(course: Course): Promise<Course> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbCourses).values(course).onConflictDoUpdate({
          target: dbCourses.id,
          set: course,
        });
      } catch (err) {
        console.error('Neon PostgreSQL course write error:', err);
      }
    }
    const idx = this.memoryState.courses.findIndex((c) => c.id === course.id);
    if (idx >= 0) this.memoryState.courses[idx] = course;
    else this.memoryState.courses.push(course);
    return course;
  }

  public async deleteCourse(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbCourses).where(eq(dbCourses.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL course delete error:', err);
      }
    }
    this.memoryState.courses = this.memoryState.courses.filter((c) => c.id !== id);
  }

  public async saveLevel(level: Level): Promise<Level> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbLevels).values(level).onConflictDoUpdate({
          target: dbLevels.id,
          set: level,
        });
      } catch (err) {
        console.error('Neon PostgreSQL level write error:', err);
      }
    }
    const idx = this.memoryState.levels.findIndex((l) => l.id === level.id);
    if (idx >= 0) this.memoryState.levels[idx] = level;
    else this.memoryState.levels.push(level);
    return level;
  }

  public async deleteLevel(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbLevels).where(eq(dbLevels.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL level delete error:', err);
      }
    }
    this.memoryState.levels = this.memoryState.levels.filter((l) => l.id !== id);
  }

  public async saveDepartment(department: Department): Promise<Department> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbDepartments).values(department).onConflictDoUpdate({
          target: dbDepartments.id,
          set: department,
        });
      } catch (err) {
        console.error('Neon PostgreSQL department write error:', err);
      }
    }
    const idx = this.memoryState.departments.findIndex((d) => d.id === department.id);
    if (idx >= 0) this.memoryState.departments[idx] = department;
    else this.memoryState.departments.push(department);
    return department;
  }

  public async deleteDepartment(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbDepartments).where(eq(dbDepartments.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL department delete error:', err);
      }
    }
    this.memoryState.departments = this.memoryState.departments.filter((d) => d.id !== id);
  }

  public async saveUnitCategory(category: UnitCategoryItem): Promise<UnitCategoryItem> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbUnitCategories).values(category).onConflictDoUpdate({
          target: dbUnitCategories.id,
          set: category,
        });
      } catch (err) {
        console.error('Neon PostgreSQL unit category write error:', err);
      }
    }
    const idx = this.memoryState.unitCategories.findIndex((c) => c.id === category.id);
    if (idx >= 0) this.memoryState.unitCategories[idx] = category;
    else this.memoryState.unitCategories.push(category);
    return category;
  }

  public async deleteUnitCategory(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.delete(dbUnitCategories).where(eq(dbUnitCategories.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL unit category delete error:', err);
      }
    }
    this.memoryState.unitCategories = this.memoryState.unitCategories.filter((c) => c.id !== id);
  }

  // --- Institution Config ---
  public async saveConfig(config: InstitutionConfig): Promise<InstitutionConfig> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbInstitutionConfig).values({
          id: 'default_config',
          data: config as any,
        }).onConflictDoUpdate({
          target: dbInstitutionConfig.id,
          set: {
            data: config as any,
          },
        });
      } catch (err) {
        console.error('Neon PostgreSQL config write error:', err);
      }
    }
    this.memoryState.config = { ...this.memoryState.config, ...config };
    return this.memoryState.config;
  }

  // --- Notifications ---
  public async createNotification(notif: InAppNotification): Promise<InAppNotification> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbNotifications).values({
          id: notif.id,
          targetRole: notif.targetRole,
          targetUserId: notif.targetUserId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          linkRegistrationId: notif.linkRegistrationId,
          read: notif.read,
          createdAt: notif.createdAt,
        }).onConflictDoNothing();
      } catch (err) {
        console.error('Neon PostgreSQL notification write error:', err);
      }
    }

    this.memoryState.notifications.unshift(notif);
    if (this.memoryState.notifications.length > 200) {
      this.memoryState.notifications.length = 200;
    }
    return notif;
  }

  public async markNotificationRead(id: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.update(dbNotifications).set({ read: true }).where(eq(dbNotifications.id, id));
      } catch (err) {
        console.error('Neon PostgreSQL notification read error:', err);
      }
    }

    const notif = this.memoryState.notifications.find((n) => n.id === id);
    if (notif) notif.read = true;
  }

  public async markAllNotificationsRead(targetUserId?: string): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        if (targetUserId) {
          await db.update(dbNotifications).set({ read: true }).where(eq(dbNotifications.targetUserId, targetUserId));
        } else {
          await db.update(dbNotifications).set({ read: true });
        }
      } catch (err) {
        console.error('Neon PostgreSQL notification mark all read error:', err);
      }
    }

    this.memoryState.notifications.forEach((n) => {
      if (!targetUserId || n.targetUserId === targetUserId) {
        n.read = true;
      }
    });
  }

  // --- Audit Logs ---
  public async logAudit(log: AuditLogItem): Promise<void> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        await db.insert(dbAuditLogsGlobal).values(log).onConflictDoNothing();
      } catch (err) {
        console.error('Neon PostgreSQL audit log write error:', err);
      }
    }

    this.memoryState.auditLogs.unshift(log);
    if (this.memoryState.auditLogs.length > 500) {
      this.memoryState.auditLogs.length = 500;
    }
  }

  // --- Reset to Baseline Institutional Defaults ---
  public async resetToDefaults(): Promise<ServerState> {
    const db = getDb();
    if (db) {
      try {
        await ensureSchemaAndSeed();
        // Clear all dynamic tables
        await db.delete(dbRegistrations);
        await db.delete(dbNotifications);
        await db.delete(dbAuditLogsGlobal);
      } catch (err) {
        console.error('Neon PostgreSQL reset error:', err);
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
      lastUpdated: new Date().toISOString(),
      source: db ? 'neon_postgresql' : 'memory_preview',
    };

    return this.getBootstrapData();
  }
}

export const serverStorage = new ServerStorageService();
