import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ExportElement = HTMLElement & {
  getAttribute?: (name: string) => string | null;
};
type ExportProgress = (progress: number) => void;

export function sanitizeDownloadFileName(value: unknown, fallback: string): string {
  const raw = String(value ?? '').trim();
  let safeName = '';

  for (const char of raw) {
    const code = char.charCodeAt(0);
    const isControl = code < 32 || code === 127;
    if (isControl || '<>:"/\\|?*'.includes(char)) {
      safeName += '_';
    } else if (/\s/.test(char)) {
      safeName += '_';
    } else {
      safeName += char;
    }
  }

  safeName = safeName.replace(/_+/g, '_').replace(/^_+|_+$/g, '').replace(/[. ]+$/g, '').slice(0, 120);

  const baseName = safeName.replace(/\.[^.]+$/, '');
  const reservedNames = new Set([
    'con', 'prn', 'aux', 'nul',
    'com1', 'com2', 'com3', 'com4', 'com5', 'com6', 'com7', 'com8', 'com9',
    'lpt1', 'lpt2', 'lpt3', 'lpt4', 'lpt5', 'lpt6', 'lpt7', 'lpt8', 'lpt9',
  ]);
  if (reservedNames.has(baseName.toLowerCase())) {
    safeName = `_${safeName}`;
  }

  if (!safeName) return fallback;
  return safeName;
}

async function captureElement(
  elementRef: ExportElement | null,
  scale = 2,
  backgroundColor: string | null = '#FFFFFF',
  onProgress?: ExportProgress,
) {
  if (!elementRef) {
    throw new Error('Element template not found for export.');
  }

  const yieldToPaint = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  onProgress?.(15);
  await yieldToPaint();

  // Ensure all fonts are loaded before capturing so metrics match the browser preview.
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }
  onProgress?.(30);
  await yieldToPaint();

  const exportRootId = elementRef.getAttribute?.('data-export-root');
  const isWallpaper = exportRootId === 'wallpaper-export-root';

  // Measure the element layout width and height before cloning
  const width = elementRef.scrollWidth || elementRef.offsetWidth || undefined;
  const height = elementRef.scrollHeight || elementRef.offsetHeight || undefined;
  const exportWidth = isWallpaper && width ? width + 2 : width;
  const exportHeight = isWallpaper && height ? height + 2 : height;

  const captureOptions: Parameters<typeof html2canvas>[1] = {
    scale,
    useCORS: true,
    logging: false,
    backgroundColor,
    scrollX: 0,
    scrollY: 0,
    width: exportWidth,
    height: exportHeight,
    windowWidth: exportWidth || window.innerWidth,
    windowHeight: exportHeight || window.innerHeight,
    ignoreElements: (element) => {
      const head = element.ownerDocument.head;
      if (element === head || head.contains(element)) return false;
      return element !== elementRef && !element.contains(elementRef) && !elementRef.contains(element);
    },
    onclone: async (clonedDoc) => {
      // Sync all style and link tags from document.head to clonedDoc.head
      // so html2canvas uses the exact same web fonts and font metrics as the live preview
      const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((node) => {
        clonedDoc.head.appendChild(node.cloneNode(true));
      });

      if (!exportRootId) return;
      const clonedRoot = clonedDoc.querySelector(`[data-export-root="${exportRootId}"]`) as HTMLElement | null;
      if (!clonedRoot) return;

      const nativeBlurLayer = clonedRoot.querySelector<HTMLElement>('[data-wallpaper-native-blur="true"]');
      const wallpaperImage = clonedRoot.querySelector<HTMLImageElement>('[data-wallpaper-background-layer]');
      if (nativeBlurLayer && wallpaperImage) {
        await wallpaperImage.decode().catch(() => undefined);
      }
      if (nativeBlurLayer && wallpaperImage?.naturalWidth && wallpaperImage.naturalHeight) {
        const blurCanvas = clonedDoc.createElement('canvas');
        // ponytail: cap fallback blur at 1024px (~4MB RGBA); raise only if mobile exports still look soft.
        const downscale = Math.min(1, 1024 / Math.max(wallpaperImage.naturalWidth, wallpaperImage.naturalHeight));
        blurCanvas.width = Math.max(1, Math.round(wallpaperImage.naturalWidth * downscale));
        blurCanvas.height = Math.max(1, Math.round(wallpaperImage.naturalHeight * downscale));
        const blurContext = blurCanvas.getContext('2d');
        if (blurContext) {
          blurContext.imageSmoothingEnabled = true;
          blurContext.imageSmoothingQuality = 'high';
          blurContext.drawImage(wallpaperImage, 0, 0, blurCanvas.width, blurCanvas.height);
          nativeBlurLayer.style.backgroundImage = `url("${blurCanvas.toDataURL('image/png')}")`;
          nativeBlurLayer.style.filter = 'none';
          nativeBlurLayer.style.webkitFilter = 'none';
        }
        blurCanvas.width = 0;
        blurCanvas.height = 0;
      }

      // html2canvas cannot parse modern OKLCH/OKLab colors emitted by Tailwind 4.
      // Convert only affected computed declarations in the export clone.
      const colorContext = clonedDoc.createElement('canvas').getContext('2d', { willReadFrequently: true });
      const view = clonedDoc.defaultView || window;
      if (colorContext) {
        const modernColorPattern = /(?:oklch|oklab)\([^)]*\)/gi;
        const colorProperties = [
          'color', 'background-color', 'background-image', 'outline-color', 'text-decoration-color',
          'text-emphasis-color', 'column-rule-color', 'caret-color', 'accent-color', 'fill', 'stroke',
          'box-shadow', 'text-shadow', '--tw-gradient-from', '--tw-gradient-via', '--tw-gradient-to',
          '--tw-gradient-stops', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color',
        ];
        const colorCache = new Map<string, string>();
        [clonedRoot, ...clonedRoot.querySelectorAll<HTMLElement>('*')].forEach((el) => {
          const computed = view.getComputedStyle(el);
          colorProperties.forEach((property) => {
            const value = computed.getPropertyValue(property);
            if (!value.includes('oklch(') && !value.includes('oklab(')) return;
            const compatibleValue = value.replace(modernColorPattern, (color) => {
              const cached = colorCache.get(color);
              if (cached) return cached;
              colorContext.clearRect(0, 0, 1, 1);
              colorContext.fillStyle = color;
              colorContext.fillRect(0, 0, 1, 1);
              const [red, green, blue, alpha] = colorContext.getImageData(0, 0, 1, 1).data;
              const converted = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;
              colorCache.set(color, converted);
              return converted;
            });
            el.style.setProperty(property, compatibleValue, 'important');
          });
        });
      }

      // Reset transform, transitions, animations, and filters on the cloned root
      clonedRoot.style.transform = 'none';
      clonedRoot.style.transition = 'none';
      clonedRoot.style.animation = 'none';
      clonedRoot.style.filter = 'none';

      // Compensate for html2canvas's font-baseline offset. Wallpaper only needs it on time labels.
      const isApple = typeof navigator !== 'undefined' && (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || (/MacIntel/.test(navigator.platform) && navigator.maxTouchPoints > 1) || /iPhone|iPad|iPod/i.test(navigator.userAgent));
      const isAndroid = typeof navigator !== 'undefined' && /Android/i.test(navigator.userAgent);

      if (isApple && isWallpaper) {
        clonedRoot.querySelectorAll('[data-export-time-label], [data-export-course-code]').forEach((node) => {
          (node as HTMLElement).style.letterSpacing = 'normal';
        });
      }

      if (isWallpaper) {
        clonedRoot.querySelectorAll<HTMLElement>('[data-export-course-content]').forEach((el) => {
          el.style.transform = 'translateY(-6px)';
        });
      }

      if (isWallpaper) {
        const courseTimeOffset = isAndroid || isApple ? 2 : 1;
        clonedRoot.querySelectorAll<HTMLElement>('[data-export-course-time]').forEach((el) => {
          el.style.transform = `translateY(${courseTimeOffset}px)`;
        });
      }

      if (!isApple || isWallpaper) {
        const textNodes = clonedRoot.querySelectorAll(isWallpaper ? '[data-export-time-label]' : 'span, h1, h2, p');
        textNodes.forEach((node) => {
          const el = node as HTMLElement;
          if (el.tagName.toLowerCase() === 'span') {
            const isBlock = el.classList.contains('block') || el.classList.contains('inline-block') || el.style.display === 'block';
            if (!isBlock) {
              el.style.display = 'inline-block';
              el.style.verticalAlign = 'middle';
            }
          }
          const fontSize = parseFloat(view.getComputedStyle(el).fontSize) || 12;
          const shift = Math.max(1, Math.round(fontSize * (isWallpaper ? (isAndroid ? 0.25 : isApple ? 0.55 : 0.62) : 0.36))) + (isAndroid && isWallpaper ? 2.5 : 0);
          el.style.transform = `translateY(-${shift}px)`;
        });
      }

      if (exportRootId === 'wallpaper-export-root') {
        const wallpaperGrid = clonedRoot.querySelector<HTMLElement>('[data-wallpaper-grid]');
        const wallpaperGridRadius = wallpaperGrid?.dataset.wallpaperGridRadius;
        if (wallpaperGrid && wallpaperGridRadius) {
          wallpaperGrid.style.borderRadius = wallpaperGridRadius;
          wallpaperGrid.style.overflow = 'hidden';
        }

        // Keep fixed width and height for wallpaper to preserve correct ratio
        clonedRoot.style.overflow = 'hidden';
        clonedRoot.style.width = elementRef.style.width || `${exportWidth || elementRef.offsetWidth}px`;
        clonedRoot.style.height = elementRef.style.height || `${exportHeight || elementRef.offsetHeight}px`;
        clonedRoot.style.borderRadius = '0';
      } else {
        // For formal document or auto-layout, expand height to fit content
        clonedRoot.style.overflow = 'visible';
        clonedRoot.style.width = `${elementRef.scrollWidth || elementRef.offsetWidth || clonedRoot.scrollWidth}px`;
        clonedRoot.style.height = 'auto';
      }

      // Reset transforms, transitions, animations, filters, and overflow clipping on all parent elements
      // up to the body so they don't shift, scale down, or clip the element in html2canvas's render space.
      let current: HTMLElement | null = clonedRoot.parentElement;
      while (current && current !== clonedDoc.body) {
        current.style.transform = 'none';
        current.style.transition = 'none';
        current.style.animation = 'none';
        current.style.filter = 'none';
        current.style.overflow = 'visible';
        current = current.parentElement;
      }

      onProgress?.(55);
      await yieldToPaint();
    }
  };

  const canvas = await html2canvas(elementRef, captureOptions);
  onProgress?.(82);
  return canvas;
}

/**
 * Generates an official printable PDF file (A4 Portrait or Landscape)
 */
export async function generateTimetablePdf(
  elementRef: ExportElement | null,
  orientation: 'portrait' | 'landscape' = 'portrait',
  fileName = 'Jadual_Kuliah_USAS.pdf',
  onProgress?: ExportProgress,
) {
  const canvas = await captureElement(elementRef, 4, '#FFFFFF', onProgress);

  const imgData = canvas.toDataURL('image/png');
  onProgress?.(90);
  const isLandscape = orientation === 'landscape';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imageScale = Math.min(pageWidth / canvas.width, pageHeight / canvas.height);
  const imgWidth = canvas.width * imageScale;
  const imgHeight = canvas.height * imageScale;
  const imgX = (pageWidth - imgWidth) / 2;
  const imgY = (pageHeight - imgHeight) / 2;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth, imgHeight);
  pdf.save(sanitizeDownloadFileName(fileName, 'Jadual_Kuliah_USAS.pdf'));
}

/**
 * Generates a downloadable PNG from the given element.
 */
export async function generateElementPng(
  elementRef: ExportElement | null,
  fileName = 'Jadual_Kuliah_USAS.png',
  scale = 3,
  backgroundColor: string | null = '#FFFFFF',
  onProgress?: ExportProgress,
) {
  const canvas = await captureElement(elementRef, scale, backgroundColor, onProgress);
  const safeFileName = sanitizeDownloadFileName(fileName, 'Jadual_Kuliah_USAS.png');
  onProgress?.(88);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  canvas.width = 0;
  canvas.height = 0;
  if (!blob) throw new Error('Could not encode exported image.');
  
  // iOS browsers need the share sheet; Android Chrome should save through its Downloads flow.
  const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);
  
  if (isIOS && navigator.share && navigator.canShare) {
    try {
      const file = new File([blob], safeFileName, { type: 'image/png' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Jadual Kuliah USAS'
        });
        return; // Successfully opened native share sheet (Save Image)
      }
    } catch (err: unknown) {
      console.warn('Share API failed or cancelled:', err);
      if (err instanceof Error && err.name === 'AbortError') return; // User simply closed the share sheet
    }
  }

  // Fallback for Desktop, standard browsers, or if Share API fails
  const link = document.createElement('a');
  const objectUrl = URL.createObjectURL(blob);
  onProgress?.(96);
  link.download = safeFileName;
  link.href = objectUrl;
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
}

/**
 * Generates a high-resolution PNG image for Device Lock Screen / Phone Wallpaper
 */
export async function generateLockscreenImage(
  elementRef: ExportElement | null,
  fileName = 'Jadual_USAS_Lockscreen.png',
  onProgress?: ExportProgress,
) {
  await generateElementPng(elementRef, fileName, 5, null, onProgress);
}

