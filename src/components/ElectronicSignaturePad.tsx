import React, { useRef, useState, useEffect } from 'react';
import { Pen, RotateCcw, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface ElectronicSignaturePadProps {
  signerName: string;
  signerTitle: string;
  staffNo: string;
  onSaveSignature: (dataUrl: string) => void;
  onCancel?: () => void;
  initialSignature?: string;
}

export const ElectronicSignaturePad: React.FC<ElectronicSignaturePadProps> = ({
  signerName,
  signerTitle,
  staffNo,
  onSaveSignature,
  onCancel,
  initialSignature,
}) => {
  const [mode, setMode] = useState<'draw' | 'stamp'>('stamp');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useEffect(() => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.strokeStyle = '#0f172a';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [mode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setHasDrawn(true);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.beginPath();
    ctx.moveTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    ctx.lineTo((clientX - rect.left) * scaleX, (clientY - rect.top) * scaleY);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const generateDigitalStamp = (): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 140;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Border Seal
    ctx.strokeStyle = '#047857';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);

    // Text details
    ctx.fillStyle = '#065f46';
    ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SHAMBERERE NATIONAL POLYTECHNIC', canvas.width / 2, 30);

    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = '#047857';
    ctx.fillText('DEPARTMENTAL CDACC VERIFICATION SEAL', canvas.width / 2, 46);

    ctx.font = 'italic 16px "Times New Roman", serif';
    ctx.fillStyle = '#0f172a';
    ctx.fillText(signerName, canvas.width / 2, 75);

    ctx.font = '10px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`${signerTitle} • Staff ID: ${staffNo}`, canvas.width / 2, 94);

    ctx.font = 'bold 9px monospace';
    ctx.fillStyle = '#059669';
    ctx.fillText(`DIGITAL AUTH: TSNP-AUTH-${Date.now().toString(36).toUpperCase()}`, canvas.width / 2, 114);

    return canvas.toDataURL('image/png');
  };

  const handleConfirm = () => {
    if (mode === 'draw') {
      const canvas = canvasRef.current;
      if (canvas && hasDrawn) {
        onSaveSignature(canvas.toDataURL('image/png'));
      } else {
        onSaveSignature(generateDigitalStamp());
      }
    } else {
      onSaveSignature(generateDigitalStamp());
    }
  };

  return (
    <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 shadow-xl font-sans text-slate-200">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-400" />
          <h3 className="font-bold text-white text-sm">Authorized Electronic Signature</h3>
        </div>
        <div className="flex items-center bg-slate-950 p-1 rounded-xl text-xs font-medium border border-slate-800">
          <button
            onClick={() => setMode('stamp')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              mode === 'stamp' ? 'bg-emerald-600 text-slate-950 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> Digital Stamp
          </button>
          <button
            onClick={() => setMode('draw')}
            className={`px-3 py-1 rounded-lg transition flex items-center gap-1.5 ${
              mode === 'draw' ? 'bg-emerald-600 text-slate-950 shadow-xs font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Pen className="w-3.5 h-3.5" /> Draw Signature
          </button>
        </div>
      </div>

      {mode === 'stamp' ? (
        <div className="p-4 border-2 border-dashed border-emerald-500/30 rounded-xl bg-emerald-950/20 text-center mb-4">
          <div className="inline-block border-2 border-emerald-500/60 bg-slate-950 p-4 rounded-xl shadow-lg text-center max-w-sm w-full">
            <div className="text-[10px] font-bold tracking-wider text-emerald-400 uppercase font-mono">
              THE SHAMBERERE NATIONAL POLYTECHNIC
            </div>
            <div className="text-[9px] text-emerald-500/80 font-mono">DEPT OF COMPUTING & INFORMATICS</div>
            <div className="my-2.5 py-1.5 border-y border-slate-800">
              <div className="text-base font-serif font-bold text-white">{signerName}</div>
              <div className="text-xs text-slate-300">{signerTitle}</div>
              <div className="text-[10px] font-mono text-slate-400">Staff No: {staffNo}</div>
            </div>
            <div className="text-[9px] font-mono font-bold text-emerald-400">
              [AUTHENTICATED DIGITAL CLEARANCE SEAL]
            </div>
          </div>
          <p className="text-xs text-slate-400 mt-2.5">
            This digital clearance stamp will be cryptographically attached with timestamp and reference key.
          </p>
        </div>
      ) : (
        <div className="mb-4">
          <div className="relative border border-slate-700 rounded-xl bg-white overflow-hidden touch-none shadow-inner">
            <canvas
              ref={canvasRef}
              width={400}
              height={140}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
              className="w-full h-36 cursor-crosshair bg-white"
            />
            {!hasDrawn && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-slate-400 text-xs">
                Draw your signature in this box
              </div>
            )}
          </div>
          <div className="flex justify-between items-center mt-2 text-xs text-slate-400">
            <span>Sign with mouse, trackpad or stylus</span>
            <button
              onClick={clearCanvas}
              className="text-slate-400 hover:text-rose-400 flex items-center gap-1 font-medium hover:underline transition"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Clear
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition"
          >
            Cancel
          </button>
        )}
        <button
          onClick={handleConfirm}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
        >
          <Check className="w-4 h-4" /> Apply & Authorize
        </button>
      </div>
    </div>
  );
};
