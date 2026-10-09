import { useEffect, useRef, useState, type RefObject } from 'react';
import type { ExportTheme, WallpaperPreset } from '../lib/wallpaperExportHelpers';

type WallpaperBackgroundOptions = {
  wallpaperRef: RefObject<HTMLDivElement | null>;
  exportMode: 'FORMAL_A4' | 'WALLPAPER';
  exportTheme: ExportTheme;
  wallpaperPreset: WallpaperPreset;
  wallpaperTopAdjustment: number;
  wallpaperBottomAdjustment: number;
  daysList: string[];
};

export function useWallpaperBackground({
  wallpaperRef, exportMode, exportTheme, wallpaperPreset,
  wallpaperTopAdjustment, wallpaperBottomAdjustment, daysList,
}: WallpaperBackgroundOptions) {
  const [wallpaperBackground, setWallpaperBackground] = useState('');
  const [wallpaperBackgroundBlurred, setWallpaperBackgroundBlurred] = useState('');
  const [useNativeGlassBlur, setUseNativeGlassBlur] = useState(false);
  const [wallpaperBackgroundName, setWallpaperBackgroundName] = useState('');
  const [wallpaperBackgroundError, setWallpaperBackgroundError] = useState('');
  const [brightDayLabels, setBrightDayLabels] = useState<Set<number>>(() => new Set());
  const wallpaperBackgroundInputRef = useRef<HTMLInputElement>(null);
  const wallpaperBackgroundUrlsRef = useRef<string[]>([]);
  useEffect(() => () => {
    wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const loadWallpaperBackground = async (file?: File) => {
    setWallpaperBackgroundError('');
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setWallpaperBackgroundError('wallpaperImageLoadFailed');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setWallpaperBackgroundError('wallpaperImageTooLarge');
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    let blurredCanvas: HTMLCanvasElement | null = null;
    let blurredUrl = '';
    let retainedUrls = false;
    let supportsCanvasBlur = false;
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
      const maxDimension = Math.max(image.naturalWidth, image.naturalHeight);
      const blurScale = Math.min(1, 2048 / maxDimension);
      const blurWidth = Math.max(1, Math.round(image.naturalWidth * blurScale));
      const blurHeight = Math.max(1, Math.round(image.naturalHeight * blurScale));
      const blurProbe = document.createElement('canvas');
      blurProbe.width = blurProbe.height = 5;
      const probeContext = blurProbe.getContext('2d');
      if (probeContext) {
        probeContext.filter = 'blur(1px)';
        probeContext.fillStyle = '#000';
        probeContext.fillRect(2, 2, 1, 1);
        supportsCanvasBlur = probeContext.getImageData(1, 2, 1, 1).data[3] > 0;
      }
      blurProbe.width = blurProbe.height = 0;

      blurredCanvas = document.createElement('canvas');
      blurredCanvas.width = blurWidth;
      blurredCanvas.height = blurHeight;
      const blurredContext = blurredCanvas.getContext('2d');
      if (!blurredContext) throw new Error('Canvas unavailable');
      blurredContext.filter = 'blur(16px)';
      blurredContext.drawImage(image, -16, -16, blurWidth + 32, blurHeight + 32);

      const blurredBlob = await new Promise<Blob | null>((resolve) => blurredCanvas!.toBlob(resolve, 'image/png'));
      if (!blurredBlob) throw new Error('Could not encode wallpaper background.');

      blurredUrl = URL.createObjectURL(blurredBlob);
      wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
      wallpaperBackgroundUrlsRef.current = [objectUrl, blurredUrl];
      retainedUrls = true;
      setWallpaperBackground(objectUrl);
      setWallpaperBackgroundBlurred(blurredUrl);
      setWallpaperBackgroundName(file.name);
      setUseNativeGlassBlur(!supportsCanvasBlur);
    } catch {
      setWallpaperBackgroundError('wallpaperImageLoadFailed');
      if (!retainedUrls) {
        URL.revokeObjectURL(objectUrl);
        if (blurredUrl) URL.revokeObjectURL(blurredUrl);
      }
    } finally {
      if (blurredCanvas) {
        blurredCanvas.width = 0;
        blurredCanvas.height = 0;
      }
    }
  };


  useEffect(() => {
    setBrightDayLabels(new Set());
    if (!wallpaperBackground || exportMode !== 'WALLPAPER') return;

    let cancelled = false;
    const frame = requestAnimationFrame(() => {
      void (async () => {
        const root = wallpaperRef.current;
        if (!root) return;

        const image = new Image();
        image.src = wallpaperBackground;
        try {
          await image.decode();
          if (cancelled) return;

          const rootWidth = root.offsetWidth;
          const rootHeight = root.offsetHeight;
          const coverScale = Math.max(rootWidth / image.naturalWidth, rootHeight / image.naturalHeight);
          const imageLeft = (rootWidth - image.naturalWidth * coverScale) / 2;
          const imageTop = (rootHeight - image.naturalHeight * coverScale) / 2;
          const canvas = document.createElement('canvas');
          canvas.width = canvas.height = 1;
          const context = canvas.getContext('2d', { willReadFrequently: true });
          if (!context) return;

          const rootRect = root.getBoundingClientRect();
          const labels = [...root.querySelectorAll<HTMLElement>('[data-wallpaper-day-label]')];
          const bright = new Set<number>();
          const baseLuminosity = exportTheme === 'light' ? 248 : exportTheme === 'oled' ? 9 : exportTheme === 'emerald' ? 14 : exportTheme === 'warm' ? 34 : 10;
          const glassLuminosity = exportTheme === 'light' ? 255 : 0;

          labels.forEach((label) => {
            const bounds = label.getBoundingClientRect();
            const x = ((bounds.left + bounds.width / 2 - rootRect.left) / rootRect.width) * rootWidth;
            const y = ((bounds.top + bounds.height / 2 - rootRect.top) / rootRect.height) * rootHeight;
            const sourceX = Math.max(0, Math.min(image.naturalWidth - 1, Math.round((x - imageLeft) / coverScale) - 16));
            const sourceY = Math.max(0, Math.min(image.naturalHeight - 1, Math.round((y - imageTop) / coverScale) - 16));
            const sampleSize = Math.min(32, image.naturalWidth - sourceX, image.naturalHeight - sourceY);
            context.clearRect(0, 0, 1, 1);
            context.drawImage(image, sourceX, sourceY, sampleSize, sampleSize, 0, 0, 1, 1);
            const [red, green, blue, alpha] = context.getImageData(0, 0, 1, 1).data;
            const opacity = alpha / 255;
            const imageLuminosity = (red * 0.2126 + green * 0.7152 + blue * 0.0722) * opacity + baseLuminosity * (1 - opacity);
            const visibleLuminosity = imageLuminosity * 0.58 + glassLuminosity * 0.42;
            if (visibleLuminosity >= 105) bright.add(Number(label.dataset.wallpaperDayLabel));
          });

          canvas.width = canvas.height = 0;
          if (!cancelled) setBrightDayLabels(bright);
        } catch {
          if (!cancelled) setBrightDayLabels(new Set());
        }
      })();
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
    };
  }, [wallpaperBackground, exportMode, exportTheme, wallpaperPreset, wallpaperTopAdjustment, wallpaperBottomAdjustment, daysList, wallpaperRef]);


  const clearWallpaperBackground = () => {
    wallpaperBackgroundUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    wallpaperBackgroundUrlsRef.current = [];
    setWallpaperBackground('');
    setWallpaperBackgroundBlurred('');
    setWallpaperBackgroundName('');
    setWallpaperBackgroundError('');
  };

  return {
    wallpaperBackground,
    wallpaperBackgroundBlurred,
    useNativeGlassBlur,
    wallpaperBackgroundName,
    wallpaperBackgroundError,
    brightDayLabels,
    wallpaperBackgroundInputRef,
    loadWallpaperBackground,
    clearWallpaperBackground,
  };
}
