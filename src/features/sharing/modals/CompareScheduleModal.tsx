import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import QRCode from 'qrcode';
import { copyTextToClipboard, sanitizeTextForShare, openExternalUrl } from '@/shared/lib/security';
import { compressTimetable } from '@/features/timetable/lib/scheduleMatcher';
import { buildFullShareText } from '@/features/export/lib/shareText';
import { Camera, ScanLine, X, Upload, FileText, Calendar, AlertTriangle, ArrowLeft, Copy, Check, Users } from 'lucide-react';
import { useAuth } from '@/app/providers/AuthProvider';
import { useLanguage } from '@/app/providers/LanguageProvider';
import { useTheme } from '@/app/providers/ThemeProvider';
import { useModalA11y } from '@/shared/lib/useModalA11y';
import { decompressTimetable, calculateOverlappingFreeTime, reverseDayMap, type FreeSlot } from '@/features/timetable/lib/scheduleMatcher';
import type { TimetableItem } from '@/shared/types/usas';

type CompareScheduleModalProps = {
  isOpen: boolean;
  onClose: () => void;
  initialSharedData?: string | null;
};

type ScanState = 'idle' | 'scanning' | 'processing' | 'success' | 'error';

export default function CompareScheduleModal({ isOpen, onClose, initialSharedData }: CompareScheduleModalProps) {
  const modalRef = useModalA11y(isOpen, onClose);
  const { timetableData, session } = useAuth();
  const { t } = useLanguage();
  const { theme } = useTheme();

  const isLight = theme === 'light';
  const myTimetable = timetableData?.timetable || [];

  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);
  const [activeTab, setActiveTab] = useState<'scan' | 'share' | 'whatsapp'>('scan');
  const [copied, setCopied] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [myQrUrl, setMyQrUrl] = useState('');
  const [scanState, setScanState] = useState<ScanState>('idle');
  const [statusMessage, setStatusMessage] = useState(t('compareScanIdle'));
  const [friendData, setFriendData] = useState<{ studentName: string; timetable: TimetableItem[] } | null>(null);
  const [freeSlots, setFreeSlots] = useState<FreeSlot[]>([]);

  const mountedRef = useRef(true);
  const activeRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const loopRef = useRef<number | null>(null);
  const copiedTimerRef = useRef<number | null>(null);

  // Generate QR
  useEffect(() => {
    if (activeTab === 'share' && isOpen) {
      stopCamera();
      const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
      const data = compressTimetable(myTimetable, safeName);
      const url = `${window.location.origin}/?compare_schedule=${data}`;
      QRCode.toDataURL(url, {
        width: 250, margin: 2,
        color: { dark: isLight ? '#0f172a' : '#ffffff', light: isLight ? '#ffffff' : '#0a1428' }
      }).then(setMyQrUrl).catch(() => setMyQrUrl(''));
    } else if (activeTab === 'scan' && isOpen && scanState !== 'success') {
      startCamera();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, isOpen, isLight]);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      mountedRef.current = true;
      let raf1 = 0;
      let raf2 = 0;
      raf1 = requestAnimationFrame(() => {
        raf2 = requestAnimationFrame(() => setAnimate(true));
      });
      
      if (initialSharedData) {
        setActiveTab('scan');
        processSharedData(initialSharedData);
      } else {
        setActiveTab('share');
        setScanState('idle');
        setFriendData(null);
      }

      return () => {
        cancelAnimationFrame(raf1);
        cancelAnimationFrame(raf2);
        if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
      };
    } else {
      stopCamera();
      setAnimate(false);
      const timer = setTimeout(() => setShouldRender(false), 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, initialSharedData]);

  function processSharedData(compressedData: string) {
    setScanState('processing');
    setStatusMessage(t('compareScanAnalyzingData'));
    setTimeout(() => {
      if (!mountedRef.current) return;
      const data = decompressTimetable(compressedData);
      if (data && data.timetable.length > 0) {
        setFriendData(data);
        setFreeSlots(calculateOverlappingFreeTime(myTimetable, data.timetable));
        setScanState('success');
        stopCamera();
      } else {
        setScanState('error');
        setStatusMessage(t('compareScanInvalidQr'));
      }
    }, 400);
  };

  async function startCamera() {
    if (scanState === 'success') return;
    try {
      setScanState('scanning');
      setStatusMessage(t('compareScanReady'));
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      if (!mountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        activeRef.current = true;
        scanLoop();
      }
    } catch (err) {
      setScanState('error');
      setStatusMessage(t('compareScanDenied'));
    }
  };

  function stopCamera() {
    activeRef.current = false;
    if (loopRef.current !== null) {
      clearTimeout(loopRef.current);
      loopRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      const stream = video.srcObject as MediaStream;
      stream?.getTracks().forEach(t => t.stop());
      video.srcObject = null;
    }
  };

  function scanLoop() {
    if (!activeRef.current || !mountedRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
        
        if (code?.data) {
          try {
            const url = new URL(code.data);
            const compareData = url.searchParams.get('compare_schedule');
            if (compareData) {
              processSharedData(compareData);
              return;
            }
          } catch {} // Not a valid URL, ignore
        }
      }
    }
    loopRef.current = window.setTimeout(scanLoop, 300);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    stopCamera();
    try {
      setScanState('processing');
      setStatusMessage(t('compareScanAnalyzingImg'));
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = reject; img.src = objUrl; });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const context = canvas.getContext('2d', { willReadFrequently: true });
      if (!context) return;
      canvas.width = img.width;
      canvas.height = img.height;
      context.drawImage(img, 0, 0);
      URL.revokeObjectURL(objUrl);
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, { inversionAttempts: 'dontInvert' });
      
      if (code?.data) {
        try {
          const url = new URL(code.data);
          const compareData = url.searchParams.get('compare_schedule');
          if (compareData) {
            processSharedData(compareData);
            return;
          }
        } catch {} // Not a valid URL
      }
      setScanState('error');
      setStatusMessage(t('compareScanNoQr'));
    } catch (err) {
      setScanState('error');
      setStatusMessage(t('compareScanReadFail'));
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCopyLink = async () => {
    const safeName = sanitizeTextForShare(timetableData?.studentName || 'Pelajar', 80);
    const data = compressTimetable(myTimetable, safeName);
    await copyTextToClipboard(`${window.location.origin}/?compare_schedule=${data}`);
    if (!mountedRef.current) return;
    setCopied(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopied(false);
    }, 2000);
  };

  const handleCopyText = async () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    await copyTextToClipboard(formattedText);
    if (!mountedRef.current) return;
    setCopiedText(true);
    if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    copiedTimerRef.current = window.setTimeout(() => {
      if (mountedRef.current) setCopiedText(false);
    }, 2000);
  };

  const handleWhatsApp = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://wa.me/?text=${encoded}`);
  };

  const handleTelegram = () => {
    const formattedText = buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '');
    const encoded = encodeURIComponent(formattedText);
    openExternalUrl(`https://t.me/share/url?url=&text=${encoded}`);
  };

  if (!shouldRender) return null;

  return (
    <div ref={modalRef} role="dialog" aria-modal="true" aria-label="Banding Jadual" className={`fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-md transition-all duration-200 touch-none ${
      animate ? 'bg-slate-900/30 opacity-100' : 'bg-slate-900/0 opacity-0 pointer-events-none'
    }`}>
      <div className="absolute inset-0" onClick={onClose} />

      <div 
        className={`relative w-full max-w-2xl h-[85vh] sm:h-[34rem] max-h-[800px] rounded-2xl border shadow-2xl overflow-hidden flex flex-col transform transition-all duration-200 ${
          animate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        } ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-[#0A1428]/95 border-white/10 text-white'
        }`}
      >
        {/* Header */}
        <div className={`p-4 sm:p-5 border-b flex justify-between items-start sm:items-center gap-3 flex-shrink-0 ${isLight ? 'bg-slate-50/50 border-slate-200' : 'bg-[#0A1428]/95 border-white/[0.06]'}`}>
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border shadow-sm ${
              isLight ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
              {scanState === 'success' && activeTab === 'scan' ? (
                <button onClick={() => { setFriendData(null); startCamera(); }} className="p-1 rounded-md transition-colors hover:bg-black/5 dark:hover:bg-white/5">
                  <ArrowLeft className="w-5 h-5" />
                </button>
              ) : (
                <FileText className="w-5 h-5" />
              )}
            </div>
            <div className="text-left min-w-0">
              <h3 className={`text-sm sm:text-base font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>
                {t('compareTitle')}
              </h3>
              <p className={`text-[11px] sm:text-xs font-semibold truncate ${isLight ? 'text-slate-500' : 'text-white/40'}`}>
                {t('compareDesc')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className={`flex-shrink-0 p-1.5 rounded-md transition-colors ${isLight ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100' : 'text-white/30 hover:text-white hover:bg-white/[0.06]'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {scanState !== 'success' && (
          <div className={`flex w-full p-2 border-b ${isLight ? 'bg-white border-slate-200' : 'bg-[#060E1F] border-white/10'}`}>
            <div className={`flex w-full p-1 rounded-lg ${isLight ? 'bg-slate-100' : 'bg-black/40'}`}>
              <button
                onClick={() => setActiveTab('scan')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'scan'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('compareTabScan')}
              </button>
              <button
                onClick={() => setActiveTab('share')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'share'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('compareTabShare')}
              </button>
              <button
                onClick={() => setActiveTab('whatsapp')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${
                  activeTab === 'whatsapp'
                    ? isLight ? 'bg-white text-blue-600 shadow-sm' : 'bg-blue-500/20 text-blue-400'
                    : isLight ? 'text-slate-500 hover:text-slate-700' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {t('compareTabText')}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-hidden p-4 sm:p-6 flex flex-col min-h-0">
          {activeTab === 'whatsapp' ? (
            <div className="flex flex-col space-y-4 py-2 w-full flex-1 min-h-0">
              <div data-lenis-prevent className={`flex-1 min-h-0 rounded-xl p-3 border overflow-y-auto text-left usas-scrollbar touch-pan-y overscroll-contain ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700 font-medium' : 'bg-[#070F22] border-slate-800 text-slate-300'
              }`}>
                <pre className="text-[10px] font-mono whitespace-pre-wrap leading-relaxed">
                  {buildFullShareText(myTimetable, timetableData?.studentName || '', session?.user_id || '')}
                </pre>
              </div>
              <div className="flex justify-end gap-2 shrink-0">
                <button
                  onClick={handleWhatsApp}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    isLight ? 'bg-emerald-50 hover:bg-emerald-100/70 border-emerald-200 text-emerald-800' : 'bg-[#25D366]/15 hover:bg-[#25D366]/25 border-emerald-500/30 text-[#25D366]'
                  }`}
                  title="WhatsApp"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-4 sm:h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/></svg>
                </button>
                <button
                  onClick={handleTelegram}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    isLight ? 'bg-blue-50 hover:bg-blue-100/70 border-blue-200 text-blue-800' : 'bg-[#0088cc]/15 hover:bg-[#0088cc]/25 border-blue-500/30 text-[#0088cc]'
                  }`}
                  title="Telegram"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 sm:w-4 sm:h-4"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.892-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>
                </button>
                <button
                  onClick={handleCopyText}
                  className={`p-2 rounded-lg border flex items-center justify-center transition-all ${
                    copiedText
                      ? isLight ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      : isLight ? 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm' : 'bg-white/[0.04] hover:bg-white/[0.08] text-white/80 hover:text-white border-white/10'
                  }`}
                  title="Copy Text"
                >
                  {copiedText ? <Check className="w-5 h-5 sm:w-4 sm:h-4" /> : <Copy className="w-5 h-5 sm:w-4 sm:h-4" />}
                </button>
              </div>
            </div>
          ) : activeTab === 'share' ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-4 flex-1">
              <div className="text-center w-full max-w-sm mx-auto">
                <div className={`p-3.5 rounded-xl border inline-block shadow-inner ${isLight ? 'bg-slate-50 border-slate-200/80' : 'bg-white/[0.02] border-white/10'}`}>
                  <div className="relative w-44 h-44 mx-auto">
                    {myQrUrl ? (
                      <img src={myQrUrl} alt="QR Code" className="w-full h-full object-contain rounded-lg" />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className={`w-8 h-8 border-2 border-t-transparent rounded-full animate-spin ${isLight ? 'border-amber-500' : 'border-amber-400'}`} />
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className={`text-sm font-bold truncate ${isLight ? 'text-slate-800' : 'text-white'}`}>{timetableData?.studentName || 'Pelajar'}</h3>
                  <p className={`text-xs font-semibold truncate mt-1 ${isLight ? 'text-blue-600' : 'text-blue-400'}`}>{t('compareShowFriend')}</p>
                </div>
              </div>
              <button
                onClick={handleCopyLink}
                className={`w-full max-w-sm flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                  copied
                    ? isLight ? 'bg-emerald-100 text-emerald-700' : 'bg-emerald-500/20 text-emerald-400'
                    : isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? t('compareLinkCopied') : t('compareCopyLink')}
              </button>
            </div>
          ) : scanState !== 'success' ? (
            <div className="flex flex-col items-center justify-center space-y-6 py-2 flex-1">
              {/* Scanner UI */}
              <div className="relative w-full max-w-sm h-64 rounded-2xl overflow-hidden bg-black flex items-center justify-center shadow-inner">
                <canvas ref={canvasRef} className="hidden" />
                <video ref={videoRef} className="absolute inset-0 h-full w-full object-cover" playsInline />
                
                {scanState === 'scanning' && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-[15%] border-2 border-blue-500/50 rounded-xl" />
                    <div className="absolute top-0 left-0 w-full h-[2px] bg-blue-400 shadow-[0_0_8px_2px_rgba(59,130,246,0.5)] animate-bounce" />
                  </div>
                )}
                
                {scanState === 'processing' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                )}

                {(scanState === 'error' || scanState === 'idle') && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-[#0a1428]">
                    {scanState === 'error' ? <AlertTriangle className="w-10 h-10 mb-2 text-red-400" /> : <Camera className="w-10 h-10 mb-2" />}
                    <p className="text-sm font-medium">{scanState === 'error' ? t('compareScanFailed') : t('compareCameraReady')}</p>
                  </div>
                )}
              </div>

              <div className="text-center space-y-3 max-w-sm mx-auto">
                <p className={`text-sm font-medium ${scanState === 'error' ? 'text-red-500' : isLight ? 'text-slate-600' : 'text-white/60'}`}>{statusMessage}</p>
                <div className="flex items-center justify-center gap-3 pt-2">
                  <button onClick={startCamera} className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-colors ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700' : 'bg-white/10 hover:bg-white/20 text-white'}`}>
                    <ScanLine className="w-4 h-4 inline-block mr-1.5" /> {t('compareScanBtn')}
                  </button>
                  <label className={`px-4 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-colors ${isLight ? 'bg-blue-50 hover:bg-blue-100 text-blue-700' : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-300'}`}>
                    <Upload className="w-4 h-4 inline-block mr-1.5" /> {t('compareUploadBtn')}
                    <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                  </label>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Success Result View */}
              <div className={`p-4 rounded-xl flex items-center gap-4 ${isLight ? 'bg-emerald-50 text-emerald-900 border border-emerald-100' : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'}`}>
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                  <Users className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <div className="font-bold text-base">{t('compareMerged')}</div>
                  <div className="text-sm opacity-80 mt-0.5">{t('compareWith')} <span className="font-bold text-emerald-600 dark:text-emerald-400">{friendData?.studentName}</span></div>
                </div>
              </div>

              {/* Free Time Grid */}
              <div className="space-y-4">
                <h3 className="font-bold flex items-center gap-2 text-lg">
                  <Calendar className="w-5 h-5 text-blue-500" /> {t('compareCommonFree')}
                </h3>
                
                <div className="space-y-3">
                  {reverseDayMap.filter(d => d !== 'SABTU' && d !== 'AHAD').map(dayStr => {
                    const daySlots = freeSlots.filter(s => s.dayStr === dayStr);
                    if (daySlots.length === 0) return null;
                    
                    const formatTime = (mins: number) => {
                      const h = Math.floor(mins / 60);
                      const m = mins % 60;
                      return `${h === 12 ? 12 : h % 12}:${m.toString().padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`;
                    };

                    return (
                      <div key={dayStr} className={`p-4 rounded-xl border ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#0f172a] border-white/10 shadow-lg'}`}>
                        <div className="text-sm font-bold mb-3 opacity-60 uppercase tracking-widest">{dayStr}</div>
                        <div className="flex flex-wrap gap-2">
                          {daySlots.map((slot, i) => {
                            const durationH = Math.round(((slot.endMins - slot.startMins) / 60) * 10) / 10;
                            return (
                              <div key={i} className={`px-3 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 ${isLight ? 'bg-blue-50 text-blue-700 border border-blue-100' : 'bg-blue-500/15 text-blue-300 border border-blue-500/30'}`}>
                                <span>{formatTime(slot.startMins)} - {formatTime(slot.endMins)}</span>
                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${isLight ? 'bg-blue-200 text-blue-800' : 'bg-blue-500/30 text-blue-100'}`}>{durationH}h</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {freeSlots.length === 0 && (
                    <div className="text-center py-8 text-sm opacity-50 italic">
                      {t('compareNoFree')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
