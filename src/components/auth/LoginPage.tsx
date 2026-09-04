import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { User, Course, Level, AssessmentSeries, InstitutionConfig } from '../../types';
import { ThemeToggle } from '../ThemeToggle';
import { ForgotPasswordModal } from './ForgotPasswordModal';
import {
  Building,
  GraduationCap,
  ShieldCheck,
  KeyRound,
  UserPlus,
  QrCode,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  Calendar,
  Lock,
  Mail,
  User as UserIcon,
  Phone,
} from 'lucide-react';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onOpenPublicVerification: () => void;
  config: InstitutionConfig;
  activeSeries?: AssessmentSeries;
  courses: Course[];
  levels: Level[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onOpenPublicVerification,
  config,
  activeSeries,
  courses,
  levels,
}) => {
  const [activeTab, setActiveTab] = useState<'SIGN_IN' | 'REGISTER'>('SIGN_IN');

  // Sign In Form States
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [passwordResetToast, setPasswordResetToast] = useState('');
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Departments for self-registration
  const departments = StorageService.getDepartments();

  // Candidate Self Registration States
  const [regName, setRegName] = useState('');
  const [regAdmission, setRegAdmission] = useState('');
  const [regNationalId, setRegNationalId] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regDeptId, setRegDeptId] = useState(departments[0]?.id || 'dept-ci');
  const [regCourseId, setRegCourseId] = useState(courses[0]?.id || 'course-dict');
  const [regLevelId, setRegLevelId] = useState(levels[0]?.id || 'lvl-6');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regShowPassword, setRegShowPassword] = useState(false);
  const [regError, setRegError] = useState('');
  const [regSuccessMsg, setRegSuccessMsg] = useState('');

  // Filter courses by selected department
  const filteredCourses = courses.filter(
    (c) => !regDeptId || c.departmentId === regDeptId
  );

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    setTimeout(() => {
      const res = StorageService.login(identifier, password, rememberMe);
      setLoading(false);
      if (res.success && res.user) {
        onLoginSuccess(res.user);
      } else {
        setErrorMessage(res.error || 'Invalid credentials.');
      }
    }, 200);
  };

  const handleSelfRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');
    setRegSuccessMsg('');

    if (!regName.trim() || !regAdmission.trim() || !regEmail.trim()) {
      setRegError('Please complete all required fields (Full Name, Admission Number, Email).');
      return;
    }

    if (!regPassword || regPassword.length < 4) {
      setRegError('Password must be at least 4 characters long.');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('Password and Confirm Password do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const res = StorageService.registerNewStudent({
        name: regName.trim(),
        admissionNumber: regAdmission.trim().toUpperCase(),
        nationalId: regNationalId.trim() || undefined,
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim() || '0700-000-000',
        departmentId: regDeptId,
        courseId: regCourseId || courses[0]?.id || 'course-dict',
        levelId: regLevelId || levels[0]?.id || 'lvl-6',
        password: regPassword,
      }, rememberMe);

      setLoading(false);
      if (res.success && res.user) {
        setRegSuccessMsg('Registration successful! Launching your portal...');
        setTimeout(() => {
          onLoginSuccess(res.user!);
        }, 600);
      } else {
        setRegError(res.error || 'Could not complete registration. Please check your details.');
      }
    }, 300);
  };

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-hidden bg-slate-950 text-slate-100 flex flex-col justify-between selection:bg-cyan-500 selection:text-slate-950 transition-colors duration-200">
      {/* Top Institutional Notification Bar */}
      <header className="bg-slate-950/90 backdrop-blur-md border-b border-slate-800 text-slate-400 text-xs px-3 sm:px-6 lg:px-8 py-2.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Building className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-semibold text-slate-200 truncate">{config.institutionName}</span>
          <span className="text-slate-700 hidden md:inline">•</span>
          <span className="hidden md:inline text-slate-400 truncate">{config.departmentName}</span>
        </div>
        <div className="flex items-center gap-2.5 sm:gap-4 text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline text-slate-400">Assessment Series:</span>
            <span className="font-semibold text-cyan-300 font-mono bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-800/60 text-[11px] sm:text-xs">
              {activeSeries?.name}
            </span>
          </div>
          <button
            onClick={onOpenPublicVerification}
            className="text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1.5 transition hover:underline cursor-pointer text-xs"
          >
            <QrCode className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden xs:inline">Public QR</span> Verification
          </button>
          <ThemeToggle variant="pill" className="text-[11px] py-1" />
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-3.5 sm:p-6 lg:p-10 relative">
        <div className="w-full max-w-2xl bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/80 overflow-hidden flex flex-col my-auto">
          {/* Header Banner */}
          <div className="p-5 sm:p-7 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950/80 border-b border-slate-800 text-center">
            <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-400 text-xs font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Assessment Registration & Clearance Portal</span>
              <span className="text-cyan-600 hidden xs:inline">•</span>
              <span className="font-mono text-cyan-300 hidden xs:inline">{config.formReference}</span>
            </div>

            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-white tracking-tight">
              CDACC/TSNP Unit Assessment Registration & Clearance System
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1.5 max-w-lg mx-auto leading-relaxed">
              {config.institutionName} • {config.departmentName}
            </p>

            {/* Navigation Tabs */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-6 pt-4 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('SIGN_IN');
                  setErrorMessage('');
                }}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                  activeTab === 'SIGN_IN'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/70'
                }`}
              >
                <KeyRound className="w-4 h-4" />
                <span>Account Sign In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab('REGISTER');
                  setRegError('');
                }}
                className={`flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer min-h-[44px] ${
                  activeTab === 'REGISTER'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold shadow-lg shadow-emerald-500/25 border border-emerald-400/40'
                    : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/70'
                }`}
              >
                <UserPlus className="w-4 h-4" />
                <span>Candidate Self-Registration</span>
              </button>
            </div>
          </div>

          {/* Form Content Area */}
          <div className="p-5 sm:p-7 bg-slate-900/50">
            {/* 1. SIGN IN TAB */}
            {activeTab === 'SIGN_IN' && (
              <div className="max-w-md mx-auto">
                <div className="text-center mb-5">
                  <h2 className="text-base sm:text-lg font-bold text-white">Sign In to Your Account</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Candidates, Trainers, HODs, and Examination Officers
                  </p>
                </div>

                {passwordResetToast && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div className="flex-1 leading-relaxed font-semibold">{passwordResetToast}</div>
                  </div>
                )}

                {errorMessage && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{errorMessage}</div>
                  </div>
                )}

                <form onSubmit={handleSignInSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Admission Number / Staff ID / Email *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <UserIcon className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={identifier}
                        onChange={(e) => {
                          setIdentifier(e.target.value);
                          if (passwordResetToast) setPasswordResetToast('');
                        }}
                        placeholder="e.g. miketrainer@gmail.com or TSNP/DICT/2024/0482"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition min-h-[44px]"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="block text-xs font-semibold text-slate-300">
                        Account Password *
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setErrorMessage('');
                          setShowForgotPasswordModal(true);
                        }}
                        className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer transition flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        <span>Forgot password?</span>
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordResetToast) setPasswordResetToast('');
                        }}
                        placeholder="Enter your password"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                        aria-label="Toggle password visibility"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-4 h-4"
                      />
                      <span>Keep me signed in</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('REGISTER')}
                      className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer font-medium"
                    >
                      New candidate? Register
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-h-[46px]"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <span>Sign In to Portal</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* 2. CANDIDATE SELF-REGISTRATION TAB */}
            {activeTab === 'REGISTER' && (
              <div className="max-w-xl mx-auto">
                <div className="text-center mb-5">
                  <h2 className="text-base sm:text-lg font-bold text-white">Candidate Self-Registration</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Create your student profile to register units for continuous assessment clearance.
                  </p>
                </div>

                {regError && (
                  <div className="mb-4 p-3 rounded-xl bg-rose-950/60 border border-rose-800/60 text-rose-300 text-xs flex items-start gap-2.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{regError}</div>
                  </div>
                )}

                {regSuccessMsg && (
                  <div className="mb-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{regSuccessMsg}</div>
                  </div>
                )}

                <form onSubmit={handleSelfRegisterSubmit} className="space-y-3.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Full Name (as per national ID/birth cert) *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <UserIcon className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regName}
                          onChange={(e) => setRegName(e.target.value)}
                          placeholder="e.g. Dennis Omwenga"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Student Admission Number *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <GraduationCap className="w-4 h-4" />
                        </div>
                        <input
                          type="text"
                          required
                          value={regAdmission}
                          onChange={(e) => setRegAdmission(e.target.value)}
                          placeholder="e.g. TSNP/DICT/2026/0991"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-emerald-400 font-mono font-bold placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Email Address *
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Mail className="w-4 h-4" />
                        </div>
                        <input
                          type="email"
                          required
                          value={regEmail}
                          onChange={(e) => setRegEmail(e.target.value)}
                          placeholder="e.g. dennis@students.tsnp.ac.ke"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Phone Number / WhatsApp
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                          <Phone className="w-4 h-4" />
                        </div>
                        <input
                          type="tel"
                          value={regPhone}
                          onChange={(e) => setRegPhone(e.target.value)}
                          placeholder="0712-345-678"
                          className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        National ID / Birth Cert No.
                      </label>
                      <input
                        type="text"
                        value={regNationalId}
                        onChange={(e) => setRegNationalId(e.target.value)}
                        placeholder="e.g. 39128450"
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Department *
                      </label>
                      <select
                        value={regDeptId}
                        onChange={(e) => setRegDeptId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500 min-h-[44px] cursor-pointer"
                      >
                        {departments.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Course of Study *
                      </label>
                      <select
                        value={regCourseId}
                        onChange={(e) => setRegCourseId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500 min-h-[44px] cursor-pointer"
                      >
                        {filteredCourses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name} ({c.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Qualification Level *
                      </label>
                      <select
                        value={regLevelId}
                        onChange={(e) => setRegLevelId(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:ring-2 focus:ring-emerald-500 min-h-[44px] cursor-pointer"
                      >
                        {levels.map((lvl) => (
                          <option key={lvl.id} value={lvl.id}>
                            {lvl.name} ({lvl.code})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Password & Confirm Password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Create Password *
                      </label>
                      <div className="relative">
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regPassword}
                          onChange={(e) => setRegPassword(e.target.value)}
                          placeholder="Min 4 characters"
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1">
                        Confirm Password *
                      </label>
                      <div className="relative">
                        <input
                          type={regShowPassword ? 'text' : 'password'}
                          required
                          value={regConfirmPassword}
                          onChange={(e) => setRegConfirmPassword(e.target.value)}
                          placeholder="Re-enter password"
                          className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:ring-2 focus:ring-emerald-500 min-h-[44px]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400">
                      <input
                        type="checkbox"
                        checked={regShowPassword}
                        onChange={(e) => setRegShowPassword(e.target.checked)}
                        className="rounded border-slate-700 bg-slate-950 text-emerald-500 focus:ring-emerald-500 w-3.5 h-3.5"
                      />
                      <span>Show passwords</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setActiveTab('SIGN_IN')}
                      className="text-emerald-400 hover:text-emerald-300 hover:underline cursor-pointer font-medium"
                    >
                      Already have an account? Sign in
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-4 mt-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer min-h-[46px]"
                  >
                    {loading ? (
                      <span className="inline-block w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Create Candidate Account & Sign In</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Footer Security Notice */}
          <footer className="px-5 py-3.5 bg-slate-950/80 border-t border-slate-800 text-slate-400 text-[11px] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-cyan-400 shrink-0" />
              <span>Official Institutional Assessment Clearance Portal • Form {config.formReference}</span>
            </div>
            <div className="text-slate-500 font-mono text-[10px]">
              Developed by CI Department • Certified
            </div>
          </footer>
        </div>
      </main>

      {/* Institutional Bottom Bar */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-3 px-4 sm:px-6 text-center border-t border-slate-800">
        &copy; {new Date().getFullYear()} {config.institutionName} • {config.departmentName} • All Rights Reserved
      </footer>

      {/* Self-service Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPasswordModal}
        onClose={() => setShowForgotPasswordModal(false)}
        config={config}
        onPasswordResetSuccess={(id, newPwd) => {
          setIdentifier(id);
          setPassword(newPwd);
          setPasswordResetToast('Password successfully reset! You can now sign in with your new credentials.');
          setErrorMessage('');
        }}
      />
    </div>
  );
};
