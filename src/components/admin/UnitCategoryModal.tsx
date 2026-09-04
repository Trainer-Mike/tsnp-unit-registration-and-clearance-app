import React, { useState } from 'react';
import { UnitCategoryItem } from '../../types';
import { StorageService, triggerStoreUpdate } from '../../services/storage';
import { X, Plus, Trash2, Edit2, Check, Tag, Sparkles, RefreshCw, Layers } from 'lucide-react';

interface UnitCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: UnitCategoryItem[];
  onSaveCategory: (category: UnitCategoryItem, autoAdjustUnits?: boolean) => void;
  onDeleteCategory: (categoryId: string) => void;
}

export const UnitCategoryModal: React.FC<UnitCategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveCategory,
  onDeleteCategory,
}) => {
  const [editingCategory, setEditingCategory] = useState<UnitCategoryItem | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formState, setFormState] = useState<Partial<UnitCategoryItem>>({
    name: '',
    code: '',
    description: '',
    badgeColor: 'blue',
    defaultAmount: 2500,
  });
  const [autoSyncUnits, setAutoSyncUnits] = useState(true);
  const [error, setError] = useState<string>('');
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const startAdd = () => {
    setEditingCategory(null);
    setFormState({
      id: `cat-${Date.now()}`,
      name: '',
      code: '',
      description: '',
      badgeColor: 'blue',
      defaultAmount: 2500,
    });
    setAutoSyncUnits(true);
    setIsAddingNew(true);
    setError('');
  };

  const startEdit = (cat: UnitCategoryItem) => {
    setEditingCategory(cat);
    const standardFee = cat.defaultAmount || StorageService.getCategoryDefaultAmount(cat.name, categories);
    setFormState({ ...cat, defaultAmount: standardFee });
    setAutoSyncUnits(true);
    setIsAddingNew(true);
    setError('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.name?.trim() || !formState.code?.trim()) {
      setError('Category Name and Short Code are required.');
      return;
    }

    const fee = Number(formState.defaultAmount) || StorageService.getCategoryDefaultAmount(formState.name || 'Core', categories);

    const categoryToSave: UnitCategoryItem = {
      id: formState.id || `cat-${Date.now()}`,
      name: formState.name.trim(),
      code: formState.code.trim().toUpperCase(),
      description: formState.description?.trim() || '',
      badgeColor: formState.badgeColor || 'blue',
      defaultAmount: fee,
    };

    // Duplicate check on category name and code
    const existingName = categories.find(
      (c) => c.name.trim().toLowerCase() === categoryToSave.name.toLowerCase() && c.id !== categoryToSave.id
    );
    if (existingName) {
      setError(`Duplicate Category Name! A category named "${categoryToSave.name}" already exists.`);
      return;
    }
    const existingCode = categories.find(
      (c) => c.code.trim().toUpperCase() === categoryToSave.code && c.id !== categoryToSave.id
    );
    if (existingCode) {
      setError(`Duplicate Category Code! A category with short code "${categoryToSave.code}" already exists.`);
      return;
    }

    onSaveCategory(categoryToSave, autoSyncUnits);
    setIsAddingNew(false);
    setEditingCategory(null);
    setError('');
    if (autoSyncUnits) {
      setSyncFeedback(`Category saved! All ${categoryToSave.name} units were automatically updated to KES ${fee.toLocaleString()}.`);
      setTimeout(() => setSyncFeedback(null), 4000);
    }
  };

  const handleSyncAllUnits = () => {
    const count = StorageService.applyCategoryAmountsToAllUnits(categories);
    triggerStoreUpdate();
    setSyncFeedback(`Successfully synchronized all units across ${categories.length} categories! (${count} unit fees adjusted)`);
    setTimeout(() => setSyncFeedback(null), 4000);
  };

  const colorOptions = [
    { label: 'Purple (Core)', value: 'purple', class: 'bg-purple-950 text-purple-300 border-purple-800' },
    { label: 'Blue (Common)', value: 'blue', class: 'bg-blue-950 text-blue-300 border-blue-800' },
    { label: 'Slate (Basic)', value: 'slate', class: 'bg-slate-800 text-slate-300 border-slate-700' },
    { label: 'Emerald (Elective)', value: 'emerald', class: 'bg-emerald-950 text-emerald-300 border-emerald-800' },
    { label: 'Amber (Practical)', value: 'amber', class: 'bg-amber-950 text-amber-300 border-amber-800' },
    { label: 'Cyan (Technical)', value: 'cyan', class: 'bg-cyan-950 text-cyan-300 border-cyan-800' },
    { label: 'Rose (Specialized)', value: 'rose', class: 'bg-rose-950 text-rose-300 border-rose-800' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-white text-base">Manage TSNP/CDACC Unit Categories & Set Fees</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {syncFeedback && (
          <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-300 flex items-center gap-2 text-xs font-medium animate-fadeIn">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{syncFeedback}</span>
          </div>
        )}

        {/* Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <p className="text-xs text-slate-400">
            Define category short codes and set billing amounts (e.g. Core, Common, Basic) for auto-adjustment.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncAllUnits}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-900/60 font-semibold rounded-xl text-xs transition"
              title="Apply set category rates to all units in the system"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Sync All Units
            </button>
            {!isAddingNew && (
              <button
                onClick={startAdd}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition shadow"
              >
                <Plus className="w-4 h-4" /> Add Category
              </button>
            )}
          </div>
        </div>

        {/* Add/Edit Form */}
        {isAddingNew && (
          <form onSubmit={handleSave} className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl space-y-3">
            <h4 className="font-semibold text-xs text-emerald-400 uppercase tracking-wider">
              {editingCategory ? 'Edit Category Rate' : 'Create New Category'}
            </h4>

            {error && (
              <p className="text-xs text-rose-400 font-medium bg-rose-950/40 border border-rose-800/50 p-2 rounded-lg">
                {error}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block font-medium text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  value={formState.name || ''}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  placeholder="e.g. Core"
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Short Code *</label>
                <input
                  type="text"
                  value={formState.code || ''}
                  onChange={(e) => setFormState({ ...formState, code: e.target.value })}
                  placeholder="e.g. CR"
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-slate-300 mb-1">Set Fee Amount (KES) *</label>
                <input
                  type="number"
                  value={formState.defaultAmount ?? 2500}
                  onChange={(e) => setFormState({ ...formState, defaultAmount: Number(e.target.value) })}
                  placeholder="2500"
                  className="w-full p-2 bg-slate-900 border border-slate-700 text-emerald-400 font-mono font-bold rounded-lg focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>
            </div>

            <div className="text-xs">
              <label className="block font-medium text-slate-300 mb-1">Description</label>
              <input
                type="text"
                value={formState.description || ''}
                onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                placeholder="e.g. Core Competency Units of Learning"
                className="w-full p-2 bg-slate-900 border border-slate-700 text-white rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="text-xs">
              <label className="block font-medium text-slate-300 mb-1">Badge Color Style</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setFormState({ ...formState, badgeColor: opt.value })}
                    className={`p-2 rounded-lg border text-left text-[11px] font-medium transition flex items-center justify-between ${
                      formState.badgeColor === opt.value
                        ? `${opt.class} ring-2 ring-emerald-500 font-bold`
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{opt.label.split(' ')[0]}</span>
                    {formState.badgeColor === opt.value && <Check className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={autoSyncUnits}
                  onChange={(e) => setAutoSyncUnits(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500"
                />
                <span>Automatically adjust all existing units of this category to KES {Number(formState.defaultAmount || 0).toLocaleString()}</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setIsAddingNew(false);
                  setEditingCategory(null);
                }}
                className="px-3 py-1.5 text-xs text-slate-400 hover:bg-slate-800 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg transition"
              >
                {editingCategory ? 'Update Category & Apply Fee' : 'Save Category'}
              </button>
            </div>
          </form>
        )}

        {/* Existing Categories List */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {categories.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">No categories configured yet.</div>
          ) : (
            categories.map((cat) => {
              const standardFee = cat.defaultAmount || StorageService.getCategoryDefaultAmount(cat.name, categories);
              return (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3 bg-slate-950/50 border border-slate-800/80 rounded-xl hover:border-slate-700 transition"
                >
                  <div className="flex items-center gap-3">
                    <span className="px-2.5 py-1 text-xs font-mono font-bold rounded-lg bg-slate-800 text-emerald-400 border border-slate-700">
                      {cat.code}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{cat.name}</span>
                        <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-emerald-950/70 text-emerald-400 border border-emerald-800/60 rounded-md">
                          KES {standardFee.toLocaleString()}
                        </span>
                      </div>
                      {cat.description && <div className="text-xs text-slate-400">{cat.description}</div>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => startEdit(cat)}
                      className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition"
                      title="Edit Category & Set Amount"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete the "${cat.name}" category?`)) {
                          onDeleteCategory(cat.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition"
                      title="Delete Category"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs">
          <span className="text-slate-400">
            Units selected as Core, Common, or Basic will automatically adjust to their set fee.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
