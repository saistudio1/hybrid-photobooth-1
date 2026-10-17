export type LayoutType = 'strip' | 'grid' | 'bookmark' | 'double_strip';
export type FilterType = 'normal' | 'bw' | 'sepia' | 'warm' | 'cool' | 'film' | 'glow';

export interface RenderOptions {
  photos: string[];
  layout: LayoutType;
  filter: FilterType;
  frameBgColor: string;
  frameTextColor: string;
  dateStr: string;
  customText?: string;
  stamp?: string;
  showWatermark?: boolean;
}

const FILTER_CANVAS_MAP: Record<FilterType, string> = {
  normal: 'none',
  bw: 'grayscale(100%) contrast(115%) brightness(98%)',
  sepia: 'sepia(70%) contrast(105%) brightness(95%)',
  warm: 'sepia(25%) saturate(140%) hue-rotate(-8deg) contrast(105%)',
  cool: 'contrast(115%) saturate(120%) hue-rotate(12deg) brightness(102%)',
  film: 'contrast(120%) brightness(105%) saturate(85%) sepia(15%)',
  glow: 'contrast(105%) brightness(112%) saturate(115%)',
};

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image for render'));
    img.src = src;
  });
}

export async function renderPhotostrip(opts: RenderOptions): Promise<string> {
  const {
    photos: photoSrcs,
    layout,
    filter,
    frameBgColor,
    frameTextColor,
    dateStr,
    customText = 'SAI STUDIO',
    stamp = '✨',
  } = opts;

  if (!photoSrcs.length) {
    throw new Error('No photos to render');
  }

  // Load all images
  const loadedImages = await Promise.all(photoSrcs.map(loadImage));

  // Determine canvas dimensions based on layout
  let width = 800;
  let height = 2400;

  if (layout === 'grid') {
    width = 1000;
    height = 1250;
  } else if (layout === 'bookmark') {
    width = 750;
    height = 2000;
  } else if (layout === 'double_strip') {
    width = 1550;
    height = 2400;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  // Fill Background
  ctx.fillStyle = frameBgColor;
  ctx.fillRect(0, 0, width, height);

  const filterString = FILTER_CANVAS_MAP[filter] || 'none';

  // Helper to draw single strip photos & texts
  const drawStripColumn = (
    startX: number,
    colWidth: number,
    photosToDraw: HTMLImageElement[],
    includeCutLine = false
  ) => {
    const pad = 44;
    const innerW = colWidth - pad * 2;
    const photoH = Math.round(innerW * 0.72); // 4:3 photo ratio
    const gap = 20;
    const headerH = 110;
    const footerH = 130;

    // Header Title
    ctx.save();
    ctx.fillStyle = frameTextColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Small pill or subtitle
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.3em';
    ctx.fillText('AESTHETIC PHOTO STUDIO', startX + colWidth / 2, pad + 24);

    // Main Studio Title
    ctx.font = 'bold 36px "Playfair Display", serif';
    ctx.letterSpacing = '0.05em';
    ctx.fillText(customText.toUpperCase() || 'SAI STUDIO', startX + colWidth / 2, pad + 64);
    ctx.restore();

    // Draw Photos
    let curY = pad + headerH;
    photosToDraw.forEach((img, i) => {
      ctx.save();
      // Rounded photo clip
      const r = 12;
      const x = startX + pad;
      const y = curY;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + innerW, y, x + innerW, y + photoH, r);
      ctx.arcTo(x + innerW, y + photoH, x, y + photoH, r);
      ctx.arcTo(x, y + photoH, x, y, r);
      ctx.arcTo(x, y, x + innerW, y, r);
      ctx.closePath();
      ctx.clip();

      // Apply Filter
      ctx.filter = filterString;

      // Draw photo with object-fit: cover center crop
      const imgAspect = img.width / img.height;
      const targetAspect = innerW / photoH;
      let drawW = innerW;
      let drawH = photoH;
      let offX = 0;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = photoH * imgAspect;
        offX = -(drawW - innerW) / 2;
      } else {
        drawH = innerW / imgAspect;
        offY = -(drawH - photoH) / 2;
      }

      ctx.drawImage(img, x + offX, y + offY, drawW, drawH);
      ctx.restore();

      // Subtle photo border
      ctx.save();
      ctx.strokeStyle = frameTextColor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + innerW, y, x + innerW, y + photoH, r);
      ctx.arcTo(x + innerW, y + photoH, x, y + photoH, r);
      ctx.arcTo(x, y + photoH, x, y, r);
      ctx.arcTo(x, y, x + innerW, y, r);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();

      curY += photoH + (i < photosToDraw.length - 1 ? gap : 0);
    });

    // Footer
    const footerY = curY + 28;
    ctx.save();
    ctx.fillStyle = frameTextColor;
    ctx.textAlign = 'center';

    // Stamp emoji or logo icon
    if (stamp) {
      ctx.font = '28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(stamp, startX + colWidth / 2, footerY + 14);
    }

    // Date
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.15em';
    ctx.fillText(dateStr, startX + colWidth / 2, footerY + 50);

    // Kiosk watermark
    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.25em';
    ctx.fillStyle = frameTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
    ctx.fillText('MEMORY KEEPER · SAI STUDIO', startX + colWidth / 2, footerY + 76);
    ctx.restore();

    // Dotted cutting line if double strip
    if (includeCutLine) {
      ctx.save();
      ctx.strokeStyle = frameTextColor === '#ffffff' ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 2;
      ctx.setLineDash([8, 8]);
      ctx.beginPath();
      ctx.moveTo(startX + colWidth, 40);
      ctx.lineTo(startX + colWidth, height - 40);
      ctx.stroke();

      // Scissor icon in middle
      ctx.fillStyle = frameTextColor;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✂', startX + colWidth, height / 2);
      ctx.restore();
    }
  };

  if (layout === 'strip' || layout === 'bookmark') {
    const photosToDraw = layout === 'bookmark' ? loadedImages.slice(0, 3) : loadedImages.slice(0, 4);
    drawStripColumn(0, width, photosToDraw);
  } else if (layout === 'double_strip') {
    const colW = Math.floor(width / 2);
    const photosToDraw = loadedImages.slice(0, 4);
    drawStripColumn(0, colW, photosToDraw, true);
    drawStripColumn(colW, colW, photosToDraw, false);
  } else if (layout === 'grid') {
    // 2x2 Grid Layout
    const pad = 50;
    const headerH = 100;
    const footerH = 110;
    const gap = 16;
    const availableW = width - pad * 2 - gap;
    const cellW = availableW / 2;
    const cellH = Math.round(cellW * 0.75);

    // Header
    ctx.save();
    ctx.fillStyle = frameTextColor;
    ctx.textAlign = 'center';
    ctx.font = '600 16px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.3em';
    ctx.fillText('AESTHETIC PHOTO STUDIO', width / 2, pad + 24);

    ctx.font = 'bold 40px "Playfair Display", serif';
    ctx.letterSpacing = '0.06em';
    ctx.fillText(customText.toUpperCase() || 'SAI STUDIO', width / 2, pad + 68);
    ctx.restore();

    // Draw 2x2 Photos
    const gridCoords = [
      { x: pad, y: pad + headerH },
      { x: pad + cellW + gap, y: pad + headerH },
      { x: pad, y: pad + headerH + cellH + gap },
      { x: pad + cellW + gap, y: pad + headerH + cellH + gap },
    ];

    loadedImages.slice(0, 4).forEach((img, i) => {
      const coord = gridCoords[i];
      if (!coord) return;
      const { x, y } = coord;
      const r = 12;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + cellW, y, x + cellW, y + cellH, r);
      ctx.arcTo(x + cellW, y + cellH, x, y + cellH, r);
      ctx.arcTo(x, y + cellH, x, y, r);
      ctx.arcTo(x, y, x + cellW, y, r);
      ctx.closePath();
      ctx.clip();

      ctx.filter = filterString;

      const imgAspect = img.width / img.height;
      const targetAspect = cellW / cellH;
      let drawW = cellW;
      let drawH = cellH;
      let offX = 0;
      let offY = 0;

      if (imgAspect > targetAspect) {
        drawW = cellH * imgAspect;
        offX = -(drawW - cellW) / 2;
      } else {
        drawH = cellW / imgAspect;
        offY = -(drawH - cellH) / 2;
      }

      ctx.drawImage(img, x + offX, y + offY, drawW, drawH);
      ctx.restore();

      // Border
      ctx.save();
      ctx.strokeStyle = frameTextColor === '#ffffff' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + cellW, y, x + cellW, y + cellH, r);
      ctx.arcTo(x + cellW, y + cellH, x, y + cellH, r);
      ctx.arcTo(x, y + cellH, x, y, r);
      ctx.arcTo(x, y, x + cellW, y, r);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    });

    // Footer
    const footerY = height - footerH;
    ctx.save();
    ctx.fillStyle = frameTextColor;
    ctx.textAlign = 'center';
    if (stamp) {
      ctx.font = '28px "Plus Jakarta Sans", sans-serif';
      ctx.fillText(stamp, width / 2, footerY + 20);
    }
    ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.15em';
    ctx.fillText(dateStr, width / 2, footerY + 54);

    ctx.font = '400 13px "Plus Jakarta Sans", sans-serif';
    ctx.letterSpacing = '0.25em';
    ctx.fillStyle = frameTextColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)';
    ctx.fillText('MEMORY KEEPER · SAI STUDIO', width / 2, footerY + 80);
    ctx.restore();
  }

  return canvas.toDataURL('image/jpeg', 0.94);
}
