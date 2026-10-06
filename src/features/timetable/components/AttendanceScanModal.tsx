import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Camera, AlertTriangle, QrCode, ScanLine, X, Upload, Square, Info, Maximize, Minimize, ZoomIn, ZoomOut } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { scanAttendanceQrAPI } from '@/services/usas/Api';
import { sanitizeSingleLine } from '@/shared/lib/security';

type AttendanceScanModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccessfulScan?: () => void;
};

type ScanState = 'idle' | 'starting' | 'scanning' | 'processing' | 'success' | 'error' | 'unsupported';



const getCopy = (lang: string) => {
  if (lang === 'ms') {
    return {
      title: 'Imbas Kehadiran QR',
      desc: 'Buka kamera dan imbas kod QR kehadiran dari pensyarah.',
      ready: 'Kamera sedia. Halakan ke kod QR kehadiran.',
      starting: 'Membuka kamera...',
      processing: 'Menghantar kod ke server UMC...',
      success: 'Kod QR diterima.',
      error: 'Imbasan gagal.',
      unsupported: 'Pelayar ini tiada sokongan kamera imbas QR automatik. Tampal nilai QR secara manual di bawah.',
      manualLabel: 'Nilai QR manual',
      manualHint: 'Guna jika kamera tiada atau detection gagal.',
      startCamera: 'Mula kamera',
      uploadImg: 'Muat naik imej',
      scanAgain: 'Imbas semula',
      submit: 'Hantar QR',
      close: 'Tutup',
      stop: 'Henti kamera',
      empty: 'Masukkan nilai QR dahulu.',
      qrBotHintTitle: 'Tiada nilai QR?',
    };
  }

  return {
    title: 'Scan Attendance QR',
    desc: 'Open the camera and scan the attendance QR from the lecturer.',
    ready: 'Camera ready. Point it at the attendance QR code.',
    starting: 'Opening camera...',
    processing: 'Sending QR code to the UMC server...',
    success: 'QR code received.',
    error: 'Scan failed.',
    unsupported: 'This browser does not support automatic QR camera scanning. Paste the QR value manually below.',
    manualLabel: 'Manual QR value',
    manualHint: 'Use this if camera access is unavailable or detection fails.',
    startCamera: 'Start camera',
    uploadImg: 'Upload image',
    scanAgain: 'Scan again',
    submit: 'Send QR',
    close: 'Close',
    stop: 'Stop camera',
    empty: 'Paste a QR value first.',
    qrBotHintTitle: 'No QR value?',
  };
};

export default function AttendanceScanModal({ isOpen, onClose, onSuccessfulScan }: AttendanceScanModalProps) {
  const { session, refreshTimetable } = useAuth();
  const { lang } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const copy = getCopy(lang);

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [statusMessage, setStatusMessage] = useState(copy.desc);
  const [manualQr, setManualQr] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [maxZoom, setMaxZoom] = useState(3);
  const [supportsNativeZoom, setSupportsNativeZoom] = useState(false);

  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const processingRef = useRef(false);
  const streamRef = useRef<MediaStream | null>(null);
  const loopRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const zoomRef = useRef(1);
  const nativeZoomRef = useRef<{ min: number; max: number; step?: number } | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCamera();

    try {
      setScanState('processing');
      setStatusMessage(lang === 'en' ? 'Analyzing image...' : 'Menganalisis imej...');

      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = objUrl;
      });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;

      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(objUrl);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      const firstValue = code?.data?.trim();

      if (firstValue) {
        await submitQrValue(firstValue);
      } else {
        setScanState('error');
        setStatusMessage(lang === 'en' ? 'No QR code found in image.' : 'Tiada kod QR ditemui dalam imej.');
      }
    } catch (err) {
      setScanState('error');
      setStatusMessage(lang === 'en' ? 'Failed to read image.' : 'Gagal membaca imej.');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const stopCamera = () => {
    activeRef.current = false;
    processingRef.current = false;

    if (loopRef.current !== null) {
      window.clearTimeout(loopRef.current);
      loopRef.current = null;
    }

    const video = videoRef.current;
    if (video) {
      video.pause();
      video.srcObject = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const scheduleLoop = () => {
    if (!activeRef.current) return;
    loopRef.current = window.setTimeout(() => {
      void scanFrame();
    }, 140);
  };

  const submitQrValue = async (rawValue: string) => {
    setIsFullscreen(false);
    const qrValue = sanitizeSingleLine(rawValue, 2048);
    if (!qrValue) {
      setScanState('error');
      setStatusMessage(copy.empty);
      return;
    }

    stopCamera();
    setScanState('processing');
    setStatusMessage(copy.processing);

    const result = await scanAttendanceQrAPI(session, qrValue);
    if (!mountedRef.current) return;

    if (result.success) {
      const message = sanitizeSingleLine(result.data.alert || result.data.message || copy.success, 240);
      setScanState('success');
      setStatusMessage(message || copy.success);
      await refreshTimetable().catch(() => undefined);
      onSuccessfulScan?.();
      return;
    }

    setScanState('error');
    setStatusMessage('error' in result ? result.error : copy.error);
  };

  const scanFrame = async () => {
    if (!activeRef.current || processingRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) {
      scheduleLoop();
      return;
    }

    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      scheduleLoop();
      return;
    }

    try {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        scheduleLoop();
        return;
      }

      const z = nativeZoomRef.current ? 1 : zoomRef.current;
      const srcW = video.videoWidth;
      const srcH = video.videoHeight;
      const cropW = Math.max(1, Math.round(srcW / z));
      const cropH = Math.max(1, Math.round(srcH / z));
      const sx = (srcW - cropW) / 2;
      const sy = (srcH - cropH) / 2;

      canvas.width = cropW;
      canvas.height = cropH;
      context.drawImage(video, sx, sy, cropW, cropH, 0, 0, cropW, cropH);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert',
      });

      const firstValue = code?.data?.trim();
      if (firstValue) {
        processingRef.current = true;
        await submitQrValue(firstValue);
        return;
      }
    } catch {
      setScanState('error');
      setStatusMessage(copy.error);
      stopCamera();
      return;
    }

    scheduleLoop();
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setScanState('unsupported');
      setStatusMessage(copy.unsupported);
      return;
    }

    setScanState('starting');
    setStatusMessage(copy.starting);

    try {
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!mountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      activeRef.current = true;

      setZoom(1);
      zoomRef.current = 1;

      const track = stream.getVideoTracks()[0];
      const caps = track?.getCapabilities?.() as (MediaTrackCapabilities & { zoom?: { min: number; max: number; step?: number } }) | undefined;
      if (caps?.zoom && typeof caps.zoom.max === 'number' && caps.zoom.max > caps.zoom.min) {
        nativeZoomRef.current = caps.zoom;
        setSupportsNativeZoom(true);
        setMaxZoom(Math.max(3, Math.round(caps.zoom.max)));
      } else {
        nativeZoomRef.current = null;
        setSupportsNativeZoom(false);
        setMaxZoom(4);
      }

      const video = videoRef.current;
      if (video) {
        video.srcObject = stream;
        await video.play();
      }

      if (!mountedRef.current) return;
      setScanState('scanning');
      setStatusMessage(copy.ready);
      scheduleLoop();
    } catch {
      setScanState('error');
      setStatusMessage(copy.error);
      stopCamera();
    }
  };

  const applyZoom = (value: number) => {
    const clamped = Math.min(maxZoom, Math.max(1, value));
    setZoom(clamped);
    zoomRef.current = clamped;

    const native = nativeZoomRef.current;
    const track = streamRef.current?.getVideoTracks()[0];
    if (native && track) {
      const ratio = maxZoom > 1 ? (clamped - 1) / (maxZoom - 1) : 0;
      const nativeValue = native.min + (native.max - native.min) * ratio;
      type ZoomConstraint = MediaTrackConstraintSet & { zoom: number };
      track.applyConstraints({ advanced: [{ zoom: nativeValue }] as ZoomConstraint[] }).catch(() => undefined);
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    if (isOpen) {
      setShouldRender(true);
      setIsFullscreen(false);
      setAnimate(false);
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });

      void startCamera();

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
      };
    }

    setAnimate(false);
    setIsFullscreen(false);
    stopCamera();
    const timer = window.setTimeout(() => setShouldRender(false), 220);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, []);

  if (!shouldRender) return null;

  const showCamera = scanState !== 'unsupported';

  return (
    <div data-testid="attendance-scan-modal" role="dialog" aria-modal="true" aria-label="Imbas Kehadiran QR" className={`fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-md transition-all duration-200 touch-pan-y overscroll-contain ${animate ? 'bg-slate-900/35 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
      }`}>
      <div className={`flex flex-col w-full rounded-2xl border transition-all duration-300 shadow-2xl overflow-hidden min-h-0 ${isFullscreen ? '' : 'max-w-[96vw] sm:max-w-md max-h-[92dvh] transform backdrop-blur-xl'} ${isFullscreen ? '' : animate ? 'scale-100 opacity-100' : 'scale-[0.98] opacity-0'
        } ${isLight ? 'bg-white/95 border-slate-200 text-slate-800' : 'bg-[#0A1428]/95 border-white/[0.08] shadow-black/40 text-white'
        }`}>

        {/* Header */}
        <div className={`p-4 border-b flex-shrink-0 flex items-start gap-3 ${isLight ? 'border-slate-200 bg-slate-50/50' : 'border-white/[0.06] bg-[#0A1428]/95'
          }`}>
          <div className={`w-10 h-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'
            }`}>
            <ScanLine className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{copy.title}</h3>
                <p className={`text-[11px] sm:text-xs leading-relaxed mt-0.5 truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>{copy.desc}</p>
              </div>
              <button
                onClick={() => {
                  stopCamera();
                  onClose();
                }}
                className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'
                  }`}
                aria-label={copy.close}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div data-lenis-prevent className="p-4 flex-1 overflow-y-auto min-h-0 flex flex-col gap-4 touch-pan-y overscroll-contain">

          {showCamera && (
            <div className={isFullscreen
              ? 'fixed inset-0 z-[100] bg-black flex items-center justify-center'
              : `flex-shrink-0 rounded-2xl border overflow-hidden ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-black/40 border-white/10'}`
            }>
              <div className={`relative bg-black flex items-center justify-center overflow-hidden ${isFullscreen ? 'w-full h-full' : 'h-48 sm:h-56 w-full'}`}>
                <video
                  ref={videoRef}
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-150 will-change-transform"
                  style={supportsNativeZoom ? undefined : { transform: `scale(${zoom})` }}
                  playsInline
                  muted
                />
                <div className="absolute inset-0 pointer-events-none bg-black/10" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4">
                  <div className={`rounded-xl border-2 border-white/30 border-dashed ${isFullscreen ? 'w-56 h-56 sm:w-64 sm:h-64' : 'w-32 h-32 sm:w-40 sm:h-40'}`} />
                </div>

                <button
                  type="button"
                  onClick={() => setIsFullscreen((v) => !v)}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-black/50 text-white/80 hover:text-white hover:bg-black/70 backdrop-blur-sm transition-colors"
                  aria-label={isFullscreen ? (lang === 'ms' ? 'Keluar skrin penuh' : 'Exit fullscreen') : (lang === 'ms' ? 'Skrin penuh' : 'Fullscreen')}
                >
                  {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                </button>

                {(scanState === 'scanning' || scanState === 'starting') && (
                  <div className={`absolute left-0 right-0 flex items-center gap-2 px-3 ${isFullscreen ? 'bottom-5' : 'bottom-2'}`}>
                    <ZoomOut className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <input
                      type="range"
                      min={1}
                      max={maxZoom}
                      step={0.1}
                      value={zoom}
                      onChange={(e) => applyZoom(parseFloat(e.target.value))}
                      className="flex-1 h-1 cursor-pointer accent-amber-400"
                      aria-label={lang === 'ms' ? 'Zum kamera' : 'Camera zoom'}
                    />
                    <ZoomIn className="w-4 h-4 text-white/70 flex-shrink-0" />
                    <span className="text-[10px] font-mono text-white/70 w-8 text-right flex-shrink-0">{zoom.toFixed(1)}x</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex items-center gap-1.5 group relative w-max">
              <label className={`text-[10px] font-semibold uppercase tracking-[0.2em] ${isLight ? 'text-slate-400' : 'text-white/30'}`}>
                {copy.manualLabel}
              </label>
              <Info className={`w-3.5 h-3.5 ${isLight ? 'text-slate-400' : 'text-white/30'}`} />

              <div className={`absolute bottom-full left-0 mb-2 w-[280px] p-3 rounded-xl border shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 ${isLight ? 'bg-white border-slate-200 text-slate-600' : 'bg-[#0f172a] border-white/10 text-white/70'
                }`}>
                <p className="text-xs leading-relaxed">
                  <strong className={`block mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>{copy.qrBotHintTitle}</strong>
                  {lang === 'ms' ? (
                    <>Hantar imej QR kepada <a href="https://t.me/PautQRBot" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-semibold">@PautQRBot</a> di Telegram dan guna arahan <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono">/readerqr</code> untuk mengekstrak nilai QR!</>
                  ) : (
                    <>Send the QR image to <a href="https://t.me/PautQRBot" target="_blank" rel="noreferrer" className="text-amber-500 hover:underline font-semibold">@PautQRBot</a> on Telegram and use the <code className="bg-black/5 dark:bg-white/10 px-1 py-0.5 rounded text-[10px] font-mono">/readerqr</code> command to extract the QR value!</>
                  )}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <input
                data-testid="attendance-scan-input"
                type="text"
                value={manualQr}
                onChange={(e) => setManualQr(e.target.value)}
                placeholder={copy.manualHint}
                className={`flex-1 min-w-0 rounded-lg border px-3 py-2 text-xs font-mono focus:outline-none ${isLight
                    ? 'bg-white border-slate-200 text-slate-700 placeholder-slate-400 focus:border-amber-400'
                    : 'bg-white/[0.04] border-white/10 text-white placeholder-white/25 focus:border-amber-300/50'
                  }`}
              />
              <button
                data-testid="attendance-scan-submit"
                onClick={() => void submitQrValue(manualQr)}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-3 sm:px-4 py-2 text-xs font-bold transition-colors flex-shrink-0 whitespace-nowrap ${isLight ? 'bg-[#0B1E43] hover:bg-[#122a5b] text-white' : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
              >
                <QrCode className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{copy.submit}</span>
              </button>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                data-testid="attendance-scan-upload"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-xs font-bold transition-colors border flex-1 min-w-0 ${isLight
                    ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80'
                  }`}
              >
                <Upload className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{copy.uploadImg}</span>
              </button>

              <button
                data-testid="attendance-scan-toggle"
                onClick={() => {
                  if (scanState === 'scanning' || scanState === 'starting') {
                    stopCamera();
                    setScanState('idle');
                    setStatusMessage(copy.ready);
                    return;
                  }
                  void startCamera();
                }}
                className={`inline-flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg px-2 sm:px-3 py-2 text-xs font-bold transition-colors border flex-1 min-w-0 ${scanState === 'scanning' || scanState === 'starting'
                    ? isLight
                      ? 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'
                      : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-400'
                    : isLight
                      ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                      : 'bg-white/[0.04] hover:bg-white/[0.08] border-white/10 text-white/80'
                  }`}
              >
                {scanState === 'scanning' || scanState === 'starting' ? <Square className="w-3 h-3 fill-current flex-shrink-0" /> : <Camera className="w-3.5 h-3.5 flex-shrink-0" />}
                <span className="truncate">{scanState === 'scanning' || scanState === 'starting' ? copy.stop : copy.startCamera}</span>
              </button>
            </div>
          </div>

          <div role="status" aria-live="polite" className={`rounded-xl border px-3 py-2 text-xs leading-relaxed flex items-center gap-2 ${scanState === 'success'
              ? isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-400/10 border-emerald-400/20 text-emerald-300'
              : scanState === 'error' || scanState === 'unsupported'
                ? isLight ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-amber-400/10 border-amber-400/20 text-amber-300'
                : isLight ? 'bg-slate-50 border-slate-200 text-slate-500' : 'bg-white/[0.03] border-white/10 text-white/50'
            }`}>
            {(scanState === 'error' || scanState === 'unsupported') && <AlertTriangle className="w-4 h-4 flex-shrink-0" />}
            <span>{statusMessage}</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-2">
            <button
              data-testid="attendance-scan-close"
              onClick={() => {
                stopCamera();
                setScanState('idle');
                setStatusMessage(copy.desc);
                onClose();
              }}
              className={`w-full rounded-xl py-2.5 text-xs font-bold border transition-colors ${isLight
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 border-white/10'
                }`}
            >
              {copy.close}
            </button>

            <button
              data-testid="attendance-scan-restart"
              onClick={() => {
                setManualQr('');
                setScanState('idle');
                setStatusMessage(copy.desc);
                void startCamera();
              }}
              className={`w-full rounded-xl py-2.5 text-xs font-bold transition-colors ${isLight
                  ? 'bg-[#0B1E43] hover:bg-[#122a5b] text-white'
                  : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                }`}
            >
              {copy.scanAgain}
            </button>
          </div>

          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
          <canvas ref={canvasRef} className="hidden" aria-hidden="true" />

        </div> {/* End Scrollable Body */}
      </div>
    </div>
  );
}
