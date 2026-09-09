import React, { useState, useMemo } from 'react';
import {
  Registration,
  Trainer,
  Student,
  User,
  AssessmentSeries,
  formatModuleLabel,
} from '../../types';
import { StorageService, triggerStoreUpdate } from '../../services/storage';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Send,
  Copy,
  Check,
  Phone,
  Mail,
  ExternalLink,
  UserCheck,
  Search,
  Filter,
  Bell,
  Users,
  BookOpen,
  Sparkles,
  MessageSquare,
  ShieldAlert,
  GraduationCap,
  Calendar,
} from 'lucide-react';

interface PendingVerificationMonitorProps {
  registrations: Registration[];
  trainers: Trainer[];
  students: Student[];
  users?: User[];
  assessmentSeriesList?: AssessmentSeries[];
  onViewRegistration?: (registrationRef: string) => void;
}

interface PendingUnitDetail {
  registrationId: string;
  registrationRef: string;
  studentId: string;
  studentName: string;
  admissionNumber: string;
  courseName: string;
  module: string;
  seriesName: string;
  submittedAt: string;
  unitItemId: string;
  unitCode: string;
  unitName: string;
  category: string;
  isReassessment?: boolean;
  amountCharged: number;
  trainerId?: string;
  trainerName?: string;
  matchedTrainer?: Trainer;
}

export const PendingVerificationMonitor: React.FC<PendingVerificationMonitorProps> = ({
  registrations,
  trainers,
  students,
  users = [],
  assessmentSeriesList = [],
  onViewRegistration,
}) => {
  const [viewMode, setViewMode] = useState<'BY_TRAINER' | 'BY_TRAINEE'>('BY_TRAINER');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrainerFilter, setSelectedTrainerFilter] = useState<string>('ALL');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [sendingAlertId, setSendingAlertId] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => {
      setActionSuccessMessage(null);
    }, 4500);
  };

  // Extract all pending units across all registrations
  const pendingUnits: PendingUnitDetail[] = useMemo(() => {
    const list: PendingUnitDetail[] = [];

    registrations.forEach((reg) => {
      if (!reg.units || !Array.isArray(reg.units)) return;

      reg.units.forEach((u) => {
        if (u.status === 'PENDING') {
          // Find matching trainer
          const matchedTrainer = trainers.find((t) => {
            const tId = (t.id || '').trim().toLowerCase();
            const tUserId = (t.userId || '').trim().toLowerCase();
            const tStaff = (t.staffNumber || '').trim().toLowerCase();
            const tName = (t.name || '').trim().toLowerCase();

            const uTId = (u.trainerId || '').trim().toLowerCase();
            const uTName = (u.trainerName || '').trim().toLowerCase();
            const uStaff = ((u as any).trainerStaffNumber || '').trim().toLowerCase();

            if (uTId && (uTId === tId || uTId === tUserId || uTId === tStaff)) return true;
            if (uTName && (uTName === tName || uTName.includes(tName) || tName.includes(uTName))) return true;
            if (tStaff && (uStaff === tStaff || uTName.includes(tStaff))) return true;
            return false;
          });

          list.push({
            registrationId: reg.id,
            registrationRef: reg.registrationReference,
            studentId: reg.studentId,
            studentName: reg.studentName,
            admissionNumber: reg.admissionNumber,
            courseName: reg.courseName,
            module: String(reg.module || '1'),
            seriesName: reg.seriesName,
            submittedAt: reg.submittedAt,
            unitItemId: u.id,
            unitCode: u.unitCode,
            unitName: u.unitName,
            category: u.category,
            isReassessment: u.isReassessment,
            amountCharged: u.amountCharged,
            trainerId: u.trainerId,
            trainerName: u.trainerName || matchedTrainer?.name || 'Unassigned Trainer',
            matchedTrainer,
          });
        }
      });
    });

    return list;
  }, [registrations, trainers]);

  // Aggregate by Trainer
  const trainerGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        trainerKey: string;
        trainerName: string;
        staffNumber?: string;
        email?: string;
        phone?: string;
        departmentId?: string;
        trainerObj?: Trainer;
        items: PendingUnitDetail[];
        studentSet: Set<string>;
      }
    >();

    pendingUnits.forEach((p) => {
      const key = p.matchedTrainer?.id || p.trainerId || p.trainerName || 'UNKNOWN';
      const name = p.matchedTrainer?.name || p.trainerName || 'Assigned Subject Trainer';
      const staff = p.matchedTrainer?.staffNumber;
      const email = p.matchedTrainer?.email;
      const phone = p.matchedTrainer?.phone;
      const dept = p.matchedTrainer?.departmentId;

      if (!map.has(key)) {
        map.set(key, {
          trainerKey: key,
          trainerName: name,
          staffNumber: staff,
          email,
          phone,
          departmentId: dept,
          trainerObj: p.matchedTrainer,
          items: [],
          studentSet: new Set(),
        });
      }

      const group = map.get(key)!;
      group.items.push(p);
      group.studentSet.add(p.admissionNumber);
    });

    return Array.from(map.values()).sort((a, b) => b.items.length - a.items.length);
  }, [pendingUnits]);

  // Aggregate by Trainee
  const traineeGroups = useMemo(() => {
    const map = new Map<
      string,
      {
        registrationId: string;
        registrationRef: string;
        studentName: string;
        admissionNumber: string;
        courseName: string;
        module: string;
        seriesName: string;
        submittedAt: string;
        items: PendingUnitDetail[];
        trainersMap: Map<string, { trainerName: string; staffNumber?: string; count: number }>;
      }
    >();

    pendingUnits.forEach((p) => {
      const key = p.registrationId;
      if (!map.has(key)) {
        map.set(key, {
          registrationId: p.registrationId,
          registrationRef: p.registrationRef,
          studentName: p.studentName,
          admissionNumber: p.admissionNumber,
          courseName: p.courseName,
          module: p.module,
          seriesName: p.seriesName,
          submittedAt: p.submittedAt,
          items: [],
          trainersMap: new Map(),
        });
      }

      const group = map.get(key)!;
      group.items.push(p);

      const trKey = p.trainerName || 'Assigned Trainer';
      const trExisting = group.trainersMap.get(trKey) || {
        trainerName: trKey,
        staffNumber: p.matchedTrainer?.staffNumber,
        count: 0,
      };
      trExisting.count += 1;
      group.trainersMap.set(trKey, trExisting);
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );
  }, [pendingUnits]);

  // Filtering
  const filteredTrainerGroups = useMemo(() => {
    return trainerGroups.filter((tg) => {
      if (selectedTrainerFilter !== 'ALL' && tg.trainerKey !== selectedTrainerFilter) {
        return false;
      }
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTrainer =
        tg.trainerName.toLowerCase().includes(q) ||
        (tg.staffNumber && tg.staffNumber.toLowerCase().includes(q));
      const matchItem = tg.items.some(
        (i) =>
          i.studentName.toLowerCase().includes(q) ||
          i.admissionNumber.toLowerCase().includes(q) ||
          i.unitCode.toLowerCase().includes(q) ||
          i.unitName.toLowerCase().includes(q) ||
          i.registrationRef.toLowerCase().includes(q)
      );
      return matchTrainer || matchItem;
    });
  }, [trainerGroups, selectedTrainerFilter, searchQuery]);

  const filteredTraineeGroups = useMemo(() => {
    return traineeGroups.filter((tg) => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase().trim();
      const matchTrainee =
        tg.studentName.toLowerCase().includes(q) ||
        tg.admissionNumber.toLowerCase().includes(q) ||
        tg.registrationRef.toLowerCase().includes(q) ||
        tg.courseName.toLowerCase().includes(q);
      const matchUnit = tg.items.some(
        (i) =>
          i.unitCode.toLowerCase().includes(q) ||
          i.unitName.toLowerCase().includes(q) ||
          (i.trainerName && i.trainerName.toLowerCase().includes(q))
      );
      return matchTrainee || matchUnit;
    });
  }, [traineeGroups, searchQuery]);

  // Action: Send In-App Reminder to Trainer
  const handleSendTrainerReminder = (tg: typeof trainerGroups[0]) => {
    setSendingAlertId(tg.trainerKey);

    const studentNames = Array.from(tg.studentSet).slice(0, 3).join(', ') +
      (tg.studentSet.size > 3 ? ` and ${tg.studentSet.size - 3} more` : '');

    const unitCodes = Array.from(new Set(tg.items.map((i) => i.unitCode))).slice(0, 4).join(', ');

    // Target by userId or fallback to id
    const targetUserId = tg.trainerObj?.userId || tg.trainerObj?.id || tg.trainerKey;

    StorageService.createNotification({
      targetUserId,
      targetRole: 'TRAINER',
      title: 'Administrator Verification Alert: Pending Trainee Units',
      message: `Administrator Reminder: You have ${tg.items.length} pending unit(s) (${unitCodes}) submitted by trainee(s) ${studentNames} awaiting your electronic clearance. Please log in to complete your verifications.`,
      type: 'WARNING',
      linkRegistrationId: tg.items[0]?.registrationId,
    });

    triggerStoreUpdate();

    setTimeout(() => {
      setSendingAlertId(null);
      showNotification(
        `High-priority in-app notification sent to ${tg.trainerName} (${tg.items.length} pending units).`
      );
    }, 400);
  };

  // Action: Send Reminders to ALL pending trainers
  const handleAlertAllPendingTrainers = () => {
    if (trainerGroups.length === 0) return;

    const confirmed = window.confirm(
      `Send automated in-app clearance reminders to all ${trainerGroups.length} subject trainers with pending tasks?`
    );
    if (!confirmed) return;

    trainerGroups.forEach((tg) => {
      const targetUserId = tg.trainerObj?.userId || tg.trainerObj?.id || tg.trainerKey;
      const studentNames = Array.from(tg.studentSet).slice(0, 3).join(', ');

      StorageService.createNotification({
        targetUserId,
        targetRole: 'TRAINER',
        title: 'Clearance Deadline Alert: Pending Assessment Verification',
        message: `System Administrator Notice: Please log in to clear ${tg.items.length} pending unit verification task(s) for candidate(s) ${studentNames}. Departmental approval cannot proceed without your trainer clearance.`,
        type: 'WARNING',
        linkRegistrationId: tg.items[0]?.registrationId,
      });
    });

    triggerStoreUpdate();
    showNotification(
      `Dispatched urgent in-app reminders to all ${trainerGroups.length} trainers with pending verification duties.`
    );
  };

  // Action: Copy SMS/WhatsApp message to clipboard
  const handleCopyAlertMessage = (tg: typeof trainerGroups[0]) => {
    const studentList = Array.from(
      new Set(tg.items.map((i) => `${i.studentName} (${i.admissionNumber})`))
    ).join('; ');

    const text = `*TSNP ASSESSMENT CLEARANCE ALERT*\n\nDear ${tg.trainerName}${
      tg.staffNumber ? ` (Staff ID: ${tg.staffNumber})` : ''
    },\n\nYou have ${tg.items.length} pending assessment unit(s) submitted by ${
      tg.studentSet.size
    } candidate(s) awaiting your electronic verification on the TSNP Examination Portal:\n- Candidates: ${studentList}\n\nPlease log in to your trainer portal account to review continuous assessment records and clear the units.\n\n_TSNP Examination & Assessment Directorate_`;

    navigator.clipboard.writeText(text).then(() => {
      setCopiedId(tg.trainerKey);
      setTimeout(() => setCopiedId(null), 2500);
      showNotification(`Copied formatted alert message for ${tg.trainerName} to clipboard!`);
    });
  };

  return (
    <div className="space-y-6">
      {/* Alert / Feedback Banner */}
      {actionSuccessMessage && (
        <div className="flex items-center gap-3 p-4 bg-emerald-950/80 border border-emerald-800/80 text-emerald-200 rounded-2xl shadow-lg animate-in fade-in slide-in-from-top-2 duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <p className="text-sm font-medium flex-1">{actionSuccessMessage}</p>
        </div>
      )}

      {/* KPI Overview Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Trainees Waiting
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {traineeGroups.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">candidates</span>
          </div>
          <p className="text-xs text-amber-400/80 mt-1 font-medium">
            Waiting for trainer assessment clearance
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pending Units
            </span>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center border border-cyan-500/20">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-cyan-400 font-mono">
              {pendingUnits.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">units</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Across all active assessment cohorts</p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Trainers With Tasks
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/20">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono">
              {trainerGroups.length}
            </span>
            <span className="text-xs text-slate-400 font-medium">trainers</span>
          </div>
          <p className="text-xs text-indigo-300/80 mt-1 font-medium">
            To be alerted for electronic sign-off
          </p>
        </div>

        <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-5 border border-slate-800 shadow-md flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Admin Quick Broadcast
            </span>
            <p className="text-xs text-slate-400 mt-1">
              Notify all assigned trainers simultaneously
            </p>
          </div>
          <button
            onClick={handleAlertAllPendingTrainers}
            disabled={trainerGroups.length === 0}
            className="mt-3 w-full py-2.5 px-3 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span>Alert All Pending Trainers</span>
          </button>
        </div>
      </div>

      {/* Control Header & Filters */}
      <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-800 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Pending Trainer Verification Monitor & Alerts
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Monitor which trainees have submitted units and alert respective subject trainers to log in and verify them.
            </p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-950 rounded-xl border border-slate-800 shrink-0">
            <button
              onClick={() => setViewMode('BY_TRAINER')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'BY_TRAINER'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span>By Trainer ({trainerGroups.length})</span>
            </button>
            <button
              onClick={() => setViewMode('BY_TRAINEE')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                viewMode === 'BY_TRAINEE'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>By Trainee ({traineeGroups.length})</span>
            </button>
          </div>
        </div>

        {/* Search & Trainer Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by trainee name, admission number, unit code, or trainer name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl pl-9 pr-4 py-2 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          {viewMode === 'BY_TRAINER' && (
            <div className="sm:col-span-4">
              <select
                value={selectedTrainerFilter}
                onChange={(e) => setSelectedTrainerFilter(e.target.value)}
                className="w-full bg-slate-950/70 border border-slate-700/80 rounded-xl px-3 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Subject Trainers ({trainerGroups.length})</option>
                {trainerGroups.map((tg) => (
                  <option key={tg.trainerKey} value={tg.trainerKey}>
                    {tg.trainerName} ({tg.items.length} units pending)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Content View: BY TRAINER */}
      {viewMode === 'BY_TRAINER' && (
        <div className="space-y-4">
          {filteredTrainerGroups.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl p-10 border border-slate-800 text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-3">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-white">All Clear! No Pending Verifications</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                All submitted trainee units have been verified by their respective subject trainers, or no registrations match your search filters.
              </p>
            </div>
          ) : (
            filteredTrainerGroups.map((tg) => (
              <div
                key={tg.trainerKey}
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition"
              >
                {/* Trainer Header & Alert Action Row */}
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-bold text-lg border border-amber-500/30 shrink-0 shadow-inner">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white tracking-tight">
                          {tg.trainerName}
                        </h3>
                        {tg.staffNumber && (
                          <span className="bg-slate-800 text-slate-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                            Staff ID: {tg.staffNumber}
                          </span>
                        )}
                        <span className="bg-amber-500/10 text-amber-300 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-500/30">
                          {tg.items.length} Pending Unit{tg.items.length > 1 ? 's' : ''} (
                          {tg.studentSet.size} Trainee{tg.studentSet.size > 1 ? 's' : ''})
                        </span>
                      </div>

                      {/* Contact info */}
                      <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-1.5">
                        {tg.email && (
                          <a
                            href={`mailto:${tg.email}?subject=Urgent: Pending CDACC Assessment Verification on TSNP Portal`}
                            className="flex items-center gap-1 hover:text-cyan-400 transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            <span>{tg.email}</span>
                          </a>
                        )}
                        {tg.phone && (
                          <a
                            href={`tel:${tg.phone}`}
                            className="flex items-center gap-1 hover:text-emerald-400 transition"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>{tg.phone}</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions for this trainer */}
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => handleSendTrainerReminder(tg)}
                      disabled={sendingAlertId === tg.trainerKey}
                      className="flex items-center gap-1.5 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer disabled:opacity-50"
                      title="Send instant in-app notification to this trainer"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>{sendingAlertId === tg.trainerKey ? 'Sending...' : 'Send In-App Alert'}</span>
                    </button>

                    <button
                      onClick={() => handleCopyAlertMessage(tg)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold transition border border-slate-700 shadow-sm cursor-pointer"
                      title="Copy pre-filled reminder text for WhatsApp or SMS"
                    >
                      {copiedId === tg.trainerKey ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-emerald-400 font-bold">Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                          <span>Copy WhatsApp/SMS</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Trainees and Units Assigned to this Trainer */}
                <div className="mt-4">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5">
                    Trainees & Units Awaiting This Trainer's Electronic Sign-off:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {tg.items.map((item) => (
                      <div
                        key={item.unitItemId}
                        className="bg-slate-950/60 rounded-xl p-3 border border-slate-800/80 flex flex-col justify-between hover:border-slate-700 transition"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <span className="text-xs font-bold text-white block">
                                {item.studentName}
                              </span>
                              <span className="text-[11px] font-mono text-cyan-400">
                                {item.admissionNumber}
                              </span>
                            </div>
                            <span className="bg-amber-500/10 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-500/30">
                              PENDING
                            </span>
                          </div>

                          <div className="mt-2 text-xs">
                            <span className="font-mono font-bold text-slate-200">
                              {item.unitCode}
                            </span>{' '}
                            - <span className="text-slate-300">{item.unitName}</span>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-400">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-500" />
                            {formatModuleLabel(item.module)} • {item.seriesName}
                          </span>
                          {onViewRegistration && (
                            <button
                              onClick={() => onViewRegistration(item.registrationRef)}
                              className="text-cyan-400 hover:text-cyan-300 hover:underline flex items-center gap-0.5 font-semibold cursor-pointer"
                            >
                              <span>View Docket</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Content View: BY TRAINEE */}
      {viewMode === 'BY_TRAINEE' && (
        <div className="space-y-4">
          {filteredTraineeGroups.length === 0 ? (
            <div className="bg-slate-900/60 rounded-2xl p-10 border border-slate-800 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <h3 className="text-base font-bold text-white">No Pending Trainee Submissions</h3>
              <p className="text-xs text-slate-400 mt-1">
                All candidates have their units verified, or no submissions match your search query.
              </p>
            </div>
          ) : (
            filteredTraineeGroups.map((tg) => (
              <div
                key={tg.registrationId}
                className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-5 shadow-xl hover:border-slate-700 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-950 text-cyan-400 flex items-center justify-center font-bold border border-slate-800 shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-bold text-white">{tg.studentName}</h3>
                        <span className="bg-slate-800 text-cyan-300 font-mono text-xs px-2.5 py-0.5 rounded-full border border-slate-700">
                          {tg.admissionNumber}
                        </span>
                        <span className="text-xs text-slate-400">
                          Ref: <strong className="font-mono text-slate-300">{tg.registrationRef}</strong>
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {tg.courseName} • {formatModuleLabel(tg.module)} ({tg.seriesName})
                      </p>
                    </div>
                  </div>

                  {onViewRegistration && (
                    <button
                      onClick={() => onViewRegistration(tg.registrationRef)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-xl text-xs font-semibold border border-slate-700 transition shrink-0 cursor-pointer"
                    >
                      <span>Open Dossier</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Assigned Trainers Summary & Units List */}
                <div className="mt-4 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400">
                      Assigned Subject Trainers:
                    </span>
                    {(Array.from(tg.trainersMap.values()) as Array<{ trainerName: string; staffNumber?: string; count: number }>).map((t, idx) => (
                      <span
                        key={idx}
                        className="bg-slate-950 text-slate-200 border border-amber-500/30 text-xs px-2.5 py-1 rounded-lg flex items-center gap-1.5"
                      >
                        <UserCheck className="w-3 h-3 text-amber-400" />
                        <strong>{t.trainerName}</strong>
                        <span className="text-[11px] text-amber-400 font-bold">
                          ({t.count} unit{t.count > 1 ? 's' : ''})
                        </span>
                      </span>
                    ))}
                  </div>

                  {/* Units Table */}
                  <div className="overflow-x-auto rounded-xl border border-slate-800/80 bg-slate-950/40">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                        <tr>
                          <th className="px-3 py-2">Unit Code & Title</th>
                          <th className="px-3 py-2">Category</th>
                          <th className="px-3 py-2">Assigned Trainer</th>
                          <th className="px-3 py-2">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-slate-300">
                        {tg.items.map((item) => (
                          <tr key={item.unitItemId} className="hover:bg-slate-900/50">
                            <td className="px-3 py-2">
                              <span className="font-mono font-bold text-cyan-400 mr-2">
                                {item.unitCode}
                              </span>
                              <span>{item.unitName}</span>
                            </td>
                            <td className="px-3 py-2 text-slate-400">{item.category}</td>
                            <td className="px-3 py-2">
                              <span className="font-semibold text-white">
                                {item.trainerName}
                              </span>
                              {item.matchedTrainer?.staffNumber && (
                                <span className="text-[10px] text-slate-400 block font-mono">
                                  {item.matchedTrainer.staffNumber}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2">
                              <span className="bg-amber-500/10 text-amber-300 font-bold text-[10px] px-2 py-0.5 rounded-md border border-amber-500/30">
                                PENDING
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
