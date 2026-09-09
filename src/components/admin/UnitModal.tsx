import React, { useState, useEffect, useRef } from 'react';
import { Unit, Course, Level, Trainer, UnitCategoryItem } from '../../types';
import { StorageService } from '../../services/storage';
import { X, BookOpen, AlertCircle, Sparkles, RefreshCw, Check } from 'lucide-react';

interface UnitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (unit: Unit) => void;
  editingUnit?: Unit | null;
  courses: Course[];
  levels: Level[];
  trainers: Trainer[];
  categories: UnitCategoryItem[];
}

export const UnitModal: React.FC<UnitModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingUnit,
  courses,
  levels,
  trainers,
  categories,
}) => {
  const defaultCatName = categories[0]?.name || 'Core';
  const initialDefaultAmount = StorageService.getCategoryDefaultAmount(defaultCatName, categories);

  const [formData, setFormData] = useState<Partial<Unit>>({
    unitCode: '',
    unitName: '',
    category: defaultCatName,
    courseId: courses[0]?.id || '',
    levelId: levels[0]?.id || '',
    amountCharged: initialDefaultAmount,
    defaultTrainerId: '',
    status: 'ACTIVE',
    description: '',
  });
  const [error, setError] = useState<string>('');
  const [autoAdjustedFeedback, setAutoAdjustedFeedback] = useState<string | null>(null);

  const prevIsOpenRef = useRef(false);
  const prevUnitIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const unitChanged = isOpen && editingUnit?.id !== prevUnitIdRef.current;

    if (justOpened || unitChanged) {
      if (editingUnit) {
        setFormData({ ...editingUnit });
      } else {
        const initialCat = categories[0]?.name || 'Core';
        const initialAmount = StorageService.getCategoryDefaultAmount(initialCat, categories);
        setFormData({
          id: `unit-${Date.now()}`,
          unitCode: '',
          unitName: '',
          category: initialCat,
          courseId: courses[0]?.id || '',
          levelId: levels[0]?.id || '',
          amountCharged: initialAmount,
          defaultTrainerId: '',
          status: 'ACTIVE',
          description: '',
        });
      }
      setError('');
      setAutoAdjustedFeedback(null);
    }

    prevIsOpenRef.current = isOpen;
    prevUnitIdRef.current = editingUnit?.id;
  }, [isOpen, editingUnit?.id]);

  if (!isOpen) return null;

  const handleCategoryChange = (newCategory: string) => {
    const standardAmount = StorageService.getCategoryDefaultAmount(newCategory, categories);
    setFormData((prev) => ({
      ...prev,
      category: newCategory,
      amountCharged: standardAmount,
    }));
    setAutoAdjustedFeedback(`Fee automatically adjusted to KES ${standardAmount.toLocaleString()} for ${newCategory} category.`);
    setTimeout(() => setAutoAdjustedFeedback(null), 4000);
  };

  const handleResetToCategoryAmount = () => {
    const currentCat = formData.category || 'Core';
    const standardAmount = StorageService.getCategoryDefaultAmount(currentCat, categories);
    setFormData((prev) => ({
      ...prev,
      amountCharged: standardAmount,
    }));
    setAutoAdjustedFeedback(`Reset to standard ${currentCat} rate: KES ${standardAmount.toLocaleString()}`);
    setTimeout(() => setAutoAdjustedFeedback(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.unitCode?.trim() || !formData.unitName?.trim()) {
      setError('Please provide both Unit Code and Unit Title.');
      return;
    }

    const unitToSave: Unit = {
      id: formData.id || `unit-${Date.now()}`,
      unitCode: formData.unitCode.trim().toUpperCase(),
      unitName: formData.unitName.trim(),
      category: formData.category || 'Core',
      courseId: formData.courseId || courses[0]?.id || '',
      levelId: formData.levelId || levels[0]?.id || '',
      amountCharged: Number(formData.amountCharged) || 0,
      defaultTrainerId: formData.defaultTrainerId || trainers[0]?.id || '',
      status: formData.status || 'ACTIVE',
      description: formData.description?.trim() || '',
    };

    // Duplicate check on unitCode
    const allUnits = StorageService.getUnits();
    const existingWithCode = allUnits.find(
      (u) => u.unitCode.trim().toUpperCase() === unitToSave.unitCode && u.id !== unitToSave.id
    );
    if (existingWithCode) {
      setError(
        `Duplicate Unit Code! A unit with code "${unitToSave.unitCode}" is already registered (${existingWithCode.unitName}). Duplicate unit records are not permitted.`
      );
      return;
    }

    onSave(unitToSave);
    onClose();
  };

  const currentStandardFee = StorageService.getCategoryDefaultAmount(formData.category || 'Core', categories);
  const isCustomFee = formData.amountCharged !== currentStandardFee;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">
              {editingUnit ? 'Edit CDACC Assessment Unit' : 'Add New CDACC Assessment Unit'}
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

        {autoAdjustedFeedback && (
          <div className="p-2.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center gap-2 text-xs font-medium animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{autoAdjustedFeedback}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Unit Code *</label>
              <input
                type="text"
                value={formData.unitCode || ''}
                onChange={(e) => setFormData({ ...formData, unitCode: e.target.value })}
                placeholder="e.g. ICT/CU/IT/CR/05/6/A"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 rounded-xl font-mono font-bold focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Category * <span className="text-[10px] text-emerald-400 font-normal">(Auto-adjusts Fee)</span>
              </label>
              <select
                value={formData.category || 'Core'}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              >
                {categories.map((c) => {
                  const setFee = StorageService.getCategoryDefaultAmount(c.name, categories);
                  return (
                    <option key={c.id} value={c.name}>
                      {c.name} ({c.code}) - KES {setFee.toLocaleString()}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Quick Category Switcher Pills */}
          <div>
            <span className="text-[11px] text-slate-400 font-medium block mb-1.5">
              Quick Select Category (Rate Auto-Updates):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => {
                const isSelected = (formData.category || '').toLowerCase() === cat.name.toLowerCase();
                const setFee = StorageService.getCategoryDefaultAmount(cat.name, categories);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => handleCategoryChange(cat.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-600 text-slate-950 border-emerald-500 shadow-md font-bold'
                        : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    <span>{cat.name}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-slate-900 font-bold' : 'text-emerald-400 font-mono'}`}>
                      KES {setFee.toLocaleString()}
                    </span>
                    {isSelected && <Check className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Unit Title / Name *</label>
            <input
              type="text"
              value={formData.unitName || ''}
              onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
              placeholder="e.g. Implement Cloud Infrastructure & Virtualization"
              className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Course Association</label>
              <select
                value={formData.courseId || ''}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-semibold text-slate-300">Amount Charged (KES)</label>
                {isCustomFee ? (
                  <button
                    type="button"
                    onClick={handleResetToCategoryAmount}
                    className="text-[10px] text-amber-400 hover:text-amber-300 inline-flex items-center gap-1 font-medium underline"
                    title={`Reset to standard ${formData.category} rate (KES ${currentStandardFee.toLocaleString()})`}
                  >
                    <RefreshCw className="w-2.5 h-2.5" /> Reset to standard
                  </button>
                ) : (
                  <span className="text-[10px] text-emerald-400 font-medium flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5" /> Auto-set ({formData.category})
                  </span>
                )}
              </div>
              <input
                type="number"
                value={formData.amountCharged ?? currentStandardFee}
                onChange={(e) => setFormData({ ...formData, amountCharged: Number(e.target.value) })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold rounded-xl focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Suggested / Default Subject Trainer <span className="text-slate-500 font-normal text-xs">(Optional)</span>
              </label>
              <select
                value={formData.defaultTrainerId || ''}
                onChange={(e) => setFormData({ ...formData, defaultTrainerId: e.target.value })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500 text-xs"
              >
                <option value="">-- No Default (Trainee selects class trainer) --</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.staffNumber}) {t.specialization ? `• ${t.specialization}` : ''}
                  </option>
                ))}
              </select>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Trainees select the specific trainer who taught their class when registering units.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Status</label>
              <select
                value={formData.status || 'ACTIVE'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-white rounded-xl focus:ring-2 focus:ring-emerald-500"
              >
                <option value="ACTIVE">ACTIVE (Available for Registration)</option>
                <option value="INACTIVE">INACTIVE (Archived / Locked)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Optional Notes / Remarks</label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="e.g. Includes practical portfolio"
                className="w-full p-2.5 bg-slate-950 border border-slate-700 text-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
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
              {editingUnit ? 'Save Changes' : 'Create Assessment Unit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
