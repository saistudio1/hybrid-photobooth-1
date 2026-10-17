import { Layout4R, WeddingConfig } from '../types/photobooth';
import { getCssFilterString } from './filterPresets';

export type FilterType = string;

export interface Render4ROptions {
  photos: (string | null | undefined)[];
  layout: Layout4R;
  filter: FilterType;
  frameBgColor: string;
  frameTextColor: string;
  dateStr: string;
  title?: string;
  stamp?: string;
  isWeddingTheme?: boolean;
  weddingConfig?: WeddingConfig;
  cropOffsetY?: number; // -40 to +40 vertical position adjustment
  fitMode?: 'cover' | 'contain';
}

const FILTER_CANVAS_MAP: Record<string, string> = {
  normal: 'none',
  original: 'none',
  bw: 'grayscale(100%) contrast(120%)',
  sepia: 'sepia(90%) contrast(110%) brightness(95%)',
  warm: 'sepia(30%) saturate(140%) hue-rotate(-10deg)',
  cool: 'contrast(110%) saturate(110%) hue-rotate(15deg)',
  film: 'contrast(115%) brightness(105%) saturate(90%) sepia(20%)',
  glow: 'brightness(110%) contrast(105%) saturate(120%)',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

function drawRoundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  if (r <= 0) {
    ctx.rect(x, y, w, h);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
  }
}

/**
 * Standard 4R Photo Print Layout Renderer
 * Canvas Size: 1200 x 1800 px (4 x 6 inch at 300 DPI)
 * Safe Margin: ~40px (~3.4 mm) from edges to accommodate printer margins
 */
export async function renderPhotostrip4R(opts: Render4ROptions): Promise<string> {
  const {
    photos: photoSrcs = [],
    layout,
    filter,
    frameBgColor,
    frameTextColor,
    dateStr,
    title = 'SAI STUDIO',
    stamp = '✨',
    isWeddingTheme = false,
    weddingConfig,
    cropOffsetY = 0,
    fitMode = 'cover',
  } = opts;

  // Pre-load images (some might be undefined/null/empty)
  const loadedImages: (HTMLImageElement | null)[] = [];
  for (let i = 0; i < 6; i++) {
    const src = photoSrcs[i];
    if (src && typeof src === 'string' && src.trim().length > 0) {
      try {
        const img = await loadImage(src);
        loadedImages.push(img);
      } catch {
        loadedImages.push(null);
      }
    } else {
      loadedImages.push(null);
    }
  }

  // Canvas Dimensions: 4R 300 DPI
  const width = 1200;
  const height = 1800;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill Base Background
  const effectiveBg = isWeddingTheme ? '#fdfbf7' : frameBgColor;
  ctx.fillStyle = effectiveBg;
  ctx.fillRect(0, 0, width, height);

  // Safe Margin Border
  const safePad = 40; // 3.4 mm safety zone
  const safeW = width - safePad * 2;
  const safeH = height - safePad * 2;

  // Background subtle texture or hairline border
  const weddingAccent = weddingConfig?.accentColor || '#c5a059';
  if (isWeddingTheme) {
    ctx.strokeStyle = weddingAccent;
    ctx.lineWidth = 2;
    ctx.strokeRect(safePad - 10, safePad - 10, safeW + 20, safeH + 20);

    ctx.strokeStyle = `${weddingAccent}55`;
    ctx.lineWidth = 1;
    ctx.strokeRect(safePad - 4, safePad - 4, safeW + 8, safeH + 8);
  }

  const filterString = getCssFilterString(filter) || FILTER_CANVAS_MAP[filter] || 'none';
  const effectiveTextColor = isWeddingTheme ? '#292524' : frameTextColor;

  // Helper to draw photo or placeholder slot
  const drawSlotPhoto = (
    img: HTMLImageElement | null,
    x: number,
    y: number,
    w: number,
    h: number,
    radius: number,
    offsetYPct: number = 0,
    slotIdx: number = 0
  ) => {
    ctx.save();

    if (!img) {
      // Draw empty slot placeholder
      ctx.fillStyle = isWeddingTheme ? '#f2ece4' : '#1e2430';
      ctx.beginPath();
      drawRoundedRectPath(ctx, x, y, w, h, radius);
      ctx.closePath();
      ctx.fill();

      // Dashed border
      ctx.strokeStyle = isWeddingTheme ? '#c5a05988' : '#3b82f6aa';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.stroke();

      // Slot badge
      const cx = x + w / 2;
      const cy = y + h / 2;
      ctx.fillStyle = isWeddingTheme ? '#c5a059' : '#3b82f6';
      ctx.beginPath();
      drawRoundedRectPath(ctx, cx - 42, cy - 24, 84, 26, 6);
      ctx.fill();

      ctx.fillStyle = isWeddingTheme ? '#1c1917' : '#ffffff';
      ctx.font = 'bold 12px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FOTO #${slotIdx + 1}`, cx, cy - 11);

      ctx.fillStyle = isWeddingTheme ? '#78716c' : '#94a3b8';
      ctx.font = '600 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Belum diambil', cx, cy + 15);

      ctx.restore();
      return;
    }

    // Clip to rounded slot
    ctx.beginPath();
    drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.closePath();
    ctx.clip();

    ctx.filter = filterString;

    const imgAspect = img.width / img.height;
    const targetAspect = w / h;

    if (fitMode === 'contain') {
      let drawW = w;
      let drawH = h;
      let offX = 0;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = w;
        drawH = w / imgAspect;
        offY = (h - drawH) / 2;
      } else {
        drawH = h;
        drawW = h * imgAspect;
        offX = (w - drawW) / 2;
      }

      ctx.fillStyle = isWeddingTheme ? '#f5ebe0' : '#111827';
      ctx.fillRect(x, y, w, h);
      ctx.drawImage(img, x + offX, y + offY, drawW, drawH);
    } else {
      let drawW = w;
      let drawH = h;
      let offX = 0;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = h * imgAspect;
        offX = -(drawW - w) / 2;
      } else {
        drawH = w / imgAspect;
        const baseOffY = -(drawH - h) / 2;
        const adjust = ((drawH - h) * offsetYPct) / 100;
        offY = Math.max(-(drawH - h), Math.min(0, baseOffY + adjust));
      }

      ctx.drawImage(img, x + offX, y + offY, drawW, drawH);
    }
    ctx.restore();

    // Hairline border around photo
    ctx.save();
    ctx.strokeStyle = isWeddingTheme
      ? `${weddingAccent}66`
      : effectiveTextColor === '#ffffff'
      ? 'rgba(255,255,255,0.2)'
      : 'rgba(0,0,0,0.1)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    drawRoundedRectPath(ctx, x, y, w, h, radius);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  };

  // Helper to render wedding typography
  const drawWeddingHeader = (cx: number, cy: number, maxWidth: number) => {
    ctx.save();
    ctx.textAlign = 'center';
    ctx.fillStyle = weddingAccent;
    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillText((weddingConfig?.subtext || 'THE WEDDING OF').toUpperCase(), cx, cy - 26);

    ctx.fillStyle = '#1c1917';
    ctx.font = 'bold 28px "Playfair Display", Georgia, serif';
    ctx.fillText(weddingConfig?.coupleNames || 'Sarah & Dimas', cx, cy + 6);
    ctx.restore();
  };

  const drawWeddingFooter = (cx: number, cy: number) => {
    ctx.save();
    ctx.textAlign = 'center';

    const ornamentMap: Record<string, string> = {
      floral: '🌿 ✨ 🌿',
      rings: '💍',
      monogram: '🤍',
      minimal: '·',
    };
    const orn = ornamentMap[weddingConfig?.ornament || 'floral'] || '🌿';
    ctx.font = '16px serif';
    ctx.fillStyle = weddingAccent;
    ctx.fillText(orn, cx, cy - 14);

    ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#44403c';
    ctx.fillText(weddingConfig?.weddingDate || dateStr, cx, cy + 8);
    ctx.restore();
  };

  // =========================================================================
  // 1. DOUBLE PHOTO STRIP (2x6" Twin Strips side-by-side with cutting line)
  // =========================================================================
  if (layout === 'double_strip_4r') {
    const colW = width / 2; // 600px each
    const photoCount = 4; // Always 4 fixed vertical slots

    const padX = 48;
    const headerH = 100;
    const footerH = 110;
    const availableH = height - safePad * 2 - headerH - footerH;
    const gap = 14;
    const photoW = colW - padX * 2;
    const photoH = Math.round((availableH - gap * (photoCount - 1)) / photoCount);

    const drawOneStrip = (startX: number) => {
      const centerX = startX + colW / 2;

      // Header
      if (isWeddingTheme) {
        drawWeddingHeader(centerX, safePad + 50, photoW);
      } else {
        ctx.save();
        ctx.fillStyle = effectiveTextColor;
        ctx.textAlign = 'center';
        ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('AESTHETIC PHOTO STUDIO', centerX, safePad + 36);

        ctx.font = 'bold 24px "Playfair Display", serif';
        ctx.fillText(title.toUpperCase(), centerX, safePad + 70);
        ctx.restore();
      }

      // Photos (slots 0 to 3)
      let curY = safePad + headerH;
      for (let i = 0; i < 4; i++) {
        drawSlotPhoto(loadedImages[i], startX + padX, curY, photoW, photoH, 10, 0, i);
        curY += photoH + gap;
      }

      // Footer
      if (isWeddingTheme) {
        drawWeddingFooter(centerX, curY + 45);
      } else {
        ctx.save();
        ctx.fillStyle = effectiveTextColor;
        ctx.textAlign = 'center';
        if (stamp) {
          ctx.font = '22px "Plus Jakarta Sans", sans-serif';
          ctx.fillText(stamp, centerX, curY + 34);
        }
        ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(dateStr, centerX, curY + 65);

        ctx.font = '400 10px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
        ctx.fillText('SAI STUDIO · 4R TWIN STRIP', centerX, curY + 85);
        ctx.restore();
      }
    };

    // Draw Left and Right strips
    drawOneStrip(0);
    drawOneStrip(colW);

    // Dotted scissor cutting line in the center
    ctx.save();
    ctx.strokeStyle = isWeddingTheme ? `${weddingAccent}88` : effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 8]);
    ctx.beginPath();
    ctx.moveTo(colW, safePad);
    ctx.lineTo(colW, height - safePad);
    ctx.stroke();

    ctx.fillStyle = isWeddingTheme ? weddingAccent : effectiveTextColor;
    ctx.font = '20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✂', colW, height / 2);
    ctx.restore();
  }

  // =========================================================================
  // 2. SINGLE PHOTO STRIP 4R (Centered Elegant Strip)
  // =========================================================================
  else if (layout === 'single_strip_4r') {
    const photoCount = 4; // Always 4 slots
    const stripW = 680;
    const startX = (width - stripW) / 2;
    const pad = 44;
    const headerH = 120;
    const footerH = 130;
    const gap = 16;
    const availableH = height - safePad * 2 - headerH - footerH;
    const photoW = stripW - pad * 2;
    const photoH = Math.round((availableH - gap * (photoCount - 1)) / photoCount);
    const centerX = width / 2;

    // Strip backdrop container
    ctx.save();
    ctx.fillStyle = isWeddingTheme ? '#ffffff' : effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(startX, safePad + 10, stripW, height - (safePad + 10) * 2);

    ctx.strokeStyle = isWeddingTheme ? `${weddingAccent}44` : 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(startX, safePad + 10, stripW, height - (safePad + 10) * 2);
    ctx.restore();

    // Header
    if (isWeddingTheme) {
      drawWeddingHeader(centerX, safePad + 65, photoW);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('CLASSIC 4R PHOTO STRIP', centerX, safePad + 50);

      ctx.font = 'bold 32px "Playfair Display", serif';
      ctx.fillText(title.toUpperCase(), centerX, safePad + 90);
      ctx.restore();
    }

    // Photos (slots 0 to 3)
    let curY = safePad + headerH;
    for (let i = 0; i < 4; i++) {
      drawSlotPhoto(loadedImages[i], startX + pad, curY, photoW, photoH, 12, 0, i);
      curY += photoH + gap;
    }

    // Footer
    if (isWeddingTheme) {
      drawWeddingFooter(centerX, curY + 50);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      if (stamp) {
        ctx.font = '26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(stamp, centerX, curY + 38);
      }
      ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(dateStr, centerX, curY + 72);

      ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillText('MEMORIES IN PRINT · SAI STUDIO', centerX, curY + 95);
      ctx.restore();
    }
  }

  // =========================================================================
  // 3. KOLASE 2 × 2 4R (4 Photos in 2 Columns x 2 Rows)
  // =========================================================================
  else if (layout === 'grid_2x2_4r') {
    const pad = safePad + 30;
    const headerH = 140;
    const footerH = 140;
    const gap = 20;
    const availableW = width - pad * 2 - gap;
    const cellW = availableW / 2;
    const availableH = height - pad * 2 - headerH - footerH - gap;
    const cellH = availableH / 2;
    const centerX = width / 2;

    // Header
    if (isWeddingTheme) {
      drawWeddingHeader(centerX, pad + 60, width - pad * 2);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('AESTHETIC PHOTO STUDIO', centerX, pad + 45);

      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText(title.toUpperCase(), centerX, pad + 90);
      ctx.restore();
    }

    // Grid Coordinates
    const coords = [
      { x: pad, y: pad + headerH },
      { x: pad + cellW + gap, y: pad + headerH },
      { x: pad, y: pad + headerH + cellH + gap },
      { x: pad + cellW + gap, y: pad + headerH + cellH + gap },
    ];

    for (let idx = 0; idx < 4; idx++) {
      const coord = coords[idx];
      drawSlotPhoto(loadedImages[idx], coord.x, coord.y, cellW, cellH, 14, 0, idx);
    }

    // Footer
    const footY = height - pad - 60;
    if (isWeddingTheme) {
      drawWeddingFooter(centerX, footY + 10);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      if (stamp) {
        ctx.font = '26px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(stamp, centerX, footY - 14);
      }
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(dateStr, centerX, footY + 18);

      ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillText('4R MOMENT KEEPER · SAI STUDIO', centerX, footY + 42);
      ctx.restore();
    }
  }

  // =========================================================================
  // 4. KOLASE 3 FOTO 4R (1 Featured Photo + 2 Smaller Companion Photos)
  // =========================================================================
  else if (layout === 'collage_3_4r') {
    const pad = safePad + 30;
    const headerH = 130;
    const footerH = 130;
    const gap = 18;
    const totalAvailH = height - pad * 2 - headerH - footerH - gap;
    const topH = Math.round(totalAvailH * 0.58); // Featured larger photo
    const bottomH = totalAvailH - topH;
    const fullW = width - pad * 2;
    const bottomCellW = (fullW - gap) / 2;
    const centerX = width / 2;

    // Header
    if (isWeddingTheme) {
      drawWeddingHeader(centerX, pad + 55, fullW);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      ctx.font = '600 14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('3-PHOTO 4R COLLAGE', centerX, pad + 45);

      ctx.font = 'bold 36px "Playfair Display", serif';
      ctx.fillText(title.toUpperCase(), centerX, pad + 90);
      ctx.restore();
    }

    // Photo 1: Large Featured Photo (slot 0)
    drawSlotPhoto(loadedImages[0], pad, pad + headerH, fullW, topH, 16, cropOffsetY, 0);

    // Photo 2 & 3: Two smaller photos side-by-side below
    const botY = pad + headerH + topH + gap;
    drawSlotPhoto(loadedImages[1], pad, botY, bottomCellW, bottomH, 14, 0, 1);
    drawSlotPhoto(loadedImages[2], pad + bottomCellW + gap, botY, bottomCellW, bottomH, 14, 0, 2);

    // Footer
    const footY = height - pad - 60;
    if (isWeddingTheme) {
      drawWeddingFooter(centerX, footY + 10);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      if (stamp) {
        ctx.font = '24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(stamp, centerX, footY - 10);
      }
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(dateStr, centerX, footY + 20);

      ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillText('PREMIUM 4R MEMORY · SAI STUDIO', centerX, footY + 44);
      ctx.restore();
    }
  }

  // =========================================================================
  // 5. FOTO TUNGGAL 4R (1 Single Full 4R Photo with crop offset and frame)
  // =========================================================================
  else if (layout === 'single_4r') {
    const pad = safePad + 30;
    const headerH = 110;
    const footerH = 120;
    const photoW = width - pad * 2;
    const photoH = height - pad * 2 - headerH - footerH;
    const centerX = width / 2;

    // Header
    if (isWeddingTheme) {
      drawWeddingHeader(centerX, pad + 45, photoW);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('PORTRAIT 4R PRINT', centerX, pad + 38);

      ctx.font = 'bold 34px "Playfair Display", serif';
      ctx.fillText(title.toUpperCase(), centerX, pad + 78);
      ctx.restore();
    }

    // Primary Photo (slot 0)
    drawSlotPhoto(loadedImages[0], pad, pad + headerH, photoW, photoH, 18, cropOffsetY, 0);

    // Footer
    const footY = height - pad - 50;
    if (isWeddingTheme) {
      drawWeddingFooter(centerX, footY);
    } else {
      ctx.save();
      ctx.fillStyle = effectiveTextColor;
      ctx.textAlign = 'center';
      if (stamp) {
        ctx.font = '24px "Plus Jakarta Sans", sans-serif';
        ctx.fillText(stamp, centerX, footY - 14);
      }
      ctx.font = '600 17px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(dateStr, centerX, footY + 16);

      ctx.font = '400 11px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = effectiveTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)';
      ctx.fillText('SAI STUDIO · 4R HIGH-RESOLUTION PRINT', centerX, footY + 40);
      ctx.restore();
    }
  }

  return canvas.toDataURL('image/jpeg', 0.95);
}
