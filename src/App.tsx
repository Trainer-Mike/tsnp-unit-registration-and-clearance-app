import React, { useState, useEffect } from 'react';
import { StorageService } from './services/storage';
import {
  User,
  Student,
  Trainer,
  Registration,
  Unit,
  Course,
  Level,
  AssessmentSeries,
  InstitutionConfig,
  InAppNotification,
  UnitCategoryItem,
} from './types';
import { StudentDashboard } from './components/student/StudentDashboard';
import { TrainerDashboard } from './components/trainer/TrainerDashboard';
import { HODDashboard } from './components/hod/HODDashboard';
import { ExamOfficerDashboard } from './components/exam/ExamOfficerDashboard';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { NotificationCenter } from './components/NotificationCenter';
import { VerificationPortal } from './components/VerificationPortal';
import { LoginPage } from './components/auth/LoginPage';
import { ThemeToggle } from './components/ThemeToggle';
import { DatabaseStatusBadge } from './components/DatabaseStatusBadge';
import {
  GraduationCap,
  ShieldCheck,
  Building,
  Users,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  QrCode,
  RotateCcw,
  BookOpen,
  Award,
  ChevronDown,
  LogOut,
  User as UserIcon,
} from 'lucide-react';

export default function App() {
  // Application Reactive State
  const [currentUser, setCurrentUser] = useState<User>(StorageService.getCurrentUser());
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(StorageService.isAuthenticated());
  const [config, setConfig] = useState<InstitutionConfig>(StorageService.getConfig());
  const [registrations, setRegistrations] = useState<Registration[]>(StorageService.getRegistrations());
  const [units, setUnits] = useState<Unit[]>(StorageService.getUnits());
  const [courses, setCourses] = useState<Course[]>(StorageService.getCourses());
  const [levels, setLevels] = useState<Level[]>(StorageService.getLevels());
  const [trainers, setTrainers] = useState<Trainer[]>(StorageService.getTrainers());
  const [students, setStudents] = useState<Student[]>(StorageService.getStudents());
  const [assessmentSeriesList, setAssessmentSeriesList] = useState<AssessmentSeries[]>(
    StorageService.getAssessmentSeries()
  );
  const [unitCategories, setUnitCategories] = useState<UnitCategoryItem[]>(StorageService.getUnitCategories());
  const [users, setUsers] = useState<User[]>(StorageService.getUsers());
  const [notifications, setNotifications] = useState<InAppNotification[]>(StorageService.getNotifications());

  // Public QR verification portal state
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationRefInput, setVerificationRefInput] = useState('');

  // Synchronize state on custom store updates
  useEffect(() => {
    const handleStoreUpdate = () => {
      setCurrentUser(StorageService.getCurrentUser());
      setIsLoggedIn(StorageService.isAuthenticated());
      setConfig(StorageService.getConfig());
      setRegistrations(StorageService.getRegistrations());
      setUnits(StorageService.getUnits());
      setCourses(StorageService.getCourses());
      setLevels(StorageService.getLevels());
      setTrainers(StorageService.getTrainers());
      setStudents(StorageService.getStudents());
      setAssessmentSeriesList(StorageService.getAssessmentSeries());
      setUnitCategories(StorageService.getUnitCategories());
      setUsers(StorageService.getUsers());
      setNotifications(StorageService.getNotifications());
    };

    window.addEventListener('ourcs_store_updated', handleStoreUpdate);
    return () => {
      window.removeEventListener('ourcs_store_updated', handleStoreUpdate);
    };
  }, []);

  const handleLogout = () => {
    StorageService.logout();
    setIsLoggedIn(false);
  };

  const handleOpenVerification = (reference: string = '') => {
    setVerificationRefInput(reference);
    setVerificationModalOpen(true);
  };

  const handleResetData = () => {
    if (window.confirm('Reset all demo records back to fresh institution defaults?')) {
      StorageService.resetToDefaults();
    }
  };

  // Find linked student or trainer profiles
  const currentStudent = students.find(
    (s) => s.userId === currentUser.id || s.admissionNumber === currentUser.identifierNumber
  ) || students[0];

  const currentTrainer =
    trainers.find(
      (t) =>
        t.userId === currentUser.id ||
        t.staffNumber?.trim().toLowerCase() === currentUser.identifierNumber?.trim().toLowerCase() ||
        t.name?.trim().toLowerCase() === currentUser.name?.trim().toLowerCase()
    ) || trainers[0];

  const activeSeries = assessmentSeriesList.find((s) => s.status === 'ACTIVE') || assessmentSeriesList[0];

  // Render Login Page when logged out
  if (!isLoggedIn) {
    return (
      <>
        <LoginPage
          config={config}
          activeSeries={activeSeries}
          courses={courses}
          levels={levels}
          onLoginSuccess={(user) => {
            setCurrentUser(user);
            setIsLoggedIn(true);
          }}
          onOpenPublicVerification={() => handleOpenVerification()}
        />
        {verificationModalOpen && (
          <VerificationPortal
            initialReference={verificationRefInput}
            registrations={registrations}
            config={config}
            onClose={() => setVerificationModalOpen(false)}
          />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-200 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Institutional Header */}
      <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-40 shadow-lg shadow-black/40">
        {/* Top Strip */}
        <div className="bg-slate-950/90 text-slate-300 text-[11px] px-3 sm:px-6 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <span className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 shrink-0" /> {config.institutionName}
            </span>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <span className="text-slate-400 hidden sm:inline">{config.departmentName}</span>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-400 text-[10px] sm:text-xs">
              <Calendar className="w-3 h-3 text-cyan-400 shrink-0" />
              <span className="hidden xs:inline">Series:</span>
              <span className="font-mono font-semibold text-cyan-300 bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-800/60">
                {activeSeries?.name}
              </span>
            </div>

            <DatabaseStatusBadge />

            <button
              onClick={() => handleOpenVerification()}
              className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 hover:underline text-[10px] sm:text-[11px] transition cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 shrink-0" /> QR Gateway
            </button>

            {/* Top Bar Theme Toggle */}
            <ThemeToggle variant="pill" className="text-[11px] py-1" />
          </div>
        </div>

        {/* Main Nav Bar */}
        <div className="max-w-7xl w-full mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-700 text-white flex items-center justify-center font-extrabold text-lg sm:text-xl shadow-lg shadow-emerald-900/30 border border-emerald-400/30 shrink-0">
              <span className="tracking-tighter">TSNP</span>
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-sm sm:text-base md:text-lg font-bold text-white tracking-tight leading-snug truncate sm:whitespace-normal">
                TSNP Assessment Unit Registration & Clearance
              </h1>
              <p className="text-[11px] sm:text-xs text-slate-400 font-medium flex items-center gap-2 flex-wrap">
                <span>Form Ref: <strong className="font-mono text-cyan-400">{config.formReference}</strong></span>
                <span className="text-slate-600 hidden sm:inline">•</span>
                <span className="text-slate-400 hidden sm:inline">Certified System</span>
              </p>
            </div>
          </div>

          {/* Authenticated User Profile Badge, Theme Toggle, Notifications & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 w-full md:w-auto justify-between md:justify-end flex-wrap sm:flex-nowrap">
            {/* Logged-In User Identity Badge */}
            <div
              id="authenticated-user-badge"
              className="flex items-center gap-2 sm:gap-2.5 bg-slate-800/90 border border-slate-700/80 rounded-xl px-2.5 sm:px-3 py-1.5 backdrop-blur-xs min-w-0 max-w-full sm:max-w-xs shadow-xs"
              title={`Logged in as ${currentUser.name} (${currentUser.role})`}
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 border border-slate-600/60 flex items-center justify-center text-emerald-400 font-bold text-xs shrink-0 shadow-inner">
                {currentUser.role === 'STUDENT' ? (
                  <GraduationCap className="w-4 h-4 text-emerald-400" />
                ) : currentUser.role === 'TRAINER' ? (
                  <BookOpen className="w-4 h-4 text-cyan-400" />
                ) : currentUser.role === 'HOD' ? (
                  <Building className="w-4 h-4 text-amber-400" />
                ) : currentUser.role === 'EXAM_OFFICER' ? (
                  <Award className="w-4 h-4 text-purple-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-rose-400" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate leading-tight">
                  {currentUser.name}
                </div>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 truncate mt-0.5">
                  <span className="font-semibold text-emerald-400">
                    {currentUser.role === 'STUDENT'
                      ? 'Candidate'
                      : currentUser.role === 'TRAINER'
                      ? 'Trainer'
                      : currentUser.role === 'HOD'
                      ? 'HOD'
                      : currentUser.role === 'EXAM_OFFICER'
                      ? 'Exams Officer'
                      : 'Administrator'}
                  </span>
                  {currentUser.identifierNumber && (
                    <>
                      <span className="text-slate-600">•</span>
                      <span className="font-mono text-slate-300 truncate">{currentUser.identifierNumber}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Main Theme Toggle Button */}
            <ThemeToggle variant="button" />

            {/* In-App Notifications Dropdown */}
            <NotificationCenter
              currentUser={currentUser}
              notifications={notifications}
              registrations={registrations}
              onOpenRegistration={(regId) => {
                const reg = registrations.find((r) => r.id === regId);
                if (reg) {
                  handleOpenVerification(reg.registrationReference);
                }
              }}
            />

            {/* Sign Out / Logout Button */}
            <button
              id="logout-button"
              onClick={handleLogout}
              title="Sign out of current account"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/90 hover:bg-rose-950/80 text-slate-300 hover:text-rose-300 border border-slate-700/80 hover:border-rose-800/80 rounded-xl text-xs font-semibold transition shrink-0 shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Role Content View */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6">
        {currentUser.role === 'STUDENT' && (
          <StudentDashboard
            student={currentStudent}
            user={currentUser}
            registrations={registrations}
            courses={courses}
            levels={levels}
            units={units}
            assessmentSeriesList={assessmentSeriesList}
            config={config}
            onOpenVerificationPortal={handleOpenVerification}
          />
        )}

        {currentUser.role === 'TRAINER' && (
          <TrainerDashboard
            trainer={currentTrainer}
            user={currentUser}
            registrations={registrations}
            config={config}
            onOpenVerificationPortal={handleOpenVerification}
          />
        )}

        {currentUser.role === 'HOD' && (
          <HODDashboard
            user={currentUser}
            registrations={registrations}
            config={config}
            onOpenVerificationPortal={handleOpenVerification}
          />
        )}

        {currentUser.role === 'EXAM_OFFICER' && (
          <ExamOfficerDashboard
            user={currentUser}
            registrations={registrations}
            assessmentSeriesList={assessmentSeriesList}
            config={config}
            onOpenVerificationPortal={handleOpenVerification}
          />
        )}

        {currentUser.role === 'ADMIN' && (
          <AdminDashboard
            user={currentUser}
            courses={courses}
            levels={levels}
            units={units}
            trainers={trainers}
            students={students}
            assessmentSeriesList={assessmentSeriesList}
            unitCategories={unitCategories}
            users={users}
            registrations={registrations}
            config={config}
            onResetData={handleResetData}
            onOpenVerification={handleOpenVerification}
          />
        )}
      </main>

      {/* Public QR Verification Portal Gateway Modal */}
      {verificationModalOpen && (
        <VerificationPortal
          initialReference={verificationRefInput}
          registrations={registrations}
          config={config}
          onClose={() => setVerificationModalOpen(false)}
        />
      )}

      {/* Institutional Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800 mt-12 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="font-semibold text-slate-200">{config.institutionName}</span>
            <span className="text-slate-600">•</span>
            <span>{config.departmentName}</span>
            <span className="text-slate-600">•</span>
            <span className="font-mono text-emerald-400 font-semibold">{config.formReference}</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-400">
            <span>{config.postalAddress}</span>
            <span className="text-slate-600">•</span>
            <a href={`mailto:${config.email}`} className="text-emerald-400 hover:underline">
              {config.email}
            </a>
            <span className="text-slate-600">•</span>
            <span className="font-medium text-slate-300">Tel: {config.phone}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
