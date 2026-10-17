import { DigitalFitMode, DigitalLayoutId, FrameCustomization } from '../types/photobooth';
import { calculateDigitalSlots } from './digitalLayouts';
import { getCssFilterString } from './filterPresets';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export interface DigitalRenderOptions {
  photos: (string | null | undefined)[];
  targetCount: number; // 1 to 5
  layoutId: DigitalLayoutId;
  width: number;
  height: number;
  filterId: string;
  fitMode: DigitalFitMode;
  cropOffsetY?: number; // -50 to +50 percent
  frame: FrameCustomization;
  caption?: string;
  dateStr?: string;
  stamp?: string;
  isWeddingTheme?: boolean;
  weddingNames?: string;
  format?: 'image/jpeg' | 'image/png';
  quality?: number;
  isPreviewMode?: boolean; // if true, draw placeholder boxes for empty slots
}

export async function renderDigitalPhoto(opts: DigitalRenderOptions): Promise<string> {
  const {
    photos = [],
    layoutId = 'digital_1_full',
    width,
    height,
    filterId = 'original',
    fitMode = 'cover',
    cropOffsetY = 0,
    frame,
    caption = '',
    dateStr = '',
    stamp = '',
    isWeddingTheme = false,
    weddingNames = '',
    format = 'image/jpeg',
    quality = 0.95,
    isPreviewMode = false,
  } = opts;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(320, Math.min(3840, width));
  canvas.height = Math.max(320, Math.min(3840, height));
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Effective Background
  const effectiveBg = isWeddingTheme ? '#fdfbf7' : frame.bgColor || '#ffffff';
  ctx.fillStyle = effectiveBg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const filterString = getCssFilterString(filterId);

  // Compute Padding, Gap, Radius, and Footer
  let padX = frame.margin !== undefined ? frame.margin : frame.padding;
  let padY = frame.margin !== undefined ? frame.margin : frame.padding;
  const gap = frame.gap !== undefined ? frame.gap : Math.max(8, Math.round(canvas.width * 0.015));
  let footerH = 0;

  if (frame.style === 'polaroid') {
    footerH = Math.max(80, Math.round(canvas.height * 0.12));
    padX = Math.max(24, Math.round(canvas.width * 0.05));
    padY = Math.max(24, Math.round(canvas.height * 0.04));
  } else if (caption || dateStr || weddingNames) {
    footerH = Math.max(60, Math.round(canvas.height * 0.08));
  }

  if (frame.style === 'none') {
    padX = 0;
    padY = 0;
    footerH = 0;
  }

  const slotRadius = frame.style === 'none' ? 0 : frame.radius;

  // Calculate slot coordinates for the given layout
  const slots = calculateDigitalSlots(layoutId, canvas.width, canvas.height, padX, padY, gap, footerH, slotRadius);

  // Pre-load all available images
  const loadedImagesMap: { [index: number]: HTMLImageElement } = {};
  for (let i = 0; i < slots.length; i++) {
    const src = photos[i];
    if (src && typeof src === 'string' && src.trim().length > 0) {
      try {
        loadedImagesMap[i] = await loadImage(src);
      } catch (err) {
        console.warn(`Could not load photo for slot ${i}`, err);
      }
    }
  }

  // Draw Slots (Photos or Empty Placeholders)
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const img = loadedImagesMap[i];

    ctx.save();

    // Clip to slot boundary
    ctx.beginPath();
    if (slot.radius && slot.radius > 0) {
      drawRoundedRectPath(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius);
    } else {
      ctx.rect(slot.x, slot.y, slot.width, slot.height);
    }
    ctx.closePath();
    ctx.clip();

    if (img) {
      // Draw actual photo with filter
      if (filterString && filterString !== 'none') {
        ctx.filter = filterString;
      }

      const imgAspect = img.width / img.height;
      const targetAspect = slot.width / slot.height;

      if (fitMode === 'contain') {
        // FIT MODE: Entire photo visible, no clipping
        let drawW = slot.width;
        let drawH = slot.height;
        let offX = 0;
        let offY = 0;

        if (imgAspect > targetAspect) {
          drawW = slot.width;
          drawH = slot.width / imgAspect;
          offY = (slot.height - drawH) / 2;
        } else {
          drawH = slot.height;
          drawW = slot.height * imgAspect;
          offX = (slot.width - drawW) / 2;
        }

        // Fill slot background before letterbox
        ctx.fillStyle = isWeddingTheme ? '#f5ebe0' : '#171717';
        ctx.fillRect(slot.x, slot.y, slot.width, slot.height);
        ctx.drawImage(img, slot.x + offX, slot.y + offY, drawW, drawH);
      } else {
        // FILL / COVER MODE: Fills slot, with cropOffsetY for vertical positioning
        let drawW = slot.width;
        let drawH = slot.height;
        let offX = 0;
        let offY = 0;

        if (imgAspect > targetAspect) {
          drawW = slot.height * imgAspect;
          offX = -(drawW - slot.width) / 2;
        } else {
          drawH = slot.width / imgAspect;
          const baseOffY = -(drawH - slot.height) / 2;
          const adjust = ((drawH - slot.height) * cropOffsetY) / 100;
          offY = Math.max(-(drawH - slot.height), Math.min(0, baseOffY + adjust));
        }

        ctx.drawImage(img, slot.x + offX, slot.y + offY, drawW, drawH);
      }
    } else {
      // EMPTY SLOT: Draw clean, distinct placeholder
      ctx.fillStyle = isWeddingTheme ? '#f2ece4' : '#1e2430';
      ctx.fillRect(slot.x, slot.y, slot.width, slot.height);

      // Subtle dashed border
      ctx.save();
      ctx.strokeStyle = isWeddingTheme ? '#c5a05988' : '#3b82f6aa';
      ctx.lineWidth = 3;
      ctx.setLineDash([8, 8]);
      ctx.strokeRect(slot.x + 3, slot.y + 3, slot.width - 6, slot.height - 6);
      ctx.restore();

      // Slot text and badge
      const centerX = slot.x + slot.width / 2;
      const centerY = slot.y + slot.height / 2;

      // Badge
      ctx.fillStyle = isWeddingTheme ? '#c5a059' : '#3b82f6';
      const badgeW = 70;
      const badgeH = 28;
      ctx.beginPath();
      drawRoundedRectPath(ctx, centerX - badgeW / 2, centerY - 28, badgeW, badgeH, 8);
      ctx.fill();

      ctx.fillStyle = isWeddingTheme ? '#1c1917' : '#ffffff';
      ctx.font = 'bold 13px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`FOTO #${i + 1}`, centerX, centerY - 14);

      // Subtitle
      ctx.fillStyle = isWeddingTheme ? '#78716c' : '#94a3b8';
      ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Belum Diambil', centerX, centerY + 16);
    }

    ctx.restore();

    // Draw slot stroke borders if frame style requires it
    if (frame.style !== 'none') {
      ctx.save();
      ctx.strokeStyle = frame.color || '#ffffff';

      if (frame.style === 'solid') {
        ctx.lineWidth = Math.max(2, frame.thickness);
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 0);
      } else if (frame.style === 'thin') {
        ctx.lineWidth = Math.max(1, Math.min(4, frame.thickness));
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 0);
      } else if (frame.style === 'thick') {
        ctx.lineWidth = Math.max(8, frame.thickness);
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 0);
      } else if (frame.style === 'rounded') {
        ctx.lineWidth = Math.max(3, frame.thickness);
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, Math.max(16, slot.radius || 0));
      } else if (frame.style === 'double_line') {
        ctx.lineWidth = 2;
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 0);
        ctx.lineWidth = 1;
        strokeRoundedRect(ctx, slot.x + 4, slot.y + 4, slot.width - 8, slot.height - 8, Math.max(0, (slot.radius || 0) - 2));
      } else if (frame.style === 'minimalist') {
        ctx.lineWidth = 1;
        ctx.strokeStyle = `${frame.color}50`;
        strokeRoundedRect(ctx, slot.x, slot.y, slot.width, slot.height, slot.radius || 0);
      }
      ctx.restore();
    }
  }

  // Draw Overall Frame Decoration
  if (frame.style === 'wedding_minimalist' || isWeddingTheme) {
    ctx.save();
    const accent = isWeddingTheme ? '#c5a059' : frame.color || '#c5a059';
    ctx.strokeStyle = accent;
    ctx.lineWidth = 3;
    strokeRoundedRect(ctx, 16, 16, canvas.width - 32, canvas.height - 32, 8);
    ctx.lineWidth = 1;
    ctx.strokeStyle = `${accent}66`;
    strokeRoundedRect(ctx, 22, 22, canvas.width - 44, canvas.height - 44, 6);
    ctx.restore();
  }

  // Draw Caption, Date & Stamps in Footer
  if (footerH > 0) {
    ctx.save();
    const textColor = isWeddingTheme ? '#292524' : frame.textColor || '#0f172a';
    ctx.fillStyle = textColor;
    const textBaseY = canvas.height - Math.round(footerH * 0.42);

    const displayCaption = isWeddingTheme && weddingNames ? weddingNames : caption;

    if (displayCaption && dateStr) {
      ctx.font = isWeddingTheme
        ? 'italic bold 32px "Playfair Display", Georgia, serif'
        : 'bold 30px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'left';
      ctx.fillText(displayCaption, padX, textBaseY);

      ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'right';
      ctx.fillStyle = `${textColor}bb`;
      ctx.fillText(`${stamp ? stamp + ' ' : ''}${dateStr}`, canvas.width - padX, textBaseY);
    } else if (displayCaption) {
      ctx.font = isWeddingTheme
        ? 'italic bold 32px "Playfair Display", Georgia, serif'
        : 'bold 30px "Playfair Display", Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${displayCaption} ${stamp || ''}`, canvas.width / 2, textBaseY);
    } else if (dateStr) {
      ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${stamp ? stamp + ' ' : ''}${dateStr}`, canvas.width / 2, textBaseY);
    }

    ctx.restore();
  }

  return canvas.toDataURL(format, quality);
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

function strokeRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  drawRoundedRectPath(ctx, x, y, w, h, r);
  ctx.closePath();
  ctx.stroke();
}
