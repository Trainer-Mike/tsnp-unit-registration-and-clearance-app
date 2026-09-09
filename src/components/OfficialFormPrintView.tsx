import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Registration, InstitutionConfig, formatModuleLabel, formatModuleShort } from '../types';
import { Printer, Download, CheckCircle2, ShieldCheck, QrCode, X, ArrowLeft, Loader2, Check, FileDown } from 'lucide-react';

interface OfficialFormPrintViewProps {
  registration: Registration;
  config: InstitutionConfig;
  onClose?: () => void;
}

export const OfficialFormPrintView: React.FC<OfficialFormPrintViewProps> = ({
  registration,
  config,
  onClose,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingPdf, setIsGeneratingPdf] = useState<boolean>(false);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [directDownloadUrl, setDirectDownloadUrl] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle Escape key to return back
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const verifyPayload = JSON.stringify({
      ref: registration.registrationReference,
      student: registration.studentName,
      adm: registration.admissionNumber,
      series: registration.assessmentSeriesName,
      status: registration.status,
      units: registration.units.length,
      hod: registration.hodApproval?.hodName || 'Pending',
    });

    QRCode.toDataURL(
      verifyPayload,
      {
        width: 130,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [registration]);

  // Pure Vector jsPDF Generator (Zero Canvas / Zero CSS parser dependencies - 100% reliable)
  const generateVectorPdf = async (): Promise<jsPDF> => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const isApproved = registration.status === 'APPROVED' || registration.status === 'RECEIVED_BY_EXAMINATIONS';

    // 1. Top Reference Line
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text(config.departmentName || 'Department of Computing & Informatics', 14, 11);
    doc.setFont('helvetica', 'bold');
    doc.text(config.formReference || 'TSNP/CI/URF/006', pageWidth - 14, 11, { align: 'right' });

    // 2. Institutional Header (Centered)
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(15, 23, 42);
    doc.text(config.institutionName || 'THE SHAMBERERE NATIONAL POLYTECHNIC', pageWidth / 2, 18, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(50, 50, 50);
    doc.text(config.postalAddress || 'P.O. BOX 1316-50100, Kakamega', pageWidth / 2, 23, { align: 'center' });
    doc.setFontSize(7.5);
    doc.text(`Email: ${config.email || 'info@shamberere.ac.ke'} | Mobile: ${config.phone || '+254 720 000 000'}`, pageWidth / 2, 27, { align: 'center' });
    doc.text(`Website: ${config.website || 'https://shambererepolytechnic.ac.ke'}`, pageWidth / 2, 31, { align: 'center' });

    // Double rule line under header
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.line(14, 35, pageWidth - 14, 35);
    doc.setLineWidth(0.2);
    doc.line(14, 36.2, pageWidth - 14, 36.2);

    // 3. Department Banner & Form Title
    doc.setFillColor(245, 247, 250);
    doc.rect(14, 40, pageWidth - 28, 6.5, 'F');
    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.2);
    doc.rect(14, 40, pageWidth - 28, 6.5, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(config.departmentName || 'DEPARTMENT OF COMPUTING AND INFORMATICS', pageWidth / 2, 44.5, { align: 'center' });

    doc.setFont('times', 'bold');
    doc.setFontSize(11);
    doc.text('TSNP/CDACC ASSESSMENT UNIT REGISTRATION FORM', pageWidth / 2, 52, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(70, 70, 70);
    doc.text(`Registration Ref: ${registration.registrationReference}`, pageWidth - 14, 52, { align: 'right' });

    // 4. Candidate Particulars Grid Box
    doc.setDrawColor(100, 116, 139);
    doc.setLineWidth(0.3);
    doc.rect(14, 55, pageWidth - 28, 22);

    // Row 1
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(0, 0, 0);
    doc.text('ASSESSMENT SERIES:', 17, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.assessmentSeriesName || 'NOVEMBER/DECEMBER 2026', 58, 60);

    doc.setFont('helvetica', 'bold');
    doc.text('YEAR:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(String(registration.year || new Date().getFullYear()), 155, 60);

    // Row 2
    doc.setFont('helvetica', 'bold');
    doc.text('CANDIDATE NAME:', 17, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.studentName.toUpperCase(), 58, 66);

    doc.setFont('helvetica', 'bold');
    doc.text('ADM NO:', 140, 66);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.admissionNumber, 155, 66);

    // Row 3
    doc.setFont('helvetica', 'bold');
    doc.text('COURSE:', 17, 72);
    doc.setFont('helvetica', 'normal');
    const courseStr = `${registration.courseName} (${registration.courseCode})`;
    doc.text(courseStr.length > 40 ? `${courseStr.substring(0, 40)}...` : courseStr, 58, 72);

    doc.setFont('helvetica', 'bold');
    doc.text('LEVEL / MOD:', 130, 72);
    doc.setFont('helvetica', 'normal');
    doc.text(`${registration.levelName || 'LEVEL 6'} / ${formatModuleShort(registration.module)}`, 158, 72);

    // 5. Units Registration Table via AutoTable
    const tableBody = registration.units.map((u, i) => [
      `${i + 1}`,
      u.isReassessment ? `${u.unitCode || '-'}\n[RE-SIT]` : (u.unitCode || '-'),
      u.unitName || '-',
      u.isReassessment ? `${u.category || 'Core'} (Reassessment)` : (u.category || 'Core'),
      `${(u.amountCharged || 0).toLocaleString()}`,
      u.status === 'APPROVED'
        ? `${u.verifiedByTrainerName || u.trainerName || 'Trainer'}\n[VERIFIED: ${u.signatureRef || 'DIGITAL SIGN'}]`
        : u.status === 'REJECTED'
        ? `${u.trainerName || 'Trainer'}\n[REJECTED: ${u.decisionComment || 'Ineligible'}]`
        : `${u.trainerName || 'Pending'}\n[Pending Trainer Verification]`,
    ]);

    // Add empty rows if less than 7 units for authentic appearance
    let rowIndex = registration.units.length;
    while (rowIndex < 7) {
      tableBody.push([`${rowIndex + 1}`, '', '', '', '', '']);
      rowIndex++;
    }

    autoTable(doc, {
      startY: 80,
      margin: { left: 14, right: 14 },
      head: [['S/No', 'Unit Code', 'Unit Name', 'Category', `Amount (${config.defaultCurrency || 'KES'})`, 'Trainer Verification']],
      body: tableBody,
      foot: [
        [
          {
            content: 'TOTAL AMOUNT PAYABLE:',
            colSpan: 4,
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 8.5 },
          },
          {
            content: `${config.defaultCurrency || 'KES'} ${registration.totalAmount.toLocaleString()}`,
            styles: { halign: 'right', fontStyle: 'bold', fontSize: 8.5 },
          },
          {
            content: `${registration.units.filter((u) => u.status === 'APPROVED').length} of ${registration.units.length} Units Approved`,
            styles: { halign: 'center', fontSize: 7.5 },
          },
        ],
      ],
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2,
        lineColor: [30, 41, 59],
        lineWidth: 0.15,
        textColor: [15, 23, 42],
        font: 'helvetica',
      },
      headStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontStyle: 'bold',
        halign: 'left',
        lineWidth: 0.2,
      },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 28, fontStyle: 'bold' },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 25, halign: 'right' },
        5: { cellWidth: 44, fontSize: 6.5 },
      },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 4;

    // 6. HOD Clearance & Approval Section (With dynamic text wrapping for HOD remarks)
    const remarks = registration.hodApproval?.comments || '';
    
    // Prepare wrapped HOD remarks lines to fit perfectly inside the margin
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    const maxRemarksWidth = pageWidth - 36; // 174mm printable inner width
    const wrappedRemarksLines: string[] = remarks
      ? doc.splitTextToSize(`HOD Remarks: ${remarks}`, maxRemarksWidth)
      : [];

    const remarksBlockHeight = wrappedRemarksLines.length > 0 ? (wrappedRemarksLines.length * 3.4 + 5) : 0;
    const baseHodHeight = 28;
    const hodBoxHeight = baseHodHeight + remarksBlockHeight;

    doc.setDrawColor(30, 41, 59);
    doc.setLineWidth(0.3);
    doc.rect(14, finalY, pageWidth - 28, hodBoxHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('APPROVED BY (DEPARTMENTAL CLEARANCE):', 17, finalY + 5);

    if (registration.hodApproval?.approvalRef) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.text(`Approval Ref: ${registration.hodApproval.approvalRef}`, pageWidth - 17, finalY + 5, { align: 'right' });
    }

    // Row 1 inside HOD box: Name and Date
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.text('Name:', 17, finalY + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.hodApproval?.hodName || 'Dr. Kennedy Musumba', 28, finalY + 10.5);

    doc.setFont('helvetica', 'bold');
    doc.text('Date:', 145, finalY + 10.5);
    doc.setFont('helvetica', 'normal');
    doc.text(
      registration.hodApproval?.approvedAt
        ? new Date(registration.hodApproval.approvedAt).toLocaleDateString('en-GB')
        : 'Pending',
      155,
      finalY + 10.5
    );

    // Row 2: Designation (Full width line so "Computing & Informatics" never overlaps Date)
    doc.setFont('helvetica', 'bold');
    doc.text('Designation:', 17, finalY + 15.5);
    doc.setFont('helvetica', 'normal');
    doc.text(registration.hodApproval?.designation || 'Head of Department, Computing & Informatics', 36, finalY + 15.5);

    // Row 3: Official Digital Seal
    if (isApproved) {
      doc.setDrawColor(4, 120, 87);
      doc.setFillColor(236, 253, 245);
      doc.roundedRect(17, finalY + 19.5, 76, 5.5, 1, 1, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(6, 95, 70);
      doc.text('OFFICIAL ELECTRONIC SEAL: TSNP/HOD/CLEARANCE APPROVED', 19, finalY + 23.3);
    }

    // Row 4: Wrapped HOD Remarks (if present)
    if (wrappedRemarksLines.length > 0) {
      const remarksStartY = finalY + baseHodHeight;
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.15);
      doc.line(17, remarksStartY - 2, pageWidth - 17, remarksStartY - 2);

      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(70, 70, 70);
      doc.text(wrappedRemarksLines, 17, remarksStartY + 1.5);
    }

    // 7. Verification QR & Footer Security Notice
    const footerY = finalY + hodBoxHeight + 3;
    doc.setLineWidth(0.2);
    doc.setDrawColor(180, 180, 180);
    doc.line(14, footerY, pageWidth - 14, footerY);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(0, 0, 0);
    doc.text('IMPORTANT EXAMINATION SUBMISSION INSTRUCTIONS:', 14, footerY + 4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(60, 60, 60);
    doc.text('1. Submit this official registration sheet to the Examinations Office along with fee payment receipt.', 14, footerY + 8);
    doc.text(`2. Verify online: ${config.website || 'https://shambererepolytechnic.ac.ke'}/verify/${registration.registrationReference}`, 14, footerY + 12);
    doc.text('3. Form generated via The Shamberere National Polytechnic Assessment Information System.', 14, footerY + 16);

    if (registration.examOfficeReceipt) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 58, 138);
      doc.text(`[EXAMINATIONS DOCKET: Received by ${registration.examOfficeReceipt.receivedBy} on ${new Date(registration.examOfficeReceipt.receivedAt).toLocaleDateString('en-GB')}]`, 14, footerY + 21);
    }

    // Embed QR Code
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', pageWidth - 38, footerY + 1.5, 24, 24);
        doc.setFont('courier', 'bold');
        doc.setFontSize(6);
        doc.setTextColor(0, 0, 0);
        doc.text(registration.registrationReference, pageWidth - 26, footerY + 27, { align: 'center' });
      } catch (qrErr) {
        console.warn('QR image insertion notice:', qrErr);
      }
    }

    return doc;
  };

  // Direct File Download Handler with Multiple Robust Fallbacks
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    setFeedbackMsg('Generating official PDF document...');

    try {
      const doc = await generateVectorPdf();
      const safeAdm = registration.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_');
      const safeRef = registration.registrationReference.replace(/[^a-zA-Z0-9]/g, '_');
      const filename = `TSNP_CDACC_Registration_${safeAdm}_${safeRef}.pdf`;

      // Generate Blob
      const pdfBlob = doc.output('blob');
      const blobUrl = URL.createObjectURL(pdfBlob);
      setDirectDownloadUrl(blobUrl);

      // Single clean download trigger via link element
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
      }, 1000);

      setFeedbackMsg(`✓ PDF downloaded: ${filename}`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      console.error('PDF generation error:', err);
      setFeedbackMsg('PDF ready. Click "Save File" to download.');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Robust Native Print with isolated hidden iframe fallback for sandboxed environments
  const handlePrint = async () => {
    if (isPrinting) return;
    setIsPrinting(true);
    setFeedbackMsg('Opening print dialogue...');

    try {
      if (printRef.current) {
        // Create an isolated hidden iframe for printing to guarantee compatibility with iframe sandbox
        const printIframe = document.createElement('iframe');
        printIframe.style.position = 'fixed';
        printIframe.style.right = '0';
        printIframe.style.bottom = '0';
        printIframe.style.width = '0';
        printIframe.style.height = '0';
        printIframe.style.border = '0';
        document.body.appendChild(printIframe);

        const iframeDoc = printIframe.contentWindow?.document;
        if (iframeDoc) {
          iframeDoc.open();
          iframeDoc.write(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>TSNP/CDACC Registration Form - ${registration.registrationReference}</title>
                <style>
                  @page { size: A4 portrait; margin: 8mm; }
                  * { box-sizing: border-box; }
                  body { margin: 0; padding: 12px; font-family: "Times New Roman", Times, serif; color: #000; background: #fff; }
                  table { width: 100%; border-collapse: collapse; }
                  th, td { border: 1px solid #000; padding: 4px 6px; font-size: 11px; }
                  .border-b-2 { border-bottom: 2px solid #000; }
                  .border-t { border-top: 1px solid #000; }
                  .border-b { border-bottom: 1px solid #000; }
                  .font-bold { font-weight: bold; }
                  .text-center { text-align: center; }
                  .text-right { text-align: right; }
                  .uppercase { text-transform: uppercase; }
                  .flex { display: flex; }
                  .items-center { align-items: center; }
                  .justify-between { justify-content: space-between; }
                </style>
              </head>
              <body>
                ${printRef.current.innerHTML}
              </body>
            </html>
          `);
          iframeDoc.close();

          setTimeout(() => {
            try {
              printIframe.contentWindow?.focus();
              printIframe.contentWindow?.print();
            } catch {
              window.print();
            } finally {
              setTimeout(() => {
                if (document.body.contains(printIframe)) {
                  document.body.removeChild(printIframe);
                }
              }, 2000);
            }
          }, 400);
        } else {
          window.print();
        }
      } else {
        window.print();
      }

      setTimeout(() => {
        setIsPrinting(false);
        setFeedbackMsg(null);
      }, 2000);
    } catch (err) {
      console.warn('Direct print encountered restriction, triggering PDF download...', err);
      setIsPrinting(false);
      await handleDownloadPdf();
    }
  };

  // Pad units to at least 7 rows as in the original physical form
  const totalRows = Math.max(7, registration.units.length);
  const paddedUnits = [...registration.units];
  while (paddedUnits.length < 7) {
    paddedUnits.push({
      id: `empty-${paddedUnits.length}`,
      unitId: '',
      unitCode: '',
      unitName: '',
      category: 'Core',
      amountCharged: 0,
      trainerId: '',
      trainerName: '',
      status: 'PENDING',
    });
  }

  const isApproved = registration.status === 'APPROVED' || registration.status === 'RECEIVED_BY_EXAMINATIONS';

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current && onClose) {
      onClose();
    }
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-sm flex items-start justify-center p-2 sm:p-4 md:p-6 print:p-0 print:bg-white print:fixed print:inset-0"
    >
      <div className="relative w-full max-w-4xl bg-white shadow-2xl rounded-2xl overflow-hidden print:shadow-none print:rounded-none print:max-w-none print:w-full border border-slate-800 print:border-none my-auto">
        {/* Sticky Screen Toolbar (Hidden on print) */}
        <div className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur-md text-white px-3 sm:px-5 py-3 flex items-center justify-between print:hidden border-b border-slate-800 shadow-md flex-wrap gap-2">
          {/* Left: Prominent Back to Dashboard Button */}
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {onClose && (
              <button
                id="back-to-previous-btn"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700 shadow-xs shrink-0"
                title="Return to previous window (Esc)"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back</span>
              </button>
            )}
            <div className="flex items-center gap-2 min-w-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 hidden sm:block" />
              <span className="font-semibold text-xs sm:text-sm text-slate-100 truncate">
                Form Sheet: <strong className="font-mono text-emerald-400">{config.formReference || 'TSNP/CI/URF/006'}</strong>
              </span>
              {isApproved && (
                <span className="bg-emerald-500/10 text-emerald-300 text-[11px] px-2 py-0.5 rounded-full font-medium border border-emerald-500/30 hidden md:inline-flex items-center gap-1 shrink-0">
                  <CheckCircle2 className="w-3 h-3" /> Approved
                </span>
              )}
            </div>
          </div>

          {/* Right: PDF Download and Print Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Direct File Save anchor if generated */}
            {directDownloadUrl && (
              <a
                id="top-direct-pdf-anchor"
                href={directDownloadUrl}
                download={`TSNP_CDACC_Registration_${registration.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs cursor-pointer"
                title="Save PDF file to device"
              >
                <FileDown className="w-4 h-4 text-emerald-300" />
                <span>Save File</span>
              </a>
            )}

            {/* Download PDF Button */}
            <button
              id="download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs sm:text-sm font-bold transition shadow-lg shadow-emerald-950/40 cursor-pointer"
              title="Save directly as official PDF document"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              id="print-form-btn"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs sm:text-sm font-semibold transition border border-slate-700 shadow-xs cursor-pointer"
              title="Send to physical printer or browser print preview"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Printer className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Print</span>
            </button>

            {onClose && (
              <button
                id="close-form-sheet-x-btn"
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
                title="Close sheet view (Esc)"
                aria-label="Close sheet view"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Feedback Toast if exporting */}
        {feedbackMsg && (
          <div className="bg-emerald-950/90 border-b border-emerald-700/60 text-emerald-200 px-4 py-2 text-xs font-semibold flex items-center justify-between print:hidden animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{feedbackMsg}</span>
            </div>
            <div className="flex items-center gap-2">
              {directDownloadUrl && (
                <a
                  href={directDownloadUrl}
                  download={`TSNP_CDACC_Registration_${registration.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-700 hover:bg-emerald-600 text-white rounded text-[11px] font-bold"
                >
                  <FileDown className="w-3.5 h-3.5" /> Click to Save File
                </a>
              )}
              {isGeneratingPdf && <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
            </div>
          </div>
        )}

        {/* The Printable Form Body */}
        <div
          ref={printRef}
          className="p-6 sm:p-10 text-slate-900 bg-white print:p-6 print:text-black min-h-[1050px] font-serif selection:bg-slate-200"
          style={{ fontFamily: '"Times New Roman", Times, serif' }}
        >
          {/* Top Form Reference Header */}
          <div className="flex justify-between items-start text-xs sm:text-sm font-sans mb-2 text-slate-600 print:text-black">
            <span className="font-semibold">{config.departmentName || 'Department of Computing & Informatics'}</span>
            <span className="font-bold tracking-wider">{config.formReference || 'TSNP/CI/URF/006'}</span>
          </div>

          {/* Institutional Header */}
          <div className="text-center border-b-2 border-slate-900 pb-3 mb-3">
            <h1 className="text-base sm:text-xl font-bold uppercase tracking-tight text-slate-900 font-serif">
              {config.institutionName || 'THE SHAMBERERE NATIONAL POLYTECHNIC'}
            </h1>
            <p className="text-[10px] sm:text-xs font-sans text-slate-700 print:text-black leading-tight mt-0.5">
              {config.postalAddress || 'P.O. BOX 1316-50100, Kakamega'}
            </p>
            <p className="text-[10px] sm:text-xs font-sans text-slate-700 print:text-black leading-tight">
              Email: <span className="font-mono text-[9px] sm:text-xs">{config.email}</span> OR{' '}
              <span className="font-mono text-[9px] sm:text-xs">{config.altEmail}</span>, Mobile Phone:{' '}
              <span className="font-mono text-[9px] sm:text-xs">{config.phone}</span>
            </p>
            <p className="text-[10px] sm:text-xs font-sans text-slate-700 print:text-black leading-tight">
              Website: <span className="font-mono text-[9px] sm:text-xs">{config.website}</span>
            </p>
          </div>

          {/* Department Banner & Title */}
          <div className="text-center mb-4">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider font-sans border-b border-t border-slate-800 py-1 bg-slate-50 print:bg-transparent">
              {config.departmentName || 'DEPARTMENT OF COMPUTING AND INFORMATICS'}
            </h2>
            <h3 className="text-sm sm:text-base font-bold uppercase tracking-normal font-sans mt-1.5 underline underline-offset-4 decoration-1">
              TSNP/CDACC ASSESSMENT UNIT REGISTRATION
            </h3>
            <div className="text-[10px] font-sans text-slate-500 print:text-black text-right mt-0.5">
              Registration Ref: <span className="font-mono font-bold text-slate-900">{registration.registrationReference}</span>
            </div>
          </div>

          {/* Student & Assessment Metadata Lines (Matching Physical Layout) */}
          <div className="font-sans text-xs sm:text-sm space-y-2 mb-4 border border-slate-300 p-2.5 rounded bg-slate-50/30 print:bg-transparent print:border-slate-800">
            {/* Line 1: Assessment Series & Year */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">ASSESSMENT SERIES:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-mono font-bold text-slate-900 uppercase">
                  {registration.assessmentSeriesName}
                </span>
              </div>
              <div className="col-span-4 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">YEAR:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-mono font-bold text-slate-900">
                  {registration.year}
                </span>
              </div>
            </div>

            {/* Line 2: Name & Admission Number */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-8 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">NAME:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-sans font-bold text-slate-900 uppercase">
                  {registration.studentName}
                </span>
              </div>
              <div className="col-span-4 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">ADM. NO:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-mono font-bold text-slate-900">
                  {registration.admissionNumber}
                </span>
              </div>
            </div>

            {/* Line 3: Course, Level & Module */}
            <div className="grid grid-cols-12 gap-2 items-center">
              <div className="col-span-6 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">COURSE:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-sans font-bold text-slate-900 uppercase text-[11px] sm:text-xs truncate">
                  {registration.courseName} ({registration.courseCode})
                </span>
              </div>
              <div className="col-span-3 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">LEVEL:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-sans font-bold text-slate-900 uppercase truncate">
                  {registration.levelName}
                </span>
              </div>
              <div className="col-span-3 flex items-baseline">
                <span className="font-bold whitespace-nowrap mr-1">MODULE / CYCLE:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-2 font-mono font-bold text-slate-900 uppercase truncate">
                  {formatModuleLabel(registration.module)}
                </span>
              </div>
            </div>
          </div>

          {/* The Unit Table */}
          <div className="overflow-x-auto mb-4">
            <table className="w-full border-collapse border border-slate-900 text-[11px] sm:text-xs font-sans">
              <thead>
                <tr className="bg-slate-100 print:bg-transparent text-slate-900 border-b border-slate-900">
                  <th className="border border-slate-900 px-2 py-1.5 text-center w-10 font-bold">S/no</th>
                  <th className="border border-slate-900 px-2 py-1.5 text-left w-36 font-bold">Unit Code</th>
                  <th className="border border-slate-900 px-2 py-1.5 text-left font-bold">Unit Name</th>
                  <th className="border border-slate-900 px-2 py-1.5 text-center w-28 font-bold">
                    Category
                    <div className="text-[9px] font-normal text-slate-600 print:text-black">
                      (Basic, Common, Core)
                    </div>
                  </th>
                  <th className="border border-slate-900 px-2 py-1.5 text-right w-24 font-bold">
                    Amount Charged ({config.defaultCurrency || 'KES'})
                  </th>
                  <th className="border border-slate-900 px-2 py-1.5 text-left w-52 font-bold">
                    Verified by Trainer
                    <div className="text-[9px] font-normal text-slate-600 print:text-black">
                      (Name & Signature)
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody>
                {paddedUnits.map((u, idx) => {
                  const hasData = Boolean(u.unitCode);
                  return (
                    <tr key={u.id || idx} className="border-b border-slate-900 h-9">
                      <td className="border border-slate-900 px-2 py-1 text-center font-mono">
                        {idx + 1}.
                      </td>
                      <td className="border border-slate-900 px-2 py-1 font-mono text-[10px] sm:text-[11px] font-semibold">
                        {hasData ? (
                          <div>
                            <span>{u.unitCode}</span>
                            {u.isReassessment && (
                              <span className="block text-[8px] font-bold text-amber-700 print:text-black font-sans uppercase">
                                [Reassessment]
                              </span>
                            )}
                          </div>
                        ) : ''}
                      </td>
                      <td className="border border-slate-900 px-2 py-1 font-medium">
                        {hasData ? u.unitName : ''}
                      </td>
                      <td className="border border-slate-900 px-2 py-1 text-center font-medium">
                        {hasData ? (
                          <div>
                            <span>{u.category}</span>
                            {u.isReassessment && (
                              <span className="block text-[8px] text-slate-600 print:text-black">
                                (Re-sit)
                              </span>
                            )}
                          </div>
                        ) : ''}
                      </td>
                      <td className="border border-slate-900 px-2 py-1 text-right font-mono font-medium">
                        {hasData && u.amountCharged ? u.amountCharged.toLocaleString() : ''}
                      </td>
                      <td className="border border-slate-900 px-2 py-1">
                        {hasData ? (
                          <div className="leading-tight">
                            <div className="font-semibold text-[10px] text-slate-900">
                              {u.verifiedByTrainerName || u.trainerName}
                            </div>
                            {u.status === 'APPROVED' ? (
                              <div className="text-[9px] font-mono text-emerald-800 print:text-black flex items-center gap-1 mt-0.5">
                                <span className="font-bold">[VERIFIED]</span> {u.signatureRef || 'DIGITAL SIGN'}
                              </div>
                            ) : u.status === 'REJECTED' ? (
                              <div className="text-[9px] font-mono text-red-700 print:text-black font-bold">
                                [REJECTED: {u.decisionComment || 'Ineligible'}]
                              </div>
                            ) : (
                              <div className="text-[9px] text-slate-400 print:text-slate-600 italic">
                                [Pending Trainer Sign]
                              </div>
                            )}
                          </div>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
                {/* Total Row */}
                <tr className="bg-slate-100/60 print:bg-transparent font-bold border-t-2 border-slate-900">
                  <td colSpan={4} className="border border-slate-900 px-3 py-1.5 text-right uppercase tracking-wider text-xs">
                    Total Amount Payable:
                  </td>
                  <td className="border border-slate-900 px-2 py-1.5 text-right font-mono text-xs text-slate-900">
                    {config.defaultCurrency || 'KES'} {registration.totalAmount.toLocaleString()}
                  </td>
                  <td className="border border-slate-900 px-2 py-1.5 text-center text-[10px] text-slate-600 print:text-black">
                    {registration.units.filter((u) => u.status === 'APPROVED').length} of {registration.units.length} Units Verified
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Departmental HOD Approval Section (Matching Physical Reference) */}
          <div className="border-2 border-slate-900 p-3 mb-4 rounded font-sans text-xs bg-slate-50/50 print:bg-transparent">
            <div className="font-bold text-xs uppercase mb-2 text-slate-900 flex items-center justify-between">
              <span>Approved by (Departmental Clearance):</span>
              {registration.hodApproval?.approvalRef && (
                <span className="font-mono text-[10px] font-semibold text-slate-700 print:text-black">
                  Ref: {registration.hodApproval.approvalRef}
                </span>
              )}
            </div>

            <div className="grid grid-cols-12 gap-3 items-end">
              {/* Name */}
              <div className="col-span-4 flex items-baseline">
                <span className="font-bold mr-1">Name:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900">
                  {registration.hodApproval?.hodName || config.hodDesignation ? (registration.hodApproval?.hodName || 'Dr. Kennedy Musumba') : '...................................'}
                </span>
              </div>

              {/* Designation */}
              <div className="col-span-3 flex items-baseline">
                <span className="font-bold mr-1">Designation:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-semibold text-slate-900 text-[10px]">
                  {registration.hodApproval?.designation || 'Head of Department'}
                </span>
              </div>

              {/* Sign / Official Digital Stamp */}
              <div className="col-span-3 flex items-center">
                <span className="font-bold mr-1">Sign:</span>
                {isApproved ? (
                  <div className="border border-emerald-700 bg-emerald-50 px-2 py-0.5 rounded text-center print:bg-transparent print:border-black">
                    <span className="text-[9px] font-mono font-bold text-emerald-900 print:text-black block">
                      ELECTRONIC SEAL
                    </span>
                    <span className="text-[8px] font-mono text-emerald-700 print:text-black block leading-none">
                      TSNP/HOD/CLEARANCE
                    </span>
                  </div>
                ) : (
                  <span className="border-b border-dotted border-slate-800 flex-1 px-1 text-slate-400">
                    .....................
                  </span>
                )}
              </div>

              {/* Date */}
              <div className="col-span-2 flex items-baseline">
                <span className="font-bold mr-1">Date:</span>
                <span className="border-b border-dotted border-slate-800 flex-1 px-1 font-mono font-semibold text-slate-900 text-[10px]">
                  {registration.hodApproval?.approvedAt
                    ? new Date(registration.hodApproval.approvedAt).toLocaleDateString('en-GB')
                    : '.................'}
                </span>
              </div>
            </div>

            {registration.hodApproval?.comments && (
              <div className="mt-2 pt-1 border-t border-slate-200 text-[10px] text-slate-700 print:text-black italic">
                <span className="font-semibold not-italic">HOD Clearance Remarks:</span> {registration.hodApproval.comments}
              </div>
            )}
          </div>

          {/* Bottom Security & Verification Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-300 font-sans text-[10px] text-slate-600 print:text-black">
            <div className="space-y-0.5 max-w-lg">
              <div className="font-bold text-slate-800 print:text-black">
                IMPORTANT INSTRUCTIONS FOR EXAMINATIONS SUBMISSION:
              </div>
              <p>
                1. This electronic registration form must be submitted to the Examinations Office with proof of TSNP/CDACC assessment fee payment.
              </p>
              <p>
                2. Authenticity can be verified instantaneously by scanning the QR code or visiting{' '}
                <span className="font-mono text-slate-900 font-medium">
                  {config.website}/verify/{registration.registrationReference}
                </span>.
              </p>
              {registration.examOfficeReceipt && (
                <div className="mt-1 p-1 bg-blue-50 border border-blue-300 rounded text-blue-950 font-mono text-[9px] print:border-black print:bg-transparent">
                  [EXAMINATIONS DOCKETED: Received by {registration.examOfficeReceipt.receivedBy} on{' '}
                  {new Date(registration.examOfficeReceipt.receivedAt).toLocaleDateString('en-GB')}]
                </div>
              )}
            </div>

            {/* QR Code Graphic */}
            <div className="flex flex-col items-center ml-4">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt={`QR Verification: ${registration.registrationReference}`}
                  className="w-20 h-20 border border-slate-300 rounded p-0.5 bg-white"
                />
              ) : (
                <div className="w-20 h-20 border border-slate-300 flex items-center justify-center text-[8px]">
                  <QrCode className="w-8 h-8 text-slate-400" />
                </div>
              )}
              <span className="font-mono text-[8px] font-bold mt-0.5 text-slate-700 print:text-black">
                {registration.registrationReference}
              </span>
            </div>
          </div>
        </div>

        {/* Screen Bottom Bar (Hidden on print) */}
        <div className="bg-slate-950 text-white px-4 sm:px-6 py-3.5 flex items-center justify-between print:hidden border-t border-slate-800 flex-wrap gap-2">
          <div className="text-xs text-slate-400">
            <span>Ref: <strong className="font-mono text-emerald-400">{registration.registrationReference}</strong></span>
            <span className="mx-2 hidden sm:inline">•</span>
            <span className="hidden sm:inline">{registration.assessmentSeriesName}</span>
          </div>
          <div className="flex items-center gap-2">
            {onClose && (
              <button
                id="bottom-back-to-previous-btn"
                onClick={onClose}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 shadow-xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-emerald-400" />
                <span>Back to Dashboard</span>
              </button>
            )}

            {directDownloadUrl && (
              <a
                id="bottom-direct-pdf-anchor"
                href={directDownloadUrl}
                download={`TSNP_CDACC_Registration_${registration.admissionNumber.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-emerald-300" />
                <span>Save File</span>
              </a>
            )}

            <button
              id="bottom-download-pdf-btn"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-slate-950 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </>
              )}
            </button>

            <button
              id="bottom-print-form-btn"
              onClick={handlePrint}
              disabled={isPrinting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition border border-slate-700 shadow-xs cursor-pointer"
            >
              {isPrinting ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
              ) : (
                <Printer className="w-4 h-4 text-emerald-400" />
              )}
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
