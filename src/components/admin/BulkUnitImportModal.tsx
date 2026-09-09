import React, { useState, useRef } from 'react';
import { Unit, Course, Level, Trainer, UnitCategoryItem } from '../../types';
import { StorageService } from '../../services/storage';
import {
  X,
  FileSpreadsheet,
  Download,
  Upload,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Info,
  Check,
} from 'lucide-react';

interface ParsedUnitRow {
  isValid: boolean;
  isExisting: boolean;
  errors: string[];
  unit: Unit;
  raw: {
    unitCode: string;
    unitTitle: string;
    category: string;
    courseCode: string;
    level: string;
    amountCharged: string;
    trainerStaffNo: string;
    status: string;
    description: string;
  };
  matchedCourseName?: string;
  matchedLevelName?: string;
  matchedTrainerName?: string;
}

interface BulkUnitImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (importedUnits: Unit[]) => void;
  existingUnits: Unit[];
  courses: Course[];
  levels: Level[];
  trainers: Trainer[];
  categories: UnitCategoryItem[];
}

export const BulkUnitImportModal: React.FC<BulkUnitImportModalProps> = ({
  isOpen,
  onClose,
  onImportComplete,
  existingUnits,
  courses,
  levels,
  trainers,
  categories,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedUnitRow[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Generate Sample CSV Template with Realistic CDACC Data
  const handleDownloadTemplate = () => {
    const defaultCourseCode = courses[0]?.code || 'DICT';
    const defaultLevelCode = levels[0]?.code || 'Level 6';
    const defaultTrainerStaff = trainers[0]?.staffNumber || 'TSNP/TR/001';

    const csvHeaders = 'UnitCode,UnitTitle,Category,CourseCode,Level,AmountCharged,TrainerStaffNo,Status,Description';
    const sampleRows = [
      `DICT/CU/IT/CR/01/6/A,Object Oriented Programming with Java,Core,${defaultCourseCode},${defaultLevelCode},2500,${defaultTrainerStaff},ACTIVE,Java OOP programming and software design patterns`,
      `DICT/CU/IT/CR/02/6/A,Database Management Systems,Core,${defaultCourseCode},${defaultLevelCode},2500,${defaultTrainerStaff},ACTIVE,Relational SQL database design and query optimization`,
      `DICT/CU/IT/CC/01/6/A,Communication Skills,Common,${defaultCourseCode},${defaultLevelCode},1800,${defaultTrainerStaff},ACTIVE,Workplace technical reporting and communication`,
      `DICT/CU/IT/BC/01/6/A,Basic Digital Literacy,Basic,${defaultCourseCode},${defaultLevelCode},1200,${defaultTrainerStaff},ACTIVE,Foundational computer applications and office productivity`,
      `CS/CU/IT/CR/01/5/A,Computer Maintenance and Repairs,Core,CS,Level 5,2000,${defaultTrainerStaff},ACTIVE,Hardware diagnosis and motherboard troubleshooting`,
    ];

    const csvContent = [csvHeaders, ...sampleRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'TSNP_CDACC_Units_Import_Template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Robust CSV parser supporting quoted commas
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"' || char === "'") {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result.map((c) => c.replace(/^["']|["']$/g, '').trim());
  };

  const processCSVText = (csvText: string) => {
    try {
      const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
      if (lines.length < 2) {
        setErrorMsg('The CSV file appears to be empty or missing data rows.');
        setParsedRows([]);
        return;
      }

      const headerCols = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

      // Find column indices with flexible name matching
      const getColIdx = (aliases: string[]): number => {
        return headerCols.findIndex((h) => aliases.some((a) => h.includes(a)));
      };

      const codeIdx = getColIdx(['unitcode', 'code', 'unitno']);
      const titleIdx = getColIdx(['unittitle', 'title', 'unitname', 'name']);
      const catIdx = getColIdx(['category', 'cat', 'type']);
      const courseIdx = getColIdx(['coursecode', 'course', 'programme']);
      const levelIdx = getColIdx(['level', 'qualification', 'academiclvl']);
      const feeIdx = getColIdx(['amountcharged', 'amount', 'fee', 'price', 'cost']);
      const trainerIdx = getColIdx(['trainerstaffno', 'trainer', 'staffno', 'staffnumber', 'instructor']);
      const statusIdx = getColIdx(['status', 'state', 'active']);
      const descIdx = getColIdx(['description', 'desc', 'notes', 'summary']);

      const existingCodeMap = new Map<string, Unit>();
      existingUnits.forEach((u) => existingCodeMap.set(u.unitCode.toUpperCase().trim(), u));

      const seenCodesInBatch = new Set<string>();
      const rows: ParsedUnitRow[] = [];

      lines.slice(1).forEach((line, rowIdx) => {
        const cols = parseCSVLine(line);
        if (cols.length === 0 || cols.every((c) => c === '')) return;

        // Extract raw values
        const rawCode = (codeIdx >= 0 ? cols[codeIdx] : cols[0]) || '';
        const rawTitle = (titleIdx >= 0 ? cols[titleIdx] : cols[1]) || '';
        const rawCategory = (catIdx >= 0 ? cols[catIdx] : cols[2]) || 'Core';
        const rawCourse = (courseIdx >= 0 ? cols[courseIdx] : cols[3]) || '';
        const rawLevel = (levelIdx >= 0 ? cols[levelIdx] : cols[4]) || '';
        const rawFee = (feeIdx >= 0 ? cols[feeIdx] : cols[5]) || '';
        const rawTrainer = (trainerIdx >= 0 ? cols[trainerIdx] : cols[6]) || '';
        const rawStatus = (statusIdx >= 0 ? cols[statusIdx] : cols[7]) || 'ACTIVE';
        const rawDesc = (descIdx >= 0 ? cols[descIdx] : cols[8]) || '';

        const errors: string[] = [];
        if (!rawCode.trim()) errors.push('Missing Unit Code');
        if (!rawTitle.trim()) errors.push('Missing Unit Title');

        const cleanCode = rawCode.trim().toUpperCase();

        if (seenCodesInBatch.has(cleanCode)) {
          errors.push(`Duplicate unit code "${cleanCode}" repeated within this CSV file.`);
        } else if (cleanCode) {
          seenCodesInBatch.add(cleanCode);
        }

        // 1. Resolve Category
        const matchedCategory =
          categories.find(
            (c) =>
              c.name.toLowerCase() === rawCategory.trim().toLowerCase() ||
              c.code.toLowerCase() === rawCategory.trim().toLowerCase()
          )?.name ||
          (rawCategory.toLowerCase().includes('common')
            ? 'Common'
            : rawCategory.toLowerCase().includes('basic')
            ? 'Basic'
            : 'Core');

        // 2. Resolve Course
        let matchedCourse = courses.find(
          (c) =>
            c.code.toLowerCase() === rawCourse.trim().toLowerCase() ||
            c.name.toLowerCase().includes(rawCourse.trim().toLowerCase())
        );
        if (!matchedCourse && cleanCode.includes('/')) {
          const prefix = cleanCode.split('/')[0];
          matchedCourse = courses.find((c) => c.code.toLowerCase() === prefix.toLowerCase());
        }
        const resolvedCourse = matchedCourse || courses[0];

        // 3. Resolve Level
        let matchedLevel = levels.find(
          (l) =>
            l.code.toLowerCase() === rawLevel.trim().toLowerCase() ||
            l.name.toLowerCase() === rawLevel.trim().toLowerCase() ||
            rawLevel.toLowerCase().includes(l.code.toLowerCase())
        );
        if (!matchedLevel && resolvedCourse?.levelId) {
          matchedLevel = levels.find((l) => l.id === resolvedCourse.levelId);
        }
        const resolvedLevel = matchedLevel || levels[0];

        // 4. Resolve Amount
        const standardCatFee = StorageService.getCategoryDefaultAmount(matchedCategory, categories);
        const parsedFeeNum = Number(rawFee.replace(/[^0-9.]/g, ''));
        const resolvedAmount = !isNaN(parsedFeeNum) && parsedFeeNum > 0 ? parsedFeeNum : standardCatFee;

        // 5. Resolve Trainer
        let matchedTrainer = trainers.find(
          (t) =>
            (rawTrainer && t.staffNumber.toLowerCase() === rawTrainer.trim().toLowerCase()) ||
            (rawTrainer && t.name.toLowerCase().includes(rawTrainer.trim().toLowerCase())) ||
            (rawTrainer && t.email.toLowerCase() === rawTrainer.trim().toLowerCase())
        );
        const resolvedTrainer = matchedTrainer || trainers[0];

        // 6. Resolve Status
        const resolvedStatus: 'ACTIVE' | 'INACTIVE' =
          rawStatus.trim().toUpperCase() === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE';

        // 7. Check if Existing
        const existingUnit = existingCodeMap.get(cleanCode);
        const unitId = existingUnit ? existingUnit.id : `unit-${Date.now()}-${rowIdx}`;

        const finalizedUnit: Unit = {
          id: unitId,
          unitCode: cleanCode,
          unitName: rawTitle.trim(),
          category: matchedCategory,
          courseId: resolvedCourse?.id || '',
          levelId: resolvedLevel?.id || '',
          amountCharged: resolvedAmount,
          defaultTrainerId: resolvedTrainer?.id || '',
          status: resolvedStatus,
          description: rawDesc.trim() || undefined,
        };

        rows.push({
          isValid: errors.length === 0,
          isExisting: Boolean(existingUnit),
          errors,
          unit: finalizedUnit,
          raw: {
            unitCode: rawCode,
            unitTitle: rawTitle,
            category: rawCategory,
            courseCode: rawCourse,
            level: rawLevel,
            amountCharged: rawFee,
            trainerStaffNo: rawTrainer,
            status: rawStatus,
            description: rawDesc,
          },
          matchedCourseName: resolvedCourse ? `${resolvedCourse.code} - ${resolvedCourse.name}` : undefined,
          matchedLevelName: resolvedLevel?.name || resolvedLevel?.code,
          matchedTrainerName: resolvedTrainer ? `${resolvedTrainer.name} (${resolvedTrainer.staffNumber})` : undefined,
        });
      });

      setParsedRows(rows);
      setErrorMsg('');
    } catch (err: any) {
      setErrorMsg(`Failed to parse CSV file: ${err?.message || 'Invalid format'}`);
      setParsedRows([]);
    }
  };

  const handleFileChange = (selectedFile: File) => {
    if (!selectedFile.name.endsWith('.csv') && selectedFile.type !== 'text/csv') {
      setErrorMsg('Please select a valid CSV (.csv) file.');
      return;
    }
    setFile(selectedFile);
    setErrorMsg('');
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processCSVText(content);
    };
    reader.readAsText(selectedFile);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(droppedFile);
    }
  };

  const handleImportSubmit = () => {
    const validRows = parsedRows.filter((r) => r.isValid);
    if (validRows.length === 0) {
      setErrorMsg('No valid unit records found to import.');
      return;
    }

    const unitsToImport: Unit[] = [];
    validRows.forEach((r) => {
      if (r.isExisting && !updateExisting) {
        // Skip duplicate if user unchecked update
        return;
      }
      unitsToImport.push(r.unit);
    });

    if (unitsToImport.length === 0) {
      setErrorMsg('No units selected for import after filtering duplicate rules.');
      return;
    }

    setIsProcessing(true);
    try {
      // Save all units via StorageService and sync with backend
      StorageService.saveUnitsBulk(unitsToImport);
      onImportComplete(unitsToImport);
      onClose();
    } catch (err: any) {
      setErrorMsg(`Error saving imported units: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const validCount = parsedRows.filter((r) => r.isValid).length;
  const newCount = parsedRows.filter((r) => r.isValid && !r.isExisting).length;
  const updateCount = parsedRows.filter((r) => r.isValid && r.isExisting).length;
  const errorCount = parsedRows.filter((r) => !r.isValid).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl text-slate-200 text-xs overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-4 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-xl text-emerald-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-white text-base">Bulk Import TSNP/CDACC Units (CSV)</h3>
              <p className="text-slate-400 text-xs">
                Import syllabus competency units with categories, qualification levels, fees, and trainer routing in batch.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Quick Step Guide & Download Template Banner */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-inner">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-white font-semibold">
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Standardized TSNP/CDACC CSV Format</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed max-w-xl">
                Columns supported: <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">UnitCode</code>,{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">UnitTitle</code>,{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">Category</code> (Core/Common/Basic),{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">CourseCode</code>,{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">Level</code>,{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">AmountCharged</code> (KES),{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">TrainerStaffNo</code>,{' '}
                <code className="text-emerald-400 bg-slate-900 px-1 py-0.5 rounded border border-slate-800">Status</code>.
              </p>
            </div>

            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center justify-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-700/60 font-semibold rounded-xl text-xs transition shadow-xs whitespace-nowrap shrink-0"
              title="Download pre-formatted CSV template with sample CDACC units"
            >
              <Download className="w-4 h-4 text-emerald-400" /> Download Unit Template CSV
            </button>
          </div>

          {/* Upload Area / Dropzone */}
          {!file && (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
                isDragging
                  ? 'border-emerald-500 bg-emerald-950/20'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40 hover:bg-slate-950/60'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".csv,text/csv"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleFileChange(f);
                }}
              />
              <div className="w-12 h-12 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 shadow-md">
                <Upload className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-white text-sm">
                  Click to select CSV file, or drag and drop here
                </p>
                <p className="text-slate-400 text-xs">
                  Upload .csv containing your curriculum units. Auto-detects headers and maps courses/trainers automatically.
                </p>
              </div>
            </div>
          )}

          {errorMsg && (
            <div className="p-3.5 bg-rose-950/50 border border-rose-800/60 rounded-xl text-rose-300 flex items-center gap-2.5 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* File Selected & Parsed Preview */}
          {file && (
            <div className="space-y-3">
              {/* Summary Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 border border-slate-800 p-3 rounded-xl">
                <div className="flex items-center gap-2 min-w-0">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono font-medium text-white truncate">{file.name}</span>
                  <span className="text-slate-500 text-[11px]">({(file.size / 1024).toFixed(1)} KB)</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-1 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-400 font-semibold font-mono text-[11px]">
                    ✓ {validCount} Valid
                  </span>
                  {newCount > 0 && (
                    <span className="px-2 py-1 bg-cyan-950/80 border border-cyan-800/60 rounded-lg text-cyan-400 font-semibold font-mono text-[11px]">
                      + {newCount} New
                    </span>
                  )}
                  {updateCount > 0 && (
                    <span className="px-2 py-1 bg-amber-950/80 border border-amber-800/60 rounded-lg text-amber-400 font-semibold font-mono text-[11px]">
                      ↻ {updateCount} Update
                    </span>
                  )}
                  {errorCount > 0 && (
                    <span className="px-2 py-1 bg-rose-950/80 border border-rose-800/60 rounded-lg text-rose-400 font-semibold font-mono text-[11px]">
                      ⚠ {errorCount} Invalid
                    </span>
                  )}

                  <button
                    onClick={() => {
                      setFile(null);
                      setParsedRows([]);
                      setErrorMsg('');
                    }}
                    className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition text-[11px] font-medium"
                  >
                    Change File
                  </button>
                </div>
              </div>

              {/* Import Options */}
              <div className="flex items-center justify-between bg-slate-950/60 border border-slate-800/80 px-3.5 py-2.5 rounded-xl">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={updateExisting}
                    onChange={(e) => setUpdateExisting(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 bg-slate-900 border-slate-700 focus:ring-emerald-500"
                  />
                  <span>
                    Update / overwrite existing unit records if Unit Code already exists in the catalog ({updateCount} units)
                  </span>
                </label>
              </div>

              {/* Parsed Rows Preview Table */}
              <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-md">
                <div className="px-4 py-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs font-semibold text-slate-300">
                  <span>Parsed Units Preview ({parsedRows.length} total rows)</span>
                  <span className="text-[11px] text-slate-400 font-normal">Review before confirming batch import</span>
                </div>

                <div className="overflow-x-auto max-h-72">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-900 text-slate-400 font-mono text-[11px] sticky top-0 border-b border-slate-800 z-10">
                      <tr>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3">Unit Code</th>
                        <th className="py-2.5 px-3">Unit Title</th>
                        <th className="py-2.5 px-3">Category</th>
                        <th className="py-2.5 px-3">Course & Level</th>
                        <th className="py-2.5 px-3 text-right">Fee (KES)</th>
                        <th className="py-2.5 px-3">Assigned Trainer</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-xs font-sans">
                      {parsedRows.map((row, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-900/40 transition ${
                            !row.isValid ? 'bg-rose-950/20' : row.isExisting ? 'bg-amber-950/10' : ''
                          }`}
                        >
                          <td className="py-2 px-3 whitespace-nowrap">
                            {!row.isValid ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-950 text-rose-400 border border-rose-800 flex items-center gap-1 w-fit">
                                <AlertTriangle className="w-3 h-3" /> Invalid
                              </span>
                            ) : row.isExisting ? (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-950 text-amber-300 border border-amber-800 flex items-center gap-1 w-fit">
                                <RefreshCw className="w-3 h-3" /> Update
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center gap-1 w-fit">
                                <Check className="w-3 h-3" /> New
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-mono font-semibold text-white whitespace-nowrap">
                            {row.unit.unitCode || <span className="text-rose-400 italic">Empty</span>}
                          </td>
                          <td className="py-2 px-3 text-slate-200 min-w-[200px]">
                            <div>{row.unit.unitName || <span className="text-rose-400 italic">Empty</span>}</div>
                            {row.errors.length > 0 && (
                              <div className="text-[10px] text-rose-400">{row.errors.join(', ')}</div>
                            )}
                          </td>
                          <td className="py-2 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                row.unit.category === 'Core'
                                  ? 'bg-blue-950 text-blue-400 border border-blue-800'
                                  : row.unit.category === 'Common'
                                  ? 'bg-purple-950 text-purple-400 border border-purple-800'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              {row.unit.category}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                            <div className="font-medium text-slate-200">{row.matchedCourseName || 'Default Course'}</div>
                            <div className="text-[11px] text-slate-400">{row.matchedLevelName || 'Default Level'}</div>
                          </td>
                          <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400 whitespace-nowrap">
                            KES {row.unit.amountCharged.toLocaleString()}
                          </td>
                          <td className="py-2 px-3 text-slate-400 whitespace-nowrap text-[11px]">
                            {row.matchedTrainerName || 'Unassigned'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-5 py-4 bg-slate-900/90">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold text-xs border border-slate-700 transition"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {file && (
              <button
                type="button"
                onClick={() => {
                  setFile(null);
                  setParsedRows([]);
                  setErrorMsg('');
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl text-xs transition"
              >
                Reset
              </button>
            )}

            <button
              type="button"
              disabled={!file || validCount === 0 || isProcessing}
              onClick={handleImportSubmit}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-600 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" /> Importing Units...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirm & Import {validCount > 0 ? `${validCount} Units` : ''}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
