import React, { useState } from 'react';
import { StorageService } from '../../services/storage';
import { User, InstitutionConfig } from '../../types';
import {
  X,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Lock,
  ArrowRight,
  Eye,
  EyeOff,
  User as UserIcon,
  Search,
  RotateCcw,
} from 'lucide-react';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: InstitutionConfig;
  onPasswordResetSuccess: (identifier: string, newPassword: string) => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({
  isOpen,
  onClose,
  config,
  onPasswordResetSuccess,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [accountFound, setAccountFound] = useState<boolean | null>(null);
  const [matchedAccount, setMatchedAccount] = useState<{
    user?: User;
    maskedEmail?: string;
    maskedPhone?: string;
  } | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!identifier.trim()) {
      setError('Please enter your Admission Number, Staff ID, or Email Address.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = StorageService.findAccountForPasswordReset(identifier);
      setLoading(false);
      if (result.found && result.user) {
        setAccountFound(true);
        setMatchedAccount(result);
      } else {
        setAccountFound(false);
        setError('No registered account was found matching this identifier. Please check your spelling or contact the system administrator.');
      }
    }, 200);
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!newPassword || newPassword.length < 4) {
      setError('New password must be at least 4 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('The new password and confirmation password do not match.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const result = StorageService.resetPasswordWithVerification({
        identifierOrEmail: identifier,
        newPassword: newPassword,
      });

      setLoading(false);
      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onPasswordResetSuccess(identifier, newPassword);
          onClose();
        }, 1200);
      } else {
        setError(result.message);
      }
    }, 300);
  };

  const handleResetForm = () => {
    setAccountFound(null);
    setMatchedAccount(null);
    setNewPassword('');
    setConfirmPassword('');
    setError('');
    setSuccessMsg('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs my-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Reset Account Password</h3>
              <p className="text-[11px] text-slate-400">Self-service clearance credential recovery</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 cursor-pointer transition"
            aria-label="Close dialog"
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
        {successMsg && (
          <div className="p-3 bg-emerald-950/50 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
            <span className="leading-relaxed font-semibold">{successMsg}</span>
          </div>
        )}

        {/* STEP 1: Account Lookup */}
        {!accountFound && !successMsg && (
          <form onSubmit={handleLookup} className="space-y-4">
            <p className="text-slate-300 text-xs leading-relaxed">
              Enter your student admission number, staff ID, or registered email address to find and verify your account.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Admission No / Staff ID / Email *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  required
                  autoFocus
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. miketrainer@gmail.com or TSNP/DICT/2024/0482"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
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
                className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Search className="w-3.5 h-3.5" />
                    <span>Find Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* STEP 2: Set New Password */}
        {accountFound && matchedAccount?.user && !successMsg && (
          <form onSubmit={handleResetPassword} className="space-y-3.5">
            {/* Account Confirmation Card */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Account Verified</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                  {matchedAccount.user.role}
                </span>
              </div>
              <div className="font-bold text-white text-sm">{matchedAccount.user.name}</div>
              <div className="text-[11px] text-slate-400 font-mono">
                ID: <span className="text-emerald-400 font-bold">{matchedAccount.user.identifierNumber}</span>
                {matchedAccount.maskedEmail && ` • Email: ${matchedAccount.maskedEmail}`}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Password *
              </label>
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
                  placeholder="Enter new password (min 4 characters)"
                  className="w-full pl-9 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={handleResetForm}
                className="text-slate-400 hover:text-slate-200 text-xs flex items-center gap-1 cursor-pointer transition"
              >
                <RotateCcw className="w-3 h-3" /> Change ID
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-medium cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold rounded-xl shadow-lg transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span className="inline-block w-3.5 h-3.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
