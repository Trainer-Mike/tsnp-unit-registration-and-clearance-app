import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { StorageService } from '../../services/storage';
import {
  Student,
  Course,
  Level,
  AssessmentSeries,
  Unit,
  Registration,
  RegistrationUnitItem,
  User,
  InstitutionConfig,
  getMaxModulesForLevel,
  getModuleOptions,
  formatModuleLabel,
  AcademicModule,
} from '../../types';
import {
  CheckCircle2,
  BookOpen,
  Calendar,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Send,
  Sparkles,
  X,
  RotateCcw,
  Search,
  Trash2,
  Plus,
  Edit3,
  Users,
} from 'lucide-react';

interface UnitRegistrationWizardProps {
  student: Student;
  user: User;
  courses: Course[];
  levels: Level[];
  units: Unit[];
  assessmentSeriesList: AssessmentSeries[];
  config: InstitutionConfig;
  initialReassessmentUnitId?: string;
  editingRegistration?: Registration | null;
  onComplete: (registration: Registration) => void;
  onCancel: () => void;
}

export const UnitRegistrationWizard: React.FC<UnitRegistrationWizardProps> = ({
  student,
  user,
  courses,
  levels,
  units,
  assessmentSeriesList,
  config,
  initialReassessmentUnitId,
  editingRegistration,
  onComplete,
  onCancel,
}) => {
  const isEditing = Boolean(editingRegistration);
  const [currentStep, setCurrentStep] = useState<number>(
    isEditing ? 3 : initialReassessmentUnitId ? 2 : 1
  );
  const activeSeriesList = assessmentSeriesList.filter(
    (s) => s.status === 'ACTIVE' || s.status === 'UPCOMING'
  );

  const studentCourse = courses.find((c) => c.id === student.courseId);
  const studentLevel = levels.find((l) => l.id === student.levelId);
  const maxModules = getMaxModulesForLevel(studentLevel?.code || studentLevel?.name, student.levelId);

  const reassessmentFee =
    typeof config.reassessmentFee === 'number' && config.reassessmentFee > 0
      ? config.reassessmentFee
      : 2000;

  const [selectedSeriesId, setSelectedSeriesId] = useState<string>(
    editingRegistration?.assessmentSeriesId ||
      activeSeriesList.find((s) => s.status === 'ACTIVE')?.id ||
      activeSeriesList[0]?.id ||
      ''
  );
  const [selectedYear, setSelectedYear] = useState<string>(
    editingRegistration?.year || config.currentAcademicYear || '2026'
  );
  const [selectedModule, setSelectedModule] = useState<AcademicModule>(
    editingRegistration?.module || student.currentModule || 1
  );
  const [selectedUnitIds, setSelectedUnitIds] = useState<string[]>(() => {
    if (editingRegistration && editingRegistration.units.length > 0) {
      return editingRegistration.units.map((u) => u.unitId);
    }
    if (initialReassessmentUnitId) {
      return [initialReassessmentUnitId];
    }
    return [];
  });
  const [reassessmentUnitIds, setReassessmentUnitIds] = useState<string[]>(() => {
    if (editingRegistration) {
      return editingRegistration.units.filter((u) => u.isReassessment).map((u) => u.unitId);
    }
    if (initialReassessmentUnitId) {
      return [initialReassessmentUnitId];
    }
    return [];
  });
  const [unitFilterTab, setUnitFilterTab] = useState<'COURSE' | 'ALL_SYLLABUS' | 'REASSESSMENTS'>(
    initialReassessmentUnitId ? 'REASSESSMENTS' : 'COURSE'
  );
  const [unitSearchQuery, setUnitSearchQuery] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const trainers = StorageService.getTrainers();

  // Mapping of unitId -> student-selected trainerId
  const [unitTrainerMap, setUnitTrainerMap] = useState<Record<string, string>>(() => {
    const initialMap: Record<string, string> = {};
    if (editingRegistration && editingRegistration.units.length > 0) {
      editingRegistration.units.forEach((u) => {
        if (u.trainerId) {
          initialMap[u.unitId] = u.trainerId;
        }
      });
    }
    return initialMap;
  });

  // Handle pre-populating trainer for initialReassessmentUnitId if available
  useEffect(() => {
    if (initialReassessmentUnitId && !unitTrainerMap[initialReassessmentUnitId]) {
      const targetUnit = units.find((u) => u.id === initialReassessmentUnitId);
      if (targetUnit?.defaultTrainerId && trainers.some((t) => t.id === targetUnit.defaultTrainerId)) {
        setUnitTrainerMap((prev) => ({
          ...prev,
          [initialReassessmentUnitId]: targetUnit.defaultTrainerId,
        }));
      }
    }
  }, [initialReassessmentUnitId, units, trainers]);

  const handleTrainerChangeForUnit = (unitId: string, trainerId: string) => {
    setErrorMsg('');
    setUnitTrainerMap((prev) => ({
      ...prev,
      [unitId]: trainerId,
    }));
  };

  // Filter available units applicable for this student's course/level
  const courseUnits = units.filter(
    (u) =>
      u.status === 'ACTIVE' &&
      (u.courseId === student.courseId || u.levelId === student.levelId || !u.courseId)
  );

  // All active units in department (for retaking units from prior modules or cross-department)
  const allDepartmentUnits = units.filter((u) => u.status === 'ACTIVE');

  // Filtered list based on active tab and search
  const displayedUnits = (unitFilterTab === 'COURSE' ? courseUnits : allDepartmentUnits).filter(
    (u) => {
      if (!unitSearchQuery) return true;
      const q = unitSearchQuery.toLowerCase();
      return (
        u.unitCode.toLowerCase().includes(q) ||
        u.unitName.toLowerCase().includes(q) ||
        u.category.toLowerCase().includes(q)
      );
    }
  );

  const toggleUnit = (unitId: string, asReassessment = false) => {
    setErrorMsg('');
    if (selectedUnitIds.includes(unitId)) {
      setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
      setReassessmentUnitIds(reassessmentUnitIds.filter((id) => id !== unitId));
    } else {
      if (
        config.maxUnitsPerRegistration &&
        selectedUnitIds.length >= config.maxUnitsPerRegistration
      ) {
        setErrorMsg(`Maximum ${config.maxUnitsPerRegistration} units allowed per registration.`);
        return;
      }
      setSelectedUnitIds([...selectedUnitIds, unitId]);
      if (asReassessment) {
        setReassessmentUnitIds([...reassessmentUnitIds, unitId]);
      }
      // If trainer not yet picked and unit has a default trainer that exists, prefill it as suggestion
      const targetUnit = units.find((u) => u.id === unitId);
      if (targetUnit?.defaultTrainerId && trainers.some((t) => t.id === targetUnit.defaultTrainerId)) {
        if (!unitTrainerMap[unitId]) {
          setUnitTrainerMap((prev) => ({
            ...prev,
            [unitId]: targetUnit.defaultTrainerId,
          }));
        }
      }
    }
  };

  const removeUnit = (unitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorMsg('');
    setSelectedUnitIds(selectedUnitIds.filter((id) => id !== unitId));
    setReassessmentUnitIds(reassessmentUnitIds.filter((id) => id !== unitId));
  };

  const clearAllUnits = () => {
    setErrorMsg('');
    setSelectedUnitIds([]);
    setReassessmentUnitIds([]);
  };

  const toggleReassessmentMode = (unitId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setErrorMsg('');
    if (!selectedUnitIds.includes(unitId)) {
      // Auto-select and mark as reassessment
      if (
        config.maxUnitsPerRegistration &&
        selectedUnitIds.length >= config.maxUnitsPerRegistration
      ) {
        setErrorMsg(`Maximum ${config.maxUnitsPerRegistration} units allowed per registration.`);
        return;
      }
      setSelectedUnitIds([...selectedUnitIds, unitId]);
      setReassessmentUnitIds([...reassessmentUnitIds, unitId]);
      const targetUnit = units.find((u) => u.id === unitId);
      if (targetUnit?.defaultTrainerId && trainers.some((t) => t.id === targetUnit.defaultTrainerId)) {
        if (!unitTrainerMap[unitId]) {
          setUnitTrainerMap((prev) => ({
            ...prev,
            [unitId]: targetUnit.defaultTrainerId,
          }));
        }
      }
    } else {
      // Toggle reassessment state
      if (reassessmentUnitIds.includes(unitId)) {
        setReassessmentUnitIds(reassessmentUnitIds.filter((id) => id !== unitId));
      } else {
        setReassessmentUnitIds([...reassessmentUnitIds, unitId]);
      }
    }
  };

  const getEffectiveUnitFee = (unit: Unit) => {
    if (reassessmentUnitIds.includes(unit.id)) {
      return reassessmentFee;
    }
    return unit.amountCharged || 0;
  };

  const selectedUnitsList = units.filter((u) => selectedUnitIds.includes(u.id));
  const regularUnitsCount = selectedUnitsList.filter(
    (u) => !reassessmentUnitIds.includes(u.id)
  ).length;
  const reassessmentUnitsCount = selectedUnitsList.filter((u) =>
    reassessmentUnitIds.includes(u.id)
  ).length;

  const totalAmount = selectedUnitsList.reduce((acc, u) => acc + getEffectiveUnitFee(u), 0);
  const selectedSeries = assessmentSeriesList.find((s) => s.id === selectedSeriesId);

  // Group selected units by the trainer chosen by the trainee
  const routingMap: { [trainerName: string]: Unit[] } = {};
  selectedUnitsList.forEach((u) => {
    const chosenTrainerId = unitTrainerMap[u.id];
    const trainer = trainers.find((t) => t.id === chosenTrainerId);
    const trainerKey = trainer
      ? `${trainer.name} (${trainer.staffNumber})`
      : '⚠️ Unassigned Subject Trainer';
    if (!routingMap[trainerKey]) routingMap[trainerKey] = [];
    routingMap[trainerKey].push(u);
  });

  const handleSubmitRegistration = () => {
    if (selectedUnitsList.length === 0) {
      setErrorMsg('Please select at least one unit to register.');
      return;
    }
    if (!selectedSeries) {
      setErrorMsg('Please select an active assessment series.');
      return;
    }

    // Validate that student has chosen a trainer for every selected unit
    const unassignedUnits = selectedUnitsList.filter((u) => !unitTrainerMap[u.id]);
    if (unassignedUnits.length > 0) {
      setErrorMsg(
        `Please select the trainer who taught you for: ${unassignedUnits
          .map((u) => u.unitCode)
          .join(', ')} before submitting.`
      );
      return;
    }

    setSubmitting(true);

    const regUnits: RegistrationUnitItem[] = selectedUnitsList.map((u, idx) => {
      const chosenTrainerId = unitTrainerMap[u.id];
      const tr = trainers.find((t) => t.id === chosenTrainerId);
      const isReassessment = reassessmentUnitIds.includes(u.id);
      const effectiveFee = isReassessment ? reassessmentFee : u.amountCharged;

      return {
        id: `ru-${Date.now()}-${idx}`,
        unitId: u.id,
        unitCode: u.unitCode,
        unitName: u.unitName,
        category: u.category,
        amountCharged: effectiveFee,
        originalAmountCharged: u.amountCharged,
        isReassessment,
        attemptType: isReassessment ? 'REASSESSMENT' : 'REGULAR',
        trainerId: tr ? tr.id : '',
        trainerName: tr ? tr.name : 'Selected Trainer',
        status: 'PENDING',
      };
    });

    const refNo = editingRegistration?.registrationReference || StorageService.generateRegistrationRef();
    const now = new Date().toISOString();

    const reassessmentNote =
      reassessmentUnitsCount > 0
        ? ` (Includes ${reassessmentUnitsCount} Reassessment unit(s) @ ${
            config.defaultCurrency || 'KES'
          } ${reassessmentFee.toLocaleString()})`
        : '';

    const registrationRecord: Registration = {
      id: editingRegistration?.id || 'reg-' + Math.random().toString(36).substr(2, 9),
      registrationReference: refNo,
      studentId: student.id,
      studentName: student.name,
      admissionNumber: student.admissionNumber,
      courseId: student.courseId,
      courseName: studentCourse?.name || 'Diploma in ICT',
      courseCode: studentCourse?.code || 'DICT',
      levelId: student.levelId,
      levelName: studentLevel?.name || 'LEVEL 6',
      departmentId: student.departmentId,
      departmentName: config.departmentName,
      assessmentSeriesId: selectedSeries.id,
      assessmentSeriesName: selectedSeries.name,
      year: selectedYear,
      module: selectedModule,
      units: regUnits,
      totalAmount,
      status: 'SUBMITTED',
      submittedAt: editingRegistration?.submittedAt || now,
      lastUpdatedAt: now,
      resubmissionCount: (editingRegistration?.resubmissionCount || 0) + (isEditing ? 1 : 0),
      auditLogs: [
        ...(editingRegistration?.auditLogs || []),
        {
          id: 'log-' + Math.random().toString(36).substr(2, 9),
          timestamp: now,
          userId: user.id,
          userName: student.name,
          userRole: 'STUDENT',
          action: isEditing ? 'UPDATE_REGISTRATION_UNITS' : 'SUBMIT_REGISTRATION',
          details: isEditing
            ? `Candidate reviewed & updated unit selection: ${regUnits.length} unit(s) registered [${regularUnitsCount} Regular, ${reassessmentUnitsCount} Re-sit] for ${selectedSeries.name} (${selectedYear}) - Module ${selectedModule}. Total: ${
                config.defaultCurrency || 'KES'
              } ${totalAmount.toLocaleString()}.${reassessmentNote}`
            : `Candidate registered ${regUnits.length} unit(s) [${regularUnitsCount} Regular, ${reassessmentUnitsCount} Reassessment/Re-sit] for ${selectedSeries.name} (${selectedYear}) - Module ${selectedModule}. Total: ${
                config.defaultCurrency || 'KES'
              } ${totalAmount.toLocaleString()}.${reassessmentNote}`,
          newStatus: 'SUBMITTED',
        },
      ],
    };

    StorageService.saveRegistration(registrationRecord);

    // If student's current module is different from registration module, sync it
    if (student.currentModule !== selectedModule) {
      StorageService.saveStudent({
        ...student,
        currentModule: selectedModule,
      });
    }

    // Create notifications for the specific trainers chosen by the trainee
    const distinctTrainerIds = Array.from(new Set(regUnits.map((u) => u.trainerId).filter(Boolean)));
    distinctTrainerIds.forEach((tId) => {
      const selectedTrainerObj = trainers.find((t) => t.id === tId);
      StorageService.createNotification({
        targetUserId: selectedTrainerObj?.userId || selectedTrainerObj?.id,
        targetRole: 'TRAINER',
        title: isEditing ? 'Updated Unit Verification Tasks' : 'New Unit Verification Tasks',
        message: `${student.name} (${student.admissionNumber}) has selected you to clear units in ${formatModuleLabel(selectedModule)} (${
          selectedSeries.name
        }) requiring your electronic clearance.${reassessmentNote}`,
        type: 'INFO',
        linkRegistrationId: registrationRecord.id,
      });
    });

    // Create student confirmation notification
    StorageService.createNotification({
      targetUserId: student.id,
      title: isEditing ? 'Registration Units Updated' : 'Registration Submitted Successfully',
      message: `Your CDACC/TSNP assessment registration (${refNo}) for ${formatModuleLabel(
        selectedModule
      )} now contains ${regUnits.length} units (${reassessmentUnitsCount} re-sits). Total: ${
        config.defaultCurrency || 'KES'
      } ${totalAmount.toLocaleString()}.`,
      type: 'SUCCESS',
      linkRegistrationId: registrationRecord.id,
    });

    // Create System Admin alert notification detailing trainee and all assigned trainers
    const trainerBreakdownMap = new Map<string, { trainerName: string; count: number; unitCodes: string[] }>();
    regUnits.forEach((u) => {
      const name = u.trainerName || 'Assigned Subject Trainer';
      const existing = trainerBreakdownMap.get(name) || { trainerName: name, count: 0, unitCodes: [] };
      existing.count += 1;
      existing.unitCodes.push(u.unitCode);
      trainerBreakdownMap.set(name, existing);
    });

    const trainerSummaryText = Array.from(trainerBreakdownMap.values())
      .map((t) => `${t.trainerName} (${t.count} unit${t.count > 1 ? 's' : ''}: ${t.unitCodes.join(', ')})`)
      .join('; ');

    StorageService.createNotification({
      targetRole: 'ADMIN',
      title: isEditing
        ? `Trainee Units Updated: Pending Trainer Verification`
        : `New Trainee Submission: Pending Trainer Verification`,
      message: `Trainee ${student.name} (${student.admissionNumber}) submitted ${regUnits.length} unit(s) for ${formatModuleLabel(
        selectedModule
      )} (${selectedSeries.name}). Pending verification by: ${trainerSummaryText}.`,
      type: 'INFO',
      linkRegistrationId: registrationRecord.id,
    });

    // Trigger celebratory confetti
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSubmitting(false);
      onComplete(registrationRecord);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Wizard Header */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold">
              {isEditing ? <Edit3 className="w-5 h-5" /> : <BookOpen className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                {isEditing
                  ? 'Review & Modify Registered Units'
                  : 'CDACC/TSNP Assessment Unit Registration'}
                {isEditing && (
                  <span className="text-[11px] font-mono font-normal px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    Ref: {editingRegistration.registrationReference}
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                {student.name} • {student.admissionNumber} • {studentCourse?.name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="bg-slate-950/60 px-4 sm:px-6 py-3 border-b border-slate-800 shrink-0">
          <div className="flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className={`flex items-center gap-2 font-semibold transition ${
                currentStep === 1
                  ? 'text-emerald-400'
                  : currentStep > 1
                  ? 'text-slate-300 hover:text-emerald-300'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 1
                    ? 'bg-emerald-500 text-slate-950'
                    : currentStep > 1
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                1
              </div>
              <span className="hidden sm:inline">Series & Academic Cycle</span>
            </button>

            <div className="h-0.5 flex-1 mx-2 sm:mx-4 bg-slate-800">
              <div
                className={`h-full bg-emerald-500 transition-all duration-300 ${
                  currentStep >= 2 ? 'w-full' : 'w-0'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedSeriesId) setCurrentStep(2);
              }}
              className={`flex items-center gap-2 font-semibold transition ${
                currentStep === 2
                  ? 'text-emerald-400'
                  : currentStep > 2
                  ? 'text-slate-300 hover:text-emerald-300'
                  : 'text-slate-500'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 2
                    ? 'bg-emerald-500 text-slate-950'
                    : currentStep > 2
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                2
              </div>
              <span className="hidden sm:inline">Select / Add Units</span>
            </button>

            <div className="h-0.5 flex-1 mx-2 sm:mx-4 bg-slate-800">
              <div
                className={`h-full bg-emerald-500 transition-all duration-300 ${
                  currentStep >= 3 ? 'w-full' : 'w-0'
                }`}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (selectedUnitIds.length > 0) setCurrentStep(3);
              }}
              className={`flex items-center gap-2 font-semibold transition ${
                currentStep === 3
                  ? 'text-emerald-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  currentStep === 3
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                3
              </div>
              <span className="hidden sm:inline">Review & Confirm</span>
            </button>
          </div>
        </div>

        {/* Wizard Scrollable Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-rose-950/30 border border-rose-800/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Series & Target Module Selection */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800 space-y-4">
                <h3 className="font-bold text-white text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-emerald-400" /> Choose Assessment Series & Academic Module
                </h3>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Assessment Series <span className="text-rose-400">*</span>
                    </label>
                    <select
                      value={selectedSeriesId}
                      onChange={(e) => setSelectedSeriesId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="">-- Select Assessment Series --</option>
                      {activeSeriesList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.year}) - {s.status}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                        Academic Year <span className="text-rose-400">*</span>
                      </label>
                      <input
                        type="text"
                        value={selectedYear}
                        onChange={(e) => setSelectedYear(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 font-mono"
                        placeholder="e.g. 2026"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                        <span>Target Module / Cycle <span className="text-rose-400">*</span></span>
                        <span className="text-[10px] text-emerald-400 font-normal">
                          Max for {studentLevel?.name || 'Level'}: Module {maxModules}
                        </span>
                      </label>
                      <select
                        value={selectedModule}
                        onChange={(e) => setSelectedModule(isNaN(Number(e.target.value)) ? e.target.value as AcademicModule : Number(e.target.value) as AcademicModule)}
                        className="w-full px-3 py-2 bg-slate-900 border border-slate-800 text-emerald-300 font-semibold rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                      >
                        {getModuleOptions(studentLevel?.code || studentLevel?.name, student.levelId).map((opt) => (
                          <option key={String(opt.value)} value={opt.value}>
                            {opt.label} {String(opt.value) === String(student.currentModule) ? '(Current)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Reassessment Policy Notice */}
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-[11px] text-amber-300 flex items-center justify-between">
                    <span>
                      <strong className="text-amber-400 font-bold">🔄 Reassessment Policy:</strong> Failed unit re-sit fee is <strong className="font-mono text-white font-bold">{config.defaultCurrency || 'KES'} {reassessmentFee.toLocaleString()}</strong> cutting across all units.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: CDACC Unit Selection & Reassessment Options */}
          {currentStep === 2 && (
            <div className="space-y-4">
              {/* Header & Quick Action Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
                <div>
                  <h3 className="font-bold text-white text-sm">Select CDACC/TSNP Assessment & Re-sit Units</h3>
                  <p className="text-xs text-slate-400">
                    Candidate: <span className="font-semibold text-slate-200">{student.name}</span> • Target: <span className="font-bold text-emerald-400">Module {selectedModule}</span>
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-block px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-bold rounded-xl text-xs">
                    {selectedUnitIds.length} Selected • {config.defaultCurrency || 'KES'} {totalAmount.toLocaleString()}
                  </span>
                  {reassessmentUnitsCount > 0 && (
                    <span className="inline-block px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-300 font-bold rounded-xl text-xs">
                      🔄 {reassessmentUnitsCount} Re-sit ({config.defaultCurrency || 'KES'} {(reassessmentUnitsCount * reassessmentFee).toLocaleString()})
                    </span>
                  )}
                  {selectedUnitIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs transition inline-flex items-center gap-1"
                    >
                      Review Selection <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Selected Units Tray / Removable Chips */}
              {selectedUnitsList.length > 0 && (
                <div className="p-3 bg-slate-950/80 rounded-xl border border-emerald-900/40">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Current Selected Units ({selectedUnitsList.length}):
                    </span>
                    <button
                      type="button"
                      onClick={clearAllUnits}
                      className="text-[11px] text-slate-400 hover:text-rose-400 transition underline"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                    {selectedUnitsList.map((u) => {
                      const isReassessment = reassessmentUnitIds.includes(u.id);
                      return (
                        <span
                          key={u.id}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border font-medium transition ${
                            isReassessment
                              ? 'bg-amber-950/40 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          <span className="font-mono font-bold">{u.unitCode}</span>
                          <span className="text-[11px] max-w-[120px] sm:max-w-[180px] truncate text-slate-300">{u.unitName}</span>
                          {isReassessment && (
                            <span className="text-[9px] font-bold px-1 bg-amber-500/30 text-amber-300 rounded">
                              Re-sit
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={(e) => removeUnit(u.id, e)}
                            title="Remove this unit"
                            className="p-0.5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Unit Tabs & Search */}
              <div className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center justify-between">
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setUnitFilterTab('COURSE')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      unitFilterTab === 'COURSE'
                        ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Course Units ({courseUnits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitFilterTab('ALL_SYLLABUS')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition ${
                      unitFilterTab === 'ALL_SYLLABUS'
                        ? 'bg-emerald-600 text-slate-950 font-bold shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    All Syllabus Units ({allDepartmentUnits.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnitFilterTab('REASSESSMENTS')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                      unitFilterTab === 'REASSESSMENTS'
                        ? 'bg-amber-500 text-slate-950 font-bold shadow'
                        : 'text-amber-400 hover:text-amber-300'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Re-sits ({reassessmentUnitsCount})
                  </button>
                </div>

                <div className="relative min-w-[200px]">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search unit code or name..."
                    value={unitSearchQuery}
                    onChange={(e) => setUnitSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 text-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Reassessment Explanatory Banner */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-slate-300">
                    Failed a unit previously? Click the <strong className="text-amber-400 font-bold">"🔄 Re-sit (KES {reassessmentFee.toLocaleString()})"</strong> button on any unit to register for reassessment.
                  </span>
                </div>
                <div className="text-[11px] font-mono text-amber-300 shrink-0 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Flat Fee: {config.defaultCurrency || 'KES'} {reassessmentFee.toLocaleString()}
                </div>
              </div>

              {displayedUnits.length === 0 ? (
                <div className="text-center py-10 text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 text-slate-600" />
                  No assessment units match your current filter. Try searching or switching tabs.
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5 max-h-80 overflow-y-auto pr-1">
                  {displayedUnits.map((u) => {
                    const isSelected = selectedUnitIds.includes(u.id);
                    const isReassessment = reassessmentUnitIds.includes(u.id);
                    const effectiveFee = getEffectiveUnitFee(u);
                    const chosenTrainerId = unitTrainerMap[u.id];
                    const chosenTrainer = trainers.find((t) => t.id === chosenTrainerId);

                    return (
                      <div
                        key={u.id}
                        onClick={() => toggleUnit(u.id)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col gap-3 ${
                          isSelected
                            ? isReassessment
                              ? 'bg-amber-950/20 border-amber-500/60 shadow-xs'
                              : 'bg-emerald-500/10 border-emerald-500/60 shadow-xs'
                            : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="flex items-start gap-3 min-w-0">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className={`mt-1 w-4 h-4 rounded focus:ring-2 border-slate-700 bg-slate-900 pointer-events-none shrink-0 ${
                                isReassessment ? 'text-amber-500 focus:ring-amber-400' : 'text-emerald-600 focus:ring-emerald-500'
                              }`}
                            />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono text-xs font-bold text-emerald-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                  {u.unitCode}
                                </span>
                                <span
                                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                                    u.category === 'Core'
                                      ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                                      : u.category === 'Common'
                                      ? 'bg-blue-500/10 text-blue-300 border border-blue-500/30'
                                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                                  }`}
                                >
                                  {u.category} Unit
                                </span>

                                {isReassessment && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                    <RotateCcw className="w-3 h-3" /> Reassessment (Failed Unit Re-sit)
                                  </span>
                                )}
                              </div>
                              <h4 className="font-semibold text-xs sm:text-sm text-slate-100 mt-1">
                                {u.unitName}
                              </h4>
                              <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                                {isSelected ? (
                                  chosenTrainer ? (
                                    <span className="text-emerald-300 font-medium flex items-center gap-1">
                                      <Users className="w-3 h-3 text-emerald-400" /> Taught by:{' '}
                                      <strong>{chosenTrainer.name}</strong> ({chosenTrainer.staffNumber})
                                    </span>
                                  ) : (
                                    <span className="text-amber-400 font-medium flex items-center gap-1">
                                      <AlertCircle className="w-3 h-3" /> Please select the trainer who taught you below
                                    </span>
                                  )
                                ) : (
                                  <span className="text-slate-500 flex items-center gap-1">
                                    <Users className="w-3 h-3 text-slate-600" /> Select unit to designate your class trainer
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Right side fee and Reassessment toggle button */}
                          <div className="flex items-center sm:flex-col items-end justify-between sm:justify-center gap-2 shrink-0 border-t sm:border-t-0 pt-2 sm:pt-0 border-slate-800">
                            <div className="text-right">
                              <div className={`font-mono font-bold text-xs sm:text-sm ${isReassessment ? 'text-amber-300' : 'text-slate-100'}`}>
                                {config.defaultCurrency || 'KES'} {effectiveFee.toLocaleString()}
                              </div>
                              {isReassessment ? (
                                <div className="text-[10px] text-amber-400 font-medium">
                                  Re-sit Rate <span className="line-through text-slate-500">KES {u.amountCharged.toLocaleString()}</span>
                                </div>
                              ) : (
                                <div className="text-[10px] text-slate-500">CDACC/TSNP Standard Fee</div>
                              )}
                            </div>

                            {/* Reassessment Toggle Action & Remove Action */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => toggleReassessmentMode(u.id, e)}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition border flex items-center gap-1 ${
                                  isReassessment
                                    ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold shadow'
                                    : 'bg-slate-900 hover:bg-slate-800 text-amber-400 border-amber-500/30 hover:border-amber-500/60'
                                }`}
                                title={isReassessment ? 'Reassessment mode enabled. Click to switch to regular attempt.' : 'Click to register as a failed unit reassessment re-sit (KES 2,000)'}
                              >
                                <RotateCcw className="w-3 h-3" />
                                <span>{isReassessment ? 'Re-sit' : 'Mark as Re-sit'}</span>
                              </button>

                              {isSelected && (
                                <button
                                  type="button"
                                  onClick={(e) => removeUnit(u.id, e)}
                                  className="p-1 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
                                  title="Remove unit from selection"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Student Trainer Selector for Selected Unit */}
                        {isSelected && (
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-900/70 px-3 py-2 rounded-xl"
                          >
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold">Trainer who taught your class:</span>
                              <span className="text-rose-400 font-bold">*</span>
                            </div>
                            <div className="flex-1 sm:max-w-xs">
                              <select
                                value={unitTrainerMap[u.id] || ''}
                                onChange={(e) => handleTrainerChangeForUnit(u.id, e.target.value)}
                                className={`w-full px-2.5 py-1.5 bg-slate-950 border rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 transition ${
                                  !unitTrainerMap[u.id]
                                    ? 'border-amber-500 text-amber-300 bg-amber-950/40 ring-1 ring-amber-500/50'
                                    : 'border-slate-700 text-emerald-300'
                                }`}
                              >
                                <option value="">-- Select Trainer who taught your class * --</option>
                                {trainers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.staffNumber}) {t.specialization ? `• ${t.specialization}` : ''}
                                  </option>
                                ))}
                              </select>
                              {!unitTrainerMap[u.id] && (
                                <span className="text-[10px] text-amber-400 font-medium block mt-1">
                                  ⚠️ Required: select the trainer who taught you for clearance
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Review Unit Selection (Remove, Add More, Toggle Re-sit & Confirm) */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950/60 rounded-xl border border-slate-800">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Review Your Selected Units ({selectedUnitsList.length})
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Review all units before submission. You can add more units or remove units directly below.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setErrorMsg('');
                      setCurrentStep(2);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 rounded-xl text-xs font-bold transition self-start sm:self-auto"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add More Units from Syllabus
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs border-b border-slate-800 pb-3 mb-3">
                  <div>
                    <span className="text-slate-500 block">Candidate:</span>
                    <span className="font-bold text-slate-200 truncate block">{student.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Admission No:</span>
                    <span className="font-mono font-semibold text-emerald-400">{student.admissionNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Module / Cycle:</span>
                    <span className="font-bold text-emerald-400">{formatModuleLabel(selectedModule)}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Series:</span>
                    <span className="font-semibold text-slate-200 truncate block">{selectedSeries?.name}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Year:</span>
                    <span className="font-mono font-bold text-slate-200">{selectedYear}</span>
                  </div>
                </div>

                {/* Units List with individual Remove & Re-sit controls */}
                {selectedUnitsList.length === 0 ? (
                  <div className="p-8 text-center bg-slate-900/60 rounded-xl border border-dashed border-slate-700 space-y-3">
                    <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
                    <div>
                      <h4 className="font-bold text-slate-200 text-sm">No Units Currently Selected</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        You have removed all units from your selection. Please add at least 1 unit to proceed.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs rounded-xl shadow transition"
                    >
                      <Plus className="w-4 h-4" /> Browse & Add Units from Syllabus
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {selectedUnitsList.map((u, i) => {
                      const isReassessment = reassessmentUnitIds.includes(u.id);
                      const fee = getEffectiveUnitFee(u);
                      const chosenTrainerId = unitTrainerMap[u.id];
                      const chosenTrainer = trainers.find((t) => t.id === chosenTrainerId);

                      return (
                        <div
                          key={u.id}
                          className={`p-3 rounded-xl border flex flex-col gap-2.5 text-xs ${
                            isReassessment
                              ? 'bg-amber-950/20 border-amber-800/60'
                              : 'bg-slate-900 border-slate-800'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="font-mono font-bold text-slate-500 text-[11px] w-5 shrink-0 pt-0.5">{i + 1}.</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-emerald-400 text-xs">{u.unitCode}</span>
                                  <span className="text-[10px] px-2 py-0.2 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                                    {u.category}
                                  </span>
                                  {isReassessment && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                                      REASSESSMENT (RE-SIT)
                                    </span>
                                  )}
                                </div>
                                <div className="text-slate-200 text-xs font-medium mt-0.5">{u.unitName}</div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800/80">
                              <div className="text-left sm:text-right">
                                <span className={`font-mono font-bold text-xs ${isReassessment ? 'text-amber-300' : 'text-slate-100'}`}>
                                  {config.defaultCurrency || 'KES'} {fee.toLocaleString()}
                                </span>
                                {isReassessment && (
                                  <div className="text-[9px] text-amber-400 font-mono">Re-sit Fee</div>
                                )}
                              </div>

                              {/* Actions on this unit: Toggle Re-sit & Remove */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={(e) => toggleReassessmentMode(u.id, e)}
                                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border flex items-center gap-1 ${
                                    isReassessment
                                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-bold'
                                      : 'bg-slate-800 hover:bg-slate-700 text-amber-400 border-slate-700'
                                  }`}
                                  title={isReassessment ? 'Click to change back to regular attempt' : 'Click to mark as failed unit re-sit'}
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>{isReassessment ? 'Re-sit' : 'Regular'}</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={(e) => removeUnit(u.id, e)}
                                  className="px-2 py-1 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-lg text-[10px] font-semibold transition flex items-center gap-1"
                                  title="Remove this unit from your registration"
                                >
                                  <Trash2 className="w-3 h-3 text-rose-400" />
                                  <span>Remove</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Student selected trainer for clearance */}
                          <div className="pt-2 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-950/60 px-3 py-1.5 rounded-lg">
                            <div className="flex items-center gap-1.5 text-xs text-slate-300">
                              <Users className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                              <span className="font-semibold">Subject Trainer:</span>
                              <span className="text-rose-400 font-bold">*</span>
                            </div>
                            <div className="flex-1 sm:max-w-xs">
                              <select
                                value={unitTrainerMap[u.id] || ''}
                                onChange={(e) => handleTrainerChangeForUnit(u.id, e.target.value)}
                                className={`w-full px-2.5 py-1 bg-slate-900 border rounded-lg text-xs font-semibold focus:ring-2 focus:ring-emerald-500 ${
                                  !unitTrainerMap[u.id]
                                    ? 'border-amber-500 text-amber-300 bg-amber-950/40 ring-1 ring-amber-500/50'
                                    : 'border-slate-700 text-emerald-300'
                                }`}
                              >
                                <option value="">-- Select Trainer who taught you * --</option>
                                {trainers.map((t) => (
                                  <option key={t.id} value={t.id}>
                                    {t.name} ({t.staffNumber}) {t.specialization ? `• ${t.specialization}` : ''}
                                  </option>
                                ))}
                              </select>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Breakdown & Total */}
                <div className="pt-3 mt-3 border-t border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Regular Units ({regularUnitsCount}):</span>
                    <span className="font-mono text-slate-200">
                      {config.defaultCurrency || 'KES'}{' '}
                      {selectedUnitsList
                        .filter((u) => !reassessmentUnitIds.includes(u.id))
                        .reduce((acc, u) => acc + (u.amountCharged || 0), 0)
                        .toLocaleString()}
                    </span>
                  </div>

                  {reassessmentUnitsCount > 0 && (
                    <div className="flex items-center justify-between text-xs text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/30">
                      <span className="flex items-center gap-1">
                        <RotateCcw className="w-3.5 h-3.5" /> Reassessment Units ({reassessmentUnitsCount} @ {config.defaultCurrency || 'KES'} {reassessmentFee.toLocaleString()}/unit):
                      </span>
                      <span className="font-mono font-bold text-amber-300">
                        {config.defaultCurrency || 'KES'} {(reassessmentUnitsCount * reassessmentFee).toLocaleString()}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                    <div>
                      <div className="text-xs font-bold text-slate-300">Total CDACC/TSNP Units: {selectedUnitsList.length}</div>
                      <div className="text-[10px] text-slate-500">Official CDACC/TSNP Institutional Assessment Fee</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-400 mr-2">Total Amount Payable:</span>
                      <span className="font-mono font-extrabold text-lg text-emerald-400">
                        {config.defaultCurrency || 'KES'} {totalAmount.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Automatic Trainer Routing Matrix preview */}
              {selectedUnitsList.length > 0 && (
                <div className="p-3.5 bg-emerald-950/30 rounded-xl border border-emerald-800/40 text-xs">
                  <div className="font-bold text-emerald-300 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-400" /> Trainee-Selected Trainer Clearance Dispatch
                  </div>
                  <p className="text-slate-400 text-[11px] mb-2">
                    Upon submission, your units will automatically be dispatched to your designated subject trainers for electronic assessment clearance:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(routingMap).map(([trainerName, unitsTaught]) => (
                      <div key={trainerName} className="p-2 bg-slate-900 rounded-lg border border-slate-800 text-[11px]">
                        <span className="font-bold text-white block">{trainerName}</span>
                        <span className="text-emerald-400 font-mono text-[10px]">
                          Clears {unitsTaught.length} Unit(s): {unitsTaught.map((u) => u.unitCode.split('/').slice(3, 5).join('/') || u.unitCode).join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Wizard Footer Navigation */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={() => {
                  setErrorMsg('');
                  setCurrentStep(currentStep - 1);
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
              >
                <ArrowLeft className="w-4 h-4" /> Previous
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-400 hover:bg-slate-800 text-xs rounded-xl transition"
            >
              Cancel
            </button>

            {currentStep < 3 ? (
              <button
                type="button"
                onClick={() => {
                  if (currentStep === 1) {
                    if (!selectedSeriesId) {
                      setErrorMsg('Please select an assessment series.');
                      return;
                    }
                    setErrorMsg('');
                    setCurrentStep(2);
                  } else if (currentStep === 2) {
                    if (selectedUnitIds.length === 0) {
                      setErrorMsg('Please select at least 1 unit to proceed.');
                      return;
                    }
                    const missingTrainers = selectedUnitsList.filter((u) => !unitTrainerMap[u.id]);
                    if (missingTrainers.length > 0) {
                      setErrorMsg(
                        `Please select the trainer who taught your class for: ${missingTrainers
                          .map((u) => u.unitCode)
                          .join(', ')} before proceeding.`
                      );
                      return;
                    }
                    setErrorMsg('');
                    setCurrentStep(3);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold rounded-xl shadow-lg transition"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting || selectedUnitsList.length === 0}
                onClick={handleSubmitRegistration}
                className="inline-flex items-center gap-1.5 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 text-xs font-bold rounded-xl shadow-lg shadow-emerald-950/40 transition"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" /> {isEditing ? 'Save & Update Unit Selection' : 'Confirm & Route to Trainers'}
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
