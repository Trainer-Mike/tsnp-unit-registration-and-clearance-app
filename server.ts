import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { testDbConnection } from './src/db/index';
import { serverStorage } from './src/server/serverStorage';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Middleware to restore x-matched-path if rewritten by Vercel
app.use((req, res, next) => {
  const matched = (req.headers['x-matched-path'] || req.headers['x-vercel-matched-path']) as string;
  if (matched && typeof matched === 'string' && matched.startsWith('/api') && (req.url === '/' || req.url === '/api')) {
    req.url = matched;
  }
  next();
});

const apiRouter = express.Router();

apiRouter.get('/', (req, res) => {
  return res.json({
    status: 'ok',
    service: 'TSNP Assessment & Clearance API',
    institution: 'The Shamberere National Polytechnic',
    timestamp: new Date().toISOString(),
  });
});

// --- Real Neon PostgreSQL Connectivity Health Check ---
apiRouter.get('/health', async (req, res) => {
  const dbHealth = await testDbConnection();
  const state = await serverStorage.getBootstrapData();

  return res.json({
    status: dbHealth.connected ? 'ok' : 'degraded',
    database: {
      provider: 'Neon PostgreSQL',
      connected: dbHealth.connected,
      variableUsed: dbHealth.variableUsed,
      host: dbHealth.host,
      isPlaceholder: dbHealth.isPlaceholder,
      message: dbHealth.message,
      latencyMs: dbHealth.latencyMs,
      databaseName: dbHealth.databaseName,
      serverTime: dbHealth.serverTime,
      tablesCount: dbHealth.tablesCount,
    },
    metrics: {
      registeredStudentsCount: state.students.length,
      registeredCandidatesCount: state.registrations.length,
      activeSeriesCount: state.series.filter((s) => s.status === 'ACTIVE').length,
      lastUpdated: state.lastUpdated,
    },
  });
});

// Dedicated DB Diagnostic Endpoint
apiRouter.get('/db-check', async (req, res) => {
  const dbHealth = await testDbConnection();
  return res.status(dbHealth.connected ? 200 : 503).json({
    success: dbHealth.connected,
    ...dbHealth,
  });
});

// --- App Data Bootstrap Endpoint (Single Source of Truth) ---
apiRouter.get('/bootstrap', async (req, res) => {
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
      lastUpdated: data.lastUpdated,
    });
  } catch (err: any) {
    console.error('Bootstrap error:', err);
    return res.status(500).json({ error: err?.message || 'Bootstrap error' });
  }
});

// --- Registrations API ---
apiRouter.get('/registrations', async (req, res) => {
  try {
    const regs = await serverStorage.getRegistrations();
    return res.json({ success: true, registrations: regs });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/registrations', async (req, res) => {
  try {
    const regData = req.body;
    if (!regData || !regData.id) {
      return res.status(400).json({ error: 'Invalid registration payload' });
    }
    const saved = await serverStorage.saveRegistration(regData);
    return res.json({ success: true, registration: saved });
  } catch (err: any) {
    console.error('Error saving registration:', err);
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.patch('/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = await serverStorage.updateRegistration(id, updates);
    return res.json({ success: true, registration: updated });
  } catch (err: any) {
    console.error('Error updating registration:', err);
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/registrations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteRegistration(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/registrations/reset', async (req, res) => {
  try {
    await serverStorage.resetRegistrations();
    return res.json({ success: true, message: 'All student registrations have been reset.' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Users & Accounts API ---
apiRouter.get('/users', async (req, res) => {
  try {
    const users = await serverStorage.getUsers();
    return res.json({ success: true, users });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/users', async (req, res) => {
  try {
    const userData = req.body;
    if (!userData || !userData.id) {
      return res.status(400).json({ error: 'Invalid user payload' });
    }
    const saved = await serverStorage.saveUser(userData);
    return res.json({ success: true, user: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteUser(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Students API ---
apiRouter.get('/students', async (req, res) => {
  try {
    const students = await serverStorage.getStudents();
    return res.json({ success: true, students });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/students', async (req, res) => {
  try {
    const stuData = req.body;
    if (!stuData || !stuData.id) {
      return res.status(400).json({ error: 'Invalid student payload' });
    }
    const saved = await serverStorage.saveStudent(stuData);
    return res.json({ success: true, student: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteStudent(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Trainers API ---
apiRouter.get('/trainers', async (req, res) => {
  try {
    const trainers = await serverStorage.getTrainers();
    return res.json({ success: true, trainers });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/trainers', async (req, res) => {
  try {
    const trainerData = req.body;
    if (!trainerData || !trainerData.id) {
      return res.status(400).json({ error: 'Invalid trainer payload' });
    }
    const saved = await serverStorage.saveTrainer(trainerData);
    return res.json({ success: true, trainer: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/trainers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteTrainer(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Units API ---
apiRouter.get('/units', async (req, res) => {
  try {
    const units = await serverStorage.getUnits();
    return res.json({ success: true, units });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/units', async (req, res) => {
  try {
    const unitData = req.body;
    if (!unitData || !unitData.id) {
      return res.status(400).json({ error: 'Invalid unit payload' });
    }
    const saved = await serverStorage.saveUnit(unitData);
    return res.json({ success: true, unit: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/units/bulk', async (req, res) => {
  try {
    const unitsList = req.body?.units || [];
    const count = await serverStorage.saveUnitsBulk(unitsList);
    return res.json({ success: true, count });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/units/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteUnit(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Assessment Series API ---
apiRouter.get('/series', async (req, res) => {
  try {
    const series = await serverStorage.getSeries();
    return res.json({ success: true, series });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/series', async (req, res) => {
  try {
    const seriesData = req.body?.series || req.body;
    if (!seriesData || !seriesData.id) {
      return res.status(400).json({ error: 'Invalid series payload' });
    }
    const result = await serverStorage.saveSeries(seriesData);
    return res.json({ success: true, ...result });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/series/active', async (req, res) => {
  try {
    const { seriesId } = req.body;
    if (seriesId) {
      await serverStorage.activateSeries(seriesId);
    }
    return res.json({ success: true, seriesId, message: 'Series activated and student registrations reset to 0.' });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/series/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await serverStorage.deleteSeries(id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Courses, Levels, Departments, Categories API ---
apiRouter.post('/courses', async (req, res) => {
  try {
    const saved = await serverStorage.saveCourse(req.body);
    return res.json({ success: true, course: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/courses/:id', async (req, res) => {
  try {
    await serverStorage.deleteCourse(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/levels', async (req, res) => {
  try {
    const saved = await serverStorage.saveLevel(req.body);
    return res.json({ success: true, level: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/levels/:id', async (req, res) => {
  try {
    await serverStorage.deleteLevel(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/departments', async (req, res) => {
  try {
    const saved = await serverStorage.saveDepartment(req.body);
    return res.json({ success: true, department: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/departments/:id', async (req, res) => {
  try {
    await serverStorage.deleteDepartment(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/unit-categories', async (req, res) => {
  try {
    const saved = await serverStorage.saveUnitCategory(req.body);
    return res.json({ success: true, unitCategory: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.delete('/unit-categories/:id', async (req, res) => {
  try {
    await serverStorage.deleteUnitCategory(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Institution Config API ---
apiRouter.post('/config', async (req, res) => {
  try {
    const saved = await serverStorage.saveConfig(req.body);
    return res.json({ success: true, config: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- In-App Notifications API ---
apiRouter.post('/notifications', async (req, res) => {
  try {
    const saved = await serverStorage.createNotification(req.body);
    return res.json({ success: true, notification: saved });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.patch('/notifications/:id/read', async (req, res) => {
  try {
    await serverStorage.markNotificationRead(req.params.id);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

apiRouter.post('/notifications/read-all', async (req, res) => {
  try {
    await serverStorage.markAllNotificationsRead(req.body?.targetUserId);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- Global Audit Log API ---
apiRouter.post('/audit', async (req, res) => {
  try {
    await serverStorage.logAudit(req.body);
    return res.json({ success: true });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// --- System Reset Endpoint ---
apiRouter.post('/reset', async (req, res) => {
  try {
    const resetState = await serverStorage.resetToDefaults();
    return res.json({ success: true, state: resetState });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message });
  }
});

// Mount router on /api
app.use('/api', apiRouter);

// --- Start Standalone Server (Local / Container / Cloud Run) ---
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TSNP Clearance Server running on port ${PORT}`);
  });
}

// Only launch standalone listener when not in serverless environment
const isServerless = Boolean(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.LAMBDA_TASK_ROOT ||
  process.env.NETLIFY
);

if (!isServerless) {
  startServer();
}

// Export app for Vercel Serverless deployment
export default app;
