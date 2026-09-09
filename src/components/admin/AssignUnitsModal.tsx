import React, { useState, useEffect, useRef } from 'react';
import { Trainer, Unit, Course, UnitCategoryItem } from '../../types';
import { X, CheckSquare, Square, Layers, Search, Check, AlertCircle } from 'lucide-react';

interface AssignUnitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  trainer: Trainer | null;
  units: Unit[];
  courses: Course[];
  trainers: Trainer[];
  onAssignUnits: (trainerId: string, assignedUnitIds: string[]) => void;
}

export const AssignUnitsModal: React.FC<AssignUnitsModalProps> = ({
  isOpen,
  onClose,
  trainer,
  units,
  courses,
  trainers,
  onAssignUnits,
}) => {
  const [selectedTrainerId, setSelectedTrainerId] = useState<string>('');
  const [assignedUnitIds, setAssignedUnitIds] = useState<Set<string>>(new Set());
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [courseFilter, setCourseFilter] = useState<string>('ALL');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const prevIsOpenRef = useRef(false);
  const prevTrainerIdRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    const justOpened = isOpen && !prevIsOpenRef.current;
    const trainerChanged = isOpen && trainer?.id !== prevTrainerIdRef.current;

    if (justOpened || trainerChanged) {
      if (trainer) {
        setSelectedTrainerId(trainer.id);
        const initialAssigned = new Set(
          units.filter((u) => u.defaultTrainerId === trainer.id).map((u) => u.id)
        );
        setAssignedUnitIds(initialAssigned);
      } else if (trainers.length > 0) {
        setSelectedTrainerId(trainers[0].id);
        const initialAssigned = new Set(
          units.filter((u) => u.defaultTrainerId === trainers[0].id).map((u) => u.id)
        );
        setAssignedUnitIds(initialAssigned);
      }
      setSavedSuccess(false);
    }

    prevIsOpenRef.current = isOpen;
    prevTrainerIdRef.current = trainer?.id;
  }, [isOpen, trainer?.id]);

  const handleTrainerChange = (tId: string) => {
    setSelectedTrainerId(tId);
    const initialAssigned = new Set(
      units.filter((u) => u.defaultTrainerId === tId).map((u) => u.id)
    );
    setAssignedUnitIds(initialAssigned);
    setSavedSuccess(false);
  };

  const toggleUnit = (unitId: string) => {
    setAssignedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) {
        next.delete(unitId);
      } else {
        next.add(unitId);
      }
      return next;
    });
    setSavedSuccess(false);
  };

  const selectAllFiltered = () => {
    setAssignedUnitIds((prev) => {
      const next = new Set(prev);
      filteredUnits.forEach((u) => next.add(u.id));
      return next;
    });
  };

  const deselectAllFiltered = () => {
    setAssignedUnitIds((prev) => {
      const next = new Set(prev);
      filteredUnits.forEach((u) => next.delete(u.id));
      return next;
    });
  };

  const handleSave = () => {
    if (!selectedTrainerId) return;
    onAssignUnits(selectedTrainerId, Array.from(assignedUnitIds));
    setSavedSuccess(true);
    setTimeout(() => {
      onClose();
    }, 900);
  };

  if (!isOpen) return null;

  const currentTrainer = trainers.find((t) => t.id === selectedTrainerId);

  const filteredUnits = units.filter((u) => {
    const matchesSearch =
      u.unitCode.toLowerCase().includes(searchFilter.toLowerCase()) ||
      u.unitName.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || u.category === categoryFilter;
    const matchesCourse = courseFilter === 'ALL' || u.courseId === courseFilter;
    return matchesSearch && matchesCategory && matchesCourse;
  });

  const categories = Array.from(new Set(units.map((u) => u.category)));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-200 text-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-white text-base">Assign CDACC Units to Subject Trainer</h3>
              <p className="text-[11px] text-slate-400">
                Route student assessment clearances automatically to the assigned subject specialist
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {savedSuccess && (
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 font-bold flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Unit assignments updated successfully!
          </div>
        )}

        {/* Trainer Selector & Overview */}
        <div className="bg-slate-950/70 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="block font-semibold text-slate-300 mb-1">Target Subject Trainer</label>
            <select
              value={selectedTrainerId}
              onChange={(e) => handleTrainerChange(e.target.value)}
              className="w-full p-2.5 bg-slate-900 border border-slate-700 text-white rounded-xl font-medium focus:ring-2 focus:ring-emerald-500"
            >
              {trainers.map((t) => {
                const count = units.filter((u) => u.defaultTrainerId === t.id).length;
                return (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.staffNumber}) — currently {count} units assigned
                  </option>
                );
              })}
            </select>
          </div>

          {currentTrainer && (
            <div className="px-4 py-2 bg-slate-900 rounded-xl border border-slate-800 text-center sm:text-right shrink-0">
              <div className="text-[11px] text-slate-400">Total Selected</div>
              <div className="text-lg font-bold text-emerald-400 font-mono">
                {assignedUnitIds.size} <span className="text-xs text-slate-400 font-normal">units</span>
              </div>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search code or unit title..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat} Units
              </option>
            ))}
          </select>

          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="w-full p-2 bg-slate-950 border border-slate-700 text-white rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
          >
            <option value="ALL">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Batch Actions */}
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span>Showing {filteredUnits.length} matching units</span>
          <div className="flex items-center gap-2">
            <button
              onClick={selectAllFiltered}
              className="text-emerald-400 hover:text-emerald-300 hover:underline text-[11px] font-semibold"
            >
              Select All Filtered
            </button>
            <span>•</span>
            <button
              onClick={deselectAllFiltered}
              className="text-slate-400 hover:text-slate-200 hover:underline text-[11px]"
            >
              Deselect All Filtered
            </button>
          </div>
        </div>

        {/* Unit Checkbox List */}
        <div className="max-h-72 overflow-y-auto space-y-2 border border-slate-800 rounded-xl p-2 bg-slate-950/40">
          {filteredUnits.length === 0 ? (
            <div className="text-center py-8 text-slate-500">No units match your search filters.</div>
          ) : (
            filteredUnits.map((u) => {
              const isChecked = assignedUnitIds.has(u.id);
              const otherTrainer =
                u.defaultTrainerId && u.defaultTrainerId !== selectedTrainerId
                  ? trainers.find((t) => t.id === u.defaultTrainerId)
                  : null;

              return (
                <div
                  key={u.id}
                  onClick={() => toggleUnit(u.id)}
                  className={`flex items-start justify-between p-3 rounded-xl border cursor-pointer transition select-none ${
                    isChecked
                      ? 'bg-emerald-950/30 border-emerald-600/60 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-emerald-400">
                      {isChecked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-slate-600" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-emerald-400 text-[11px]">{u.unitCode}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            u.category === 'Core'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800'
                              : u.category === 'Common'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {u.category}
                        </span>
                      </div>
                      <div className="font-medium text-slate-200 mt-0.5">{u.unitName}</div>
                      {otherTrainer && !isChecked && (
                        <div className="text-[10px] text-amber-400/90 mt-1">
                          Currently assigned to: <span className="font-semibold">{otherTrainer.name}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-[11px] font-mono text-slate-400">KES {u.amountCharged?.toLocaleString()}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            {assignedUnitIds.size} unit(s) assigned to <strong className="text-white">{currentTrainer?.name}</strong>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-400 hover:bg-slate-800 rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl shadow-lg transition"
            >
              Save Assignments
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
