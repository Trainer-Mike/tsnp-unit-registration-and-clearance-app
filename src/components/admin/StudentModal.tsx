import React, { useState, useEffect, useRef } from 'react';
import { Student, Course, Level, getMaxModulesForLevel, getModuleOptions, AcademicModule } from '../../types';
import { StorageService } from '../../services/storage';
import { X, GraduationCap, AlertCircle, Layers, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (student: Student) => void;
  editingStudent?: Student | null;
  courses: Course[];
  levels: Level[];
}

export const StudentModal: React.FC<StudentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingStudent,
  courses,
  levels,
}) => {
  const [formData, setFormData] = useState<Partial<Student>>({
    name: '',
    admissionNumber: 'TSNP/',
    email: '',
    phone: '',
    courseId: courses[0]?.id || '',
    levelId: levels[0]?.id || '',
    departmentId: 'dept-ci',
    currentModule: 1,
    status: 'ACTIVE',
    nationalId: '',
    password: 'student123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const selectedCourse = courses.find((c) => c.id === formData.courseId);
  const effectiveLevelId = formData.levelId || selectedCourse?.levelId || levels[0]?.id || '';
  const selectedLevel = levels.find((l) => l.id === effectiveLevelId);
  const maxModules = getMaxModulesForLevel(selectedLevel?.code || selectedLevel?.name, effectiveLevelId);
  const moduleOptions = getModuleOptions(selectedLevel?.code || selectedLevel?.name, effectiveLevelId);

  const prevIsOpenRef = useRef(false);
  const prevStudentIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const studentChanged = isOpen && editingStudent?.id !== prevStudentIdRef.current;

    if (justOpened || studentChanged) {
      if (editingStudent) {
        setFormData({
          ...editingStudent,
          currentModule: editingStudent.currentModule ?? (editingStudent as any).currentYearOfStudy ?? 1,
          password: editingStudent.password || 'student123',
        });
      } else {
        setFormData({
          id: `std-${Date.now()}`,
          userId: `usr-std-${Date.now()}`,
          name: '',
          admissionNumber: 'TSNP/DICT/2026/',
          email: '',
          phone: '07',
          courseId: courses[0]?.id || '',
          levelId: levels[0]?.id || '',
          departmentId: 'dept-ci',
          currentModule: 1, // Newly admitted students default to Module 1
          status: 'ACTIVE',
          nationalId: '',
          password: 'student123',
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevStudentIdRef.current = editingStudent?.id;
  }, [isOpen, editingStudent?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.admissionNumber?.trim()) {
      setError('Please provide Student Candidate Full Name and Admission Number.');
      return;
    }

    const assignedLevelId = formData.levelId || selectedCourse?.levelId || levels[0]?.id || '';
    const currentLvl = levels.find((l) => l.id === assignedLevelId);
    const maxMod = getMaxModulesForLevel(currentLvl?.code || currentLvl?.name, assignedLevelId);

    const rawMod = formData.currentModule;
    let chosenModule: AcademicModule = 1;
    if (rawMod === 'Cycle 1' || rawMod === 'Cycle 2') {
      chosenModule = rawMod;
    } else if (typeof rawMod === 'string' && rawMod.toLowerCase().startsWith('cycle')) {
      chosenModule = rawMod;
    } else {
      const parsed = Number(rawMod);
      chosenModule = !isNaN(parsed) ? Math.min(Math.max(parsed, 1), maxMod) : (rawMod || 1);
    }

    const studentToSave: Student = {
      id: formData.id || `std-${Date.now()}`,
      userId: formData.userId || `usr-std-${Date.now()}`,
      name: formData.name.trim(),
      admissionNumber: formData.admissionNumber.trim().toUpperCase(),
      email:
        formData.email?.trim() ||
        `${formData.admissionNumber?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@student.shambererenationalpoly.ac.ke`,
      phone: formData.phone?.trim() || '0700-000-000',
      courseId: formData.courseId || courses[0]?.id || '',
      levelId: assignedLevelId,
      departmentId: formData.departmentId || selectedCourse?.departmentId || 'dept-ci',
      currentModule: chosenModule,
      status: formData.status || 'ACTIVE',
      nationalId: formData.nationalId?.trim() || '',
      password: formData.password?.trim() || 'student123',
    };

    // Duplicate check on Admission Number and Email
    const allStudents = StorageService.getStudents();
    const existingAdm = allStudents.find(
      (s) => s.admissionNumber.trim().toUpperCase() === studentToSave.admissionNumber && s.id !== studentToSave.id
    );
    if (existingAdm) {
      setError(
        `Duplicate Admission Number! A student candidate with Admission No. "${studentToSave.admissionNumber}" already exists (${existingAdm.name}).`
      );
      return;
    }
    const existingEmail = allStudents.find(
      (s) => s.email.trim().toLowerCase() === studentToSave.email.toLowerCase() && s.id !== studentToSave.id
    );
    if (existingEmail) {
      setError(
        `Duplicate Email! A student candidate with Email address "${studentToSave.email}" already exists (${existingEmail.name}).`
      );
      return;
    }

    onSave(studentToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingStudent ? 'Edit Student Candidate' : 'Register New Student Candidate'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Candidate Full Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Sharon Awuor Odhiambo"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Admission Number *</label>
              <input
                type="text"
                value={formData.admissionNumber || ''}
                onChange={(e) => setFormData({ ...formData, admissionNumber: e.target.value })}
                placeholder="TSNP/DICT/2026/0890"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">National ID / Birth Cert No</label>
              <input
                type="text"
                value={formData.nationalId || ''}
                onChange={(e) => setFormData({ ...formData, nationalId: e.target.value })}
                placeholder="e.g. 38472910"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Enrolled Course *</label>
              <select
                value={formData.courseId || ''}
                onChange={(e) => {
                  const newCourseId = e.target.value;
                  const c = courses.find((crs) => crs.id === newCourseId);
                  setFormData({
                    ...formData,
                    courseId: newCourseId,
                    levelId: c?.levelId || formData.levelId,
                  });
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code} - {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Qualification Level</label>
              <select
                value={formData.levelId || ''}
                onChange={(e) => {
                  const newLvlId = e.target.value;
                  const lvl = levels.find((l) => l.id === newLvlId);
                  const maxM = getMaxModulesForLevel(lvl?.code || lvl?.name, newLvlId);
                  setFormData({
                    ...formData,
                    levelId: newLvlId,
                    currentModule: Math.min(formData.currentModule || 1, maxM),
                  });
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.code} ({l.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="s.awuor@student.shambererenationalpoly.ac.ke"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712-345-678"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block font-semibold text-slate-300 flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-400" /> Module / Cycle *
                </label>
                <span className="text-[10px] text-emerald-400 font-mono">Max: Mod {maxModules}</span>
              </div>
              <select
                value={String(formData.currentModule ?? 1)}
                onChange={(e) => {
                  const val = e.target.value;
                  const num = Number(val);
                  setFormData({ ...formData, currentModule: !isNaN(num) && val !== 'Cycle 1' && val !== 'Cycle 2' ? num : val });
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <optgroup label="Earlier Trainee Cohorts">
                  <option value="Cycle 1">Cycle 1 (Earlier Trainee Cohort)</option>
                  <option value="Cycle 2">Cycle 2 (Earlier Trainee Cohort)</option>
                </optgroup>
                <optgroup label="Standard Curriculum Modules">
                  {Array.from({ length: maxModules }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      Module {m} {m === 1 ? '(Admission Stage)' : m === maxModules ? '(Final Stage)' : ''}
                    </option>
                  ))}
                </optgroup>
              </select>
              <div className="text-[10px] text-slate-500 mt-1">
                Select Cycle 1 / Cycle 2 for earlier trainees or standard Modules 1–{maxModules}.
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">ACTIVE (Eligible)</option>
                <option value="SUSPENDED">SUSPENDED</option>
                <option value="GRADUATED">GRADUATED</option>
              </select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Account Access Password *
              </label>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, password: 'student123' })}
                className="text-[10px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                <KeyRound className="w-3 h-3" /> Set Default (student123)
              </button>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password || ''}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Candidate login password"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono text-xs pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition"
            >
              {editingStudent ? 'Update Student Candidate' : 'Save Student Candidate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
