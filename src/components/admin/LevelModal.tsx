import React, { useState, useEffect, useRef } from 'react';
import { Level } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Layers, AlertCircle } from 'lucide-react';

interface LevelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (level: Level) => void;
  editingLevel?: Level | null;
}

export const LevelModal: React.FC<LevelModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingLevel,
}) => {
  const [formData, setFormData] = useState<Partial<Level>>({
    code: '',
    name: '',
    description: '',
  });
  const [error, setError] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevLevelIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const levelChanged = isOpen && editingLevel?.id !== prevLevelIdRef.current;

    if (justOpened || levelChanged) {
      if (editingLevel) {
        setFormData({ ...editingLevel });
      } else {
        setFormData({
          id: `lvl-${Date.now()}`,
          code: 'LEVEL ',
          name: '',
          description: '',
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevLevelIdRef.current = editingLevel?.id;
  }, [isOpen, editingLevel?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code?.trim() || !formData.name?.trim()) {
      setError('Level Code and Level Name are required.');
      return;
    }

    const levelToSave: Level = {
      id: formData.id || `lvl-${Date.now()}`,
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description?.trim() || '',
    };

    // Duplicate check on level code and name
    const allLevels = StorageService.getLevels();
    const existingCode = allLevels.find(
      (l) => l.code.trim().toUpperCase() === levelToSave.code && l.id !== levelToSave.id
    );
    if (existingCode) {
      setError(`Duplicate Level Code! A qualification level with code "${levelToSave.code}" already exists (${existingCode.name}).`);
      return;
    }
    const existingName = allLevels.find(
      (l) => l.name.trim().toLowerCase() === levelToSave.name.toLowerCase() && l.id !== levelToSave.id
    );
    if (existingName) {
      setError(`Duplicate Level Name! A qualification level named "${levelToSave.name}" already exists.`);
      return;
    }

    onSave(levelToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingLevel ? 'Edit Qualification Level' : 'Add Qualification Level'}
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
            <label className="block font-semibold text-slate-300 mb-1">Level Code *</label>
            <input
              type="text"
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              placeholder="e.g. LEVEL 6"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Level Display Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Level 6 (Diploma)"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Description / Framework Details</label>
            <input
              type="text"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="e.g. TVET CDACC National Diploma Qualification Framework"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
            />
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
              {editingLevel ? 'Update Level' : 'Create Level'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
