import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, Department } from '../../types';
import { StorageService } from '../../services/storage';
import { X, ShieldCheck, AlertCircle, KeyRound, Eye, EyeOff } from 'lucide-react';

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: User) => void;
  editingUser?: User | null;
  departments: Department[];
}

export const AdminUserModal: React.FC<AdminUserModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUser,
  departments,
}) => {
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    phone: '',
    role: 'ADMIN',
    identifierNumber: 'TSNP/ADM/',
    departmentId: departments[0]?.id || 'dept-ci',
    title: 'System Administrator',
    password: 'admin123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevUserIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    // Only reinitialize form data when the modal is opened from closed state,
    // or when switching to a different user to edit.
    const justOpened = isOpen && !prevIsOpenRef.current;
    const targetUserChanged = isOpen && editingUser?.id !== prevUserIdRef.current;

    if (justOpened || targetUserChanged) {
      if (editingUser) {
        setFormData({ ...editingUser, password: editingUser.password || 'admin123' });
      } else {
        setFormData({
          id: `usr-${Date.now()}`,
          name: '',
          email: '',
          phone: '07',
          role: 'ADMIN',
          identifierNumber: 'TSNP/ADM/001',
          departmentId: departments[0]?.id || 'dept-ci',
          title: 'System Administrator',
          password: 'admin123',
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevUserIdRef.current = editingUser?.id;
  }, [isOpen, editingUser?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.email?.trim() || !formData.identifierNumber?.trim()) {
      setError('Full Name, Official Email, and Staff/ID Number are required.');
      return;
    }

    const userToSave: User = {
      id: formData.id || `usr-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone?.trim() || '0700-000-000',
      role: formData.role || 'ADMIN',
      identifierNumber: formData.identifierNumber.trim().toUpperCase(),
      departmentId: formData.departmentId || departments[0]?.id || 'dept-ci',
      title: formData.title?.trim() || (formData.role === 'ADMIN' ? 'System Administrator' : 'Staff Member'),
      signatureDataUrl: formData.signatureDataUrl,
      password: formData.password?.trim() || 'admin123',
    };

    // Duplicate check on Staff/ID Number and Email
    const allUsers = StorageService.getUsers();
    const existingIdNo = allUsers.find(
      (u) =>
        u.identifierNumber?.trim().toUpperCase() === userToSave.identifierNumber &&
        u.id !== userToSave.id
    );
    if (existingIdNo) {
      setError(
        `Duplicate Staff / ID Number! A user with identifier "${userToSave.identifierNumber}" already exists (${existingIdNo.name}).`
      );
      return;
    }
    const existingEmail = allUsers.find(
      (u) =>
        u.email.trim().toLowerCase() === userToSave.email.toLowerCase() &&
        u.id !== userToSave.id
    );
    if (existingEmail) {
      setError(
        `Duplicate Email! A user with email "${userToSave.email}" already exists (${existingEmail.name}).`
      );
      return;
    }

    onSave(userToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingUser ? 'Edit System User Account' : 'Add New System Admin / Staff User'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-950/40 border border-rose-800/50 rounded-xl text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Full Name (with honorific) *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Eng. Dennis Murimi"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium min-h-[42px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Assigned Role *</label>
              <select
                value={formData.role || 'ADMIN'}
                onChange={(e) => {
                  const r = e.target.value as UserRole;
                  let defaultTitle = formData.title;
                  let defaultPass = formData.password;
                  if (r === 'ADMIN') { defaultTitle = 'System Administrator'; defaultPass = 'admin123'; }
                  if (r === 'HOD') { defaultTitle = 'Head of Department'; defaultPass = 'hod123'; }
                  if (r === 'EXAM_OFFICER') { defaultTitle = 'Registrar of Examinations'; defaultPass = 'exam123'; }
                  if (r === 'TRAINER') { defaultTitle = 'Subject Trainer'; defaultPass = 'trainer123'; }
                  if (r === 'STUDENT') { defaultTitle = 'Student Candidate'; defaultPass = 'student123'; }
                  setFormData({ ...formData, role: r, title: defaultTitle, password: defaultPass });
                }}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 min-h-[42px] cursor-pointer"
              >
                <option value="ADMIN">System Administrator</option>
                <option value="EXAM_OFFICER">Examinations Officer / Registrar</option>
                <option value="HOD">Head of Department (HOD)</option>
                <option value="TRAINER">Subject Trainer</option>
                <option value="STUDENT">Student Candidate</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Staff / ID Number *</label>
              <input
                type="text"
                value={formData.identifierNumber || ''}
                onChange={(e) => setFormData({ ...formData, identifierNumber: e.target.value })}
                placeholder="TSNP/ADM/002"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Email Address *</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="admin@shambererenationalpoly.ac.ke"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Contact</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712-345-678"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Department</label>
              <select
                value={formData.departmentId || ''}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px] cursor-pointer"
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Designation / Title</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Lead ICT Systems Administrator"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* User Password Configuration */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Account Login Password *</span>
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-[11px] text-emerald-400 hover:underline cursor-pointer flex items-center gap-1"
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                <span>{showPassword ? 'Hide' : 'Show'}</span>
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={formData.password || ''}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="e.g. admin123"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-emerald-300 font-mono rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
            <p className="text-[11px] text-slate-400">
              Provide this password to the user. They will log in using their <strong className="text-slate-300">Staff ID</strong> or <strong className="text-slate-300">Email</strong>.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl transition cursor-pointer min-h-[40px]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition cursor-pointer min-h-[40px]"
            >
              {editingUser ? 'Update User' : 'Create Staff Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

