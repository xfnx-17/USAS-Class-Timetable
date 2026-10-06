import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

type ExportElement = HTMLElement & {
  getAttribute?: (name: string) => string | null;
};

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

async function captureElement(elementRef: ExportElement | null, scale = 2, backgroundColor = '#FFFFFF') {
  if (!elementRef) {
    throw new Error('Element template not found for export.');
  }

  // Ensure all fonts are fully loaded before capturing so metrics match the browser preview
  // Use a 2-second timeout race to prevent hanging in headless or offline environments
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    await Promise.race([
      document.fonts.ready,
      new Promise((resolve) => setTimeout(resolve, 2000))
    ]);
  }

  const exportRootId = elementRef.getAttribute?.('data-export-root');
  const isWallpaper = exportRootId === 'wallpaper-export-root';

  // Measure the element layout width and height before cloning
  const width = elementRef.scrollWidth || elementRef.offsetWidth || undefined;
  const height = elementRef.scrollHeight || elementRef.offsetHeight || undefined;
  const exportWidth = isWallpaper && width ? width + 2 : width;
  const exportHeight = isWallpaper && height ? height + 2 : height;

  return html2canvas(elementRef, {
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
    onclone: (clonedDoc) => {
      // Sync all style and link tags from document.head to clonedDoc.head
      // so html2canvas uses the exact same web fonts and font metrics as the live preview
      const styles = document.head.querySelectorAll('style, link[rel="stylesheet"]');
      styles.forEach((node) => {
        clonedDoc.head.appendChild(node.cloneNode(true));
      });

      if (!exportRootId) return;
      const clonedRoot = clonedDoc.querySelector(`[data-export-root="${exportRootId}"]`) as HTMLElement | null;
      if (!clonedRoot) return;

      // Reset transform, transitions, animations, and filters on the cloned root
      clonedRoot.style.transform = 'none';
      clonedRoot.style.transition = 'none';
      clonedRoot.style.animation = 'none';
      clonedRoot.style.filter = 'none';

      // Compensate for html2canvas's font-baseline offset in formal exports.
      // Wallpaper skips this correction because it displaces its small labels.
      const isApple = typeof navigator !== 'undefined' && (/Mac|iPod|iPhone|iPad/.test(navigator.platform) || (/MacIntel/.test(navigator.platform) && navigator.maxTouchPoints > 1) || /iPhone|iPad|iPod/i.test(navigator.userAgent));

      if (!isApple && !isWallpaper) {
        const view = clonedDoc.defaultView || window;
        const textNodes = clonedRoot.querySelectorAll('span, h1, h2, p');
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
          const shift = Math.max(1, Math.round(fontSize * 0.36));
          el.style.transform = `translateY(-${shift}px)`;
        });
      }

      if (exportRootId === 'wallpaper-export-root') {
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
    }
  });
}

/**
 * Generates an official printable PDF file (A4 Portrait or Landscape)
 */
export async function generateTimetablePdf(
  elementRef: ExportElement | null,
  orientation: 'portrait' | 'landscape' = 'portrait',
  fileName = 'Jadual_Kuliah_USAS.pdf',
) {
  const canvas = await captureElement(elementRef, 4, '#FFFFFF');

  const imgData = canvas.toDataURL('image/png');
  const isLandscape = orientation === 'landscape';

  const pdf = new jsPDF({
    orientation: isLandscape ? 'landscape' : 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, Math.min(imgHeight, pageHeight));
  pdf.save(sanitizeDownloadFileName(fileName, 'Jadual_Kuliah_USAS.pdf'));
}

/**
 * Generates a downloadable PNG from the given element.
 */
export async function generateElementPng(
  elementRef: ExportElement | null,
  fileName = 'Jadual_Kuliah_USAS.png',
  scale = 3,
  backgroundColor = '#FFFFFF',
) {
  const canvas = await captureElement(elementRef, scale, backgroundColor);
  const safeFileName = sanitizeDownloadFileName(fileName, 'Jadual_Kuliah_USAS.png');
  
  // Mobile in-app browsers (Google, FB) block <a> downloads. Use native iOS/Android Share Sheet instead.
  const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  
  if (isMobile && navigator.share && navigator.canShare) {
    try {
      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (blob) {
        const file = new File([blob], safeFileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Jadual Kuliah USAS'
          });
          return; // Successfully opened native share sheet (Save Image)
        }
      }
    } catch (err: unknown) {
      console.warn('Share API failed or cancelled:', err);
      if (err instanceof Error && err.name === 'AbortError') return; // User simply closed the share sheet
    }
  }

  // Fallback for Desktop, standard browsers, or if Share API fails
  const link = document.createElement('a');
  link.download = safeFileName;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    document.body.removeChild(link);
  }
}

/**
 * Generates a high-resolution PNG image for Device Lock Screen / Phone Wallpaper
 */
export async function generateLockscreenImage(elementRef: ExportElement | null, fileName = 'Jadual_USAS_Lockscreen.png') {
  await generateElementPng(elementRef, fileName, 5, null);
}

