import { useEffect, useRef, useState, type RefObject } from 'react';
import { generateElementPng, generateLockscreenImage, generateTimetablePdf } from '@/features/export/lib/pdfGenerator';
import type { LanguageCode } from '@/shared/types/usas';
import type { ExportTheme, WallpaperPreset } from '../lib/wallpaperExportHelpers';

type ExportDownloadOptions = {
  mode: 'FORMAL_A4' | 'WALLPAPER';
  fileType: 'PDF' | 'PNG';
  preset: WallpaperPreset;
  theme: ExportTheme;
  matricNo: string;
  lang: LanguageCode;
  pdfRef: RefObject<HTMLDivElement | null>;
  wallpaperRef: RefObject<HTMLDivElement | null>;
};

export function useExportDownload({ mode, fileType, preset, theme, matricNo, lang, pdfRef, wallpaperRef }: ExportDownloadOptions) {
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressStatus, setProgressStatus] = useState('');
  const exportSettledTimeoutRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (exportSettledTimeoutRef.current !== null) {
        clearTimeout(exportSettledTimeoutRef.current);
        exportSettledTimeoutRef.current = null;
      }
    };
  }, []);

  const handleDownload = async () => {
    setExporting(true);
    setProgress(10);
    setProgressStatus(lang === 'en' ? 'Initializing render engine...' : 'Memulakan enjin jana...');

    if (exportSettledTimeoutRef.current !== null) {
      clearTimeout(exportSettledTimeoutRef.current);
      exportSettledTimeoutRef.current = null;
    }

    const updateExportProgress = (next: number) => {
      if (!isMountedRef.current) return;
      setProgress(next);
      setProgressStatus(next < 30
        ? lang === 'en' ? 'Initializing render engine...' : 'Memulakan enjin jana...'
        : next < 85
          ? lang === 'en' ? 'Rendering high-resolution elements...' : 'Menjana grafik resolusi tinggi...'
          : lang === 'en' ? 'Compiling download package...' : 'Menyusun fail muat turun...');
    };

    try {
      await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));

      if (mode === 'WALLPAPER') {
        const filename = `USAS_Lockscreen_${preset.toUpperCase()}_${theme.toUpperCase()}_${matricNo || 'USAS'}.png`;
        await generateLockscreenImage(wallpaperRef.current, filename, updateExportProgress);
      } else if (fileType === 'PNG') {
        const filename = `Jadual_USAS_Formal_${matricNo || 'USAS'}_LANDSCAPE.png`;
        await generateElementPng(pdfRef.current, filename, 5, '#FFFFFF', updateExportProgress);
      } else {
        const filename = `Jadual_USAS_Formal_${matricNo || 'USAS'}_LANDSCAPE.pdf`;
        await generateTimetablePdf(pdfRef.current, 'landscape', filename, updateExportProgress);
      }

      if (!isMountedRef.current) return;
      setProgress(100);
      setProgressStatus(lang === 'en' ? 'Download completed!' : 'Muat turun berjaya!');

      // Short delay before closing loading overlay
      await new Promise((resolve) => {
        exportSettledTimeoutRef.current = window.setTimeout(() => {
          exportSettledTimeoutRef.current = null;
          resolve(null);
        }, 350);
      });
    } catch (err) {
      console.error('Export Error:', err);
      if (!isMountedRef.current) return;
      alert(lang === 'ms' ? 'Gagal menjana fail. Sila cuba lagi.' : 'Failed to generate file. Please try again.');
    } finally {
      if (exportSettledTimeoutRef.current !== null) {
        clearTimeout(exportSettledTimeoutRef.current);
        exportSettledTimeoutRef.current = null;
      }
      if (isMountedRef.current) {
        setExporting(false);
        setProgress(0);
      }
    }
  };


  return { exporting, progress, progressStatus, handleDownload };
}
