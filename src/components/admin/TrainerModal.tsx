import React, { useState, useEffect, useRef } from 'react';
import { Trainer, Department } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Users, AlertCircle, Lock, Eye, EyeOff, KeyRound } from 'lucide-react';

interface TrainerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (trainer: Trainer) => void;
  editingTrainer?: Trainer | null;
  departments: Department[];
}

export const TrainerModal: React.FC<TrainerModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTrainer,
  departments,
}) => {
  const [formData, setFormData] = useState<Partial<Trainer>>({
    name: '',
    email: '',
    staffNumber: '',
    departmentId: departments[0]?.id || 'dept-ci',
    phone: '',
    specialization: '',
    password: 'trainer123',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevTrainerIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const trainerChanged = isOpen && editingTrainer?.id !== prevTrainerIdRef.current;

    if (justOpened || trainerChanged) {
      if (editingTrainer) {
        setFormData({ ...editingTrainer, password: editingTrainer.password || 'trainer123' });
      } else {
        setFormData({
          id: `tr-${Date.now()}`,
          userId: `usr-tr-${Date.now()}`,
          name: '',
          email: '',
          staffNumber: 'TSNP/TR/',
          departmentId: departments[0]?.id || 'dept-ci',
          phone: '07',
          specialization: '',
          password: 'trainer123',
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevTrainerIdRef.current = editingTrainer?.id;
  }, [isOpen, editingTrainer?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.staffNumber?.trim()) {
      setError('Please provide Trainer Full Name and Staff ID Number.');
      return;
    }

    const trainerToSave: Trainer = {
      id: formData.id || `tr-${Date.now()}`,
      userId: formData.userId || `usr-tr-${Date.now()}`,
      name: formData.name.trim(),
      email: formData.email?.trim() || `${formData.staffNumber?.replace(/[^a-zA-Z0-9]/g, '').toLowerCase()}@shambererenationalpoly.ac.ke`,
      staffNumber: formData.staffNumber.trim().toUpperCase(),
      departmentId: formData.departmentId || departments[0]?.id || 'dept-ci',
      phone: formData.phone?.trim() || '0700-000-000',
      specialization: formData.specialization?.trim() || 'Computing & Informatics',
      signatureDataUrl: formData.signatureDataUrl,
      password: formData.password?.trim() || 'trainer123',
    };

    // Duplicate check on Staff Number and Email
    const allTrainers = StorageService.getTrainers();
    const existingStaff = allTrainers.find(
      (t) => t.staffNumber.trim().toUpperCase() === trainerToSave.staffNumber && t.id !== trainerToSave.id
    );
    if (existingStaff) {
      setError(`Duplicate Staff ID! A trainer with Staff Number "${trainerToSave.staffNumber}" already exists (${existingStaff.name}).`);
      return;
    }
    const existingEmail = allTrainers.find(
      (t) => t.email.trim().toLowerCase() === trainerToSave.email.toLowerCase() && t.id !== trainerToSave.id
    );
    if (existingEmail) {
      setError(`Duplicate Email! A trainer with Email address "${trainerToSave.email}" already exists (${existingEmail.name}).`);
      return;
    }

    onSave(trainerToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs my-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingTrainer ? 'Edit Subject Trainer Profile' : 'Add New Subject Trainer'}
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
            <label className="block font-semibold text-slate-300 mb-1">Trainer Full Name (with title) *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Mr. Samuel Otieno"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium min-h-[42px]"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Staff ID Number *</label>
              <input
                type="text"
                value={formData.staffNumber || ''}
                onChange={(e) => setFormData({ ...formData, staffNumber: e.target.value })}
                placeholder="TSNP/TR/104"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
                required
              />
            </div>

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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Official Email Address</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="s.otieno@shambererenationalpoly.ac.ke"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Phone Number</label>
              <input
                type="text"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0712-345-678"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
              />
            </div>
          </div>

          {/* Trainer Portal Login Password */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                <span>Trainer Portal Login Password *</span>
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
              placeholder="e.g. trainer123"
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-emerald-300 font-mono rounded-lg focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
            <p className="text-[11px] text-slate-400">
              Provide this password to the trainer. They can log in using their <strong className="text-slate-300">Staff ID</strong> or <strong className="text-slate-300">Email</strong>.
            </p>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Specialization / Subject Areas</label>
            <input
              type="text"
              value={formData.specialization || ''}
              onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
              placeholder="e.g. Cloud Infrastructure, System Administration & Cyber Security"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 min-h-[42px]"
            />
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
              {editingTrainer ? 'Update Trainer' : 'Save Trainer & Credentials'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
