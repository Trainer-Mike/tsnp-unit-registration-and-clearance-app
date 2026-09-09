import React, { useState, useEffect, useRef } from 'react';
import { Course, Department, Level } from '../../types';
import { StorageService } from '../../services/storage';
import { X, GraduationCap, AlertCircle } from 'lucide-react';

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (course: Course) => void;
  editingCourse?: Course | null;
  departments: Department[];
  levels: Level[];
}

export const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingCourse,
  departments,
  levels,
}) => {
  const [formData, setFormData] = useState<Partial<Course>>({
    code: '',
    name: '',
    departmentId: departments[0]?.id || 'dept-ci',
    levelId: levels[0]?.id || '',
    durationSemesters: 6,
  });
  const [error, setError] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevCourseIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const courseChanged = isOpen && editingCourse?.id !== prevCourseIdRef.current;

    if (justOpened || courseChanged) {
      if (editingCourse) {
        setFormData({ ...editingCourse });
      } else {
        setFormData({
          id: `course-${Date.now()}`,
          code: '',
          name: '',
          departmentId: departments[0]?.id || 'dept-ci',
          levelId: levels[0]?.id || '',
          durationSemesters: 6,
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevCourseIdRef.current = editingCourse?.id;
  }, [isOpen, editingCourse?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim() || !formData.name?.trim()) {
      setError('Course Code and Course Name are required.');
      return;
    }

    const courseToSave: Course = {
      id: formData.id || `course-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      departmentId: formData.departmentId || departments[0]?.id || 'dept-ci',
      levelId: formData.levelId || levels[0]?.id || '',
      durationSemesters: Number(formData.durationSemesters) || 6,
    };

    // Duplicate check on course code or name
    const allCourses = StorageService.getCourses();
    const existingCode = allCourses.find(
      (c) => c.code.trim().toUpperCase() === courseToSave.code && c.id !== courseToSave.id
    );
    if (existingCode) {
      setError(`Duplicate Course Code! A course with code "${courseToSave.code}" already exists (${existingCode.name}).`);
      return;
    }
    const existingName = allCourses.find(
      (c) => c.name.trim().toLowerCase() === courseToSave.name.toLowerCase() && c.id !== courseToSave.id
    );
    if (existingName) {
      setError(`Duplicate Course Name! A course named "${courseToSave.name}" (${existingName.code}) already exists.`);
      return;
    }

    onSave(courseToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingCourse ? 'Edit Academic Course' : 'Add New Academic Course'}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Course Code *</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                placeholder="e.g. DICT"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Qualification Level</label>
              <select
                value={formData.levelId || ''}
                onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
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

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Course Full Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Diploma in Information Communication Technology"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={formData.departmentId || ''}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Duration (Semesters)</label>
              <input
                type="number"
                value={formData.durationSemesters || 6}
                onChange={(e) => setFormData({ ...formData, durationSemesters: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-mono"
              />
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
              {editingCourse ? 'Update Course' : 'Create Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
