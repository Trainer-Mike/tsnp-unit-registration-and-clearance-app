import React, { useState, useEffect, useRef } from 'react';
import { AssessmentSeries } from '../../types';
import { StorageService } from '../../services/storage';
import { X, Calendar, AlertCircle } from 'lucide-react';

interface SeriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (series: AssessmentSeries) => void;
  editingSeries?: AssessmentSeries | null;
}

export const SeriesModal: React.FC<SeriesModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSeries,
}) => {
  const [formData, setFormData] = useState<Partial<AssessmentSeries>>({
    name: '',
    year: '2026',
    openingDate: '2026-06-01',
    closingDate: '2026-09-30',
    status: 'ACTIVE',
  });
  const [error, setError] = useState<string>('');

  const prevIsOpenRef = useRef(false);
  const prevSeriesIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const seriesChanged = isOpen && editingSeries?.id !== prevSeriesIdRef.current;

    if (justOpened || seriesChanged) {
      if (editingSeries) {
        setFormData({ ...editingSeries });
      } else {
        setFormData({
          id: `series-${Date.now()}`,
          name: '',
          year: '2026',
          openingDate: '2026-06-01',
          closingDate: '2026-09-30',
          status: 'ACTIVE',
        });
      }
      setError('');
    }

    prevIsOpenRef.current = isOpen;
    prevSeriesIdRef.current = editingSeries?.id;
  }, [isOpen, editingSeries?.id]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name?.trim() || !formData.year?.trim()) {
      setError('Series Name and Academic Year are required.');
      return;
    }

    const seriesToSave: AssessmentSeries = {
      id: formData.id || `series-${Date.now()}`,
      name: formData.name.trim().toUpperCase(),
      year: formData.year.trim(),
      openingDate: formData.openingDate || '2026-01-01',
      closingDate: formData.closingDate || '2026-12-31',
      status: formData.status || 'ACTIVE',
    };

    // Duplicate check on series name + year
    const allSeries = StorageService.getAssessmentSeries();
    const existingSeriesMatch = allSeries.find(
      (s) =>
        s.name.trim().toUpperCase() === seriesToSave.name &&
        s.year.trim() === seriesToSave.year &&
        s.id !== seriesToSave.id
    );
    if (existingSeriesMatch) {
      setError(
        `Duplicate Assessment Series! An assessment series with name "${seriesToSave.name}" for year ${seriesToSave.year} already exists.`
      );
      return;
    }

    onSave(seriesToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingSeries ? 'Edit Assessment Series' : 'Add Assessment Series'}
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
            <label className="block font-semibold text-slate-300 mb-1">Series Name *</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. NOVEMBER/DECEMBER 2026 SERIES"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Academic Year *</label>
              <input
                type="text"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                placeholder="2026"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Series Status</label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">ACTIVE (Open for Candidate Registration)</option>
                <option value="UPCOMING">UPCOMING (Pending Registration Window)</option>
                <option value="CLOSED">CLOSED (Archived / Finalized)</option>
              </select>
            </div>
          </div>

          {formData.status === 'ACTIVE' && (
            <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-emerald-300 text-[11px] space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-emerald-400">
                <span>⚡ Active Assessment Window Notice</span>
              </div>
              <p>
                When this series is created/saved as <strong>ACTIVE</strong>, candidate registration is opened for this new cycle. All student unit registrations are automatically reset to zero so trainees can register fresh for the units paid for, while <strong>all master records</strong> (students, trainers, courses, syllabus units, and qualifications) remain strictly preserved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Opening Date</label>
              <input
                type="date"
                value={formData.openingDate || ''}
                onChange={(e) => setFormData({ ...formData, openingDate: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Closing Deadline</label>
              <input
                type="date"
                value={formData.closingDate || ''}
                onChange={(e) => setFormData({ ...formData, closingDate: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
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
              {editingSeries ? 'Update Series' : 'Create Series'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
