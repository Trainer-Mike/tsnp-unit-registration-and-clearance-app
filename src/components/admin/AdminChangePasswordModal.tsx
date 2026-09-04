import React, { useState, useEffect, useRef } from 'react';
import { User, Student, Trainer } from '../../types';
import { StorageService } from '../../services/storage';
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  User as UserIcon,
  RefreshCw,
} from 'lucide-react';

interface AdminChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser?: User | null;
  targetStudent?: Student | null;
  targetTrainer?: Trainer | null;
  currentAdmin: User;
  allUsers?: User[];
  onPasswordChanged: (msg: string) => void;
}

export const AdminChangePasswordModal: React.FC<AdminChangePasswordModalProps> = ({
  isOpen,
  onClose,
  targetUser,
  targetStudent,
  targetTrainer,
  currentAdmin,
  allUsers = [],
  onPasswordChanged,
}) => {
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const prevIsOpenRef = useRef(false);
  const prevTargetIdRef = useRef<string | undefined>(undefined);

  const activeTargetId = targetUser?.id || targetStudent?.userId || targetStudent?.id || targetTrainer?.userId || targetTrainer?.id;

  // Initialize selected user
  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const targetChanged = isOpen && activeTargetId !== prevTargetIdRef.current;

    if (justOpened || targetChanged) {
      if (targetUser) {
        setSelectedUserId(targetUser.id);
      } else if (targetStudent) {
        setSelectedUserId(targetStudent.userId || targetStudent.id);
      } else if (targetTrainer) {
        setSelectedUserId(targetTrainer.userId || targetTrainer.id);
      } else if (allUsers.length > 0) {
        setSelectedUserId(allUsers[0].id);
      }
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    }

    prevIsOpenRef.current = isOpen;
    prevTargetIdRef.current = activeTargetId;
  }, [isOpen, activeTargetId]);

  if (!isOpen) return null;

  // Resolve current selected user details
  const currentSelectedUser =
    targetUser ||
    allUsers.find((u) => u.id === selectedUserId) ||
    (targetStudent
      ? {
          id: targetStudent.userId || targetStudent.id,
          name: targetStudent.name,
          role: 'STUDENT' as const,
          identifierNumber: targetStudent.admissionNumber,
          email: targetStudent.email,
        }
      : null) ||
    (targetTrainer
      ? {
          id: targetTrainer.userId || targetTrainer.id,
          name: targetTrainer.name,
          role: 'TRAINER' as const,
          identifierNumber: targetTrainer.staffNumber,
          email: targetTrainer.email,
        }
      : null);

  const generateRandomPassword = () => {
    const prefixes = ['Poly', 'Tsnp', 'Clear', 'Exam', 'Pass'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const num = Math.floor(1000 + Math.random() * 9000);
    const generated = `${prefix}@${num}`;
    setNewPassword(generated);
    setConfirmPassword(generated);
    setShowPassword(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!selectedUserId && !currentSelectedUser?.id) {
      setError('Please select a target user account.');
      return;
    }

    if (!newPassword || newPassword.length < 4) {
      setError('Password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    const targetId = currentSelectedUser?.id || selectedUserId;

    setTimeout(() => {
      const res = StorageService.adminChangeUserPassword({
        userId: targetId,
        newPassword: newPassword,
        adminUser: currentAdmin,
      });

      setLoading(false);
      if (res.success) {
        setSuccess(res.message);
        onPasswordChanged(res.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(res.message);
      }
    }, 250);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Administrative Password Override</h3>
              <p className="text-[11px] text-slate-400">Direct user credential reset & security sync</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed font-semibold">{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Target Account Selector or Display */}
          {targetUser || targetStudent || targetTrainer ? (
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target Account</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                  {currentSelectedUser?.role || 'USER'}
                </span>
              </div>
              <div className="font-bold text-white text-sm">{currentSelectedUser?.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                ID: <span className="text-emerald-400 font-bold">{currentSelectedUser?.identifierNumber}</span>
                {currentSelectedUser?.email && ` • ${currentSelectedUser?.email}`}
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Select Target User Account *
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white focus:ring-2 focus:ring-emerald-500"
              >
                {allUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.identifierNumber} - {u.role})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* New Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-300">
                New Account Password *
              </label>
              <button
                type="button"
                onClick={generateRandomPassword}
                className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Sparkles className="w-3 h-3" /> Generate Temporary Password
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                minLength={4}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                minLength={4}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 leading-relaxed">
            Note: Updating this password will immediately update the database and send an audit notification. The user can log in immediately with this new password.
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update User Password</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
