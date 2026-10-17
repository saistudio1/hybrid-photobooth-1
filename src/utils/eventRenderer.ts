import { EventConfig, EventLayout } from '../types/photobooth';

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image: ' + src.slice(0, 40)));
    img.src = src;
  });
}

export interface EventRenderOptions {
  photos: string[];
  event: EventConfig;
  filter?: string;
}

export async function renderEventPhotostrip(opts: EventRenderOptions): Promise<string> {
  const { photos: photoSrcs, event, filter = 'none' } = opts;
  if (!photoSrcs.length) throw new Error('No photos captured to render');

  const loadedPhotos = await Promise.all(photoSrcs.map(loadImage));

  // Determine canvas dimensions based on event layout
  let width = 800;
  let height = 2400; // standard strip

  if (event.layoutType === 'grid-2x2') {
    width = 1000;
    height = 1250;
  } else if (event.layoutType === 'single') {
    width = 1200;
    height = 1600;
  } else if (event.layoutType === 'strip-3') {
    width = 800;
    height = 2000;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas 2D context');

  // Background
  ctx.fillStyle = '#0f0f12';
  ctx.fillRect(0, 0, width, height);

  // Subtle interior background
  const interiorGrad = ctx.createLinearGradient(0, 0, width, height);
  interiorGrad.addColorStop(0, '#1c1917');
  interiorGrad.addColorStop(1, '#0c0a09');
  ctx.fillStyle = interiorGrad;
  ctx.fillRect(0, 0, width, height);

  // Calculate photo placement areas
  const photoRects: { x: number; y: number; w: number; h: number }[] = [];

  if (event.layoutType === 'single') {
    const pad = 60;
    const headerH = 140;
    const footerH = 160;
    photoRects.push({
      x: pad,
      y: pad + headerH,
      w: width - pad * 2,
      h: height - pad * 2 - headerH - footerH,
    });
  } else if (event.layoutType === 'grid-2x2') {
    const pad = 50;
    const headerH = 110;
    const footerH = 120;
    const gap = 20;
    const w = (width - pad * 2 - gap) / 2;
    const h = Math.round(w * 0.75);
    photoRects.push(
      { x: pad, y: pad + headerH, w, h },
      { x: pad + w + gap, y: pad + headerH, w, h },
      { x: pad, y: pad + headerH + h + gap, w, h },
      { x: pad + w + gap, y: pad + headerH + h + gap, w, h }
    );
  } else {
    // strip-3 or strip-4
    const count = event.layoutType === 'strip-3' ? 3 : 4;
    const pad = 44;
    const headerH = 150;
    const footerH = 160;
    const gap = 22;
    const totalAvailH = height - pad * 2 - headerH - footerH - gap * (count - 1);
    const photoH = Math.round(totalAvailH / count);
    const photoW = width - pad * 2;

    let curY = pad + headerH;
    for (let i = 0; i < count; i++) {
      photoRects.push({
        x: pad,
        y: curY,
        w: photoW,
        h: photoH,
      });
      curY += photoH + gap;
    }
  }

  // Draw photos underneath
  loadedPhotos.forEach((img, idx) => {
    const rect = photoRects[idx];
    if (!rect) return;

    ctx.save();
    // Rounded corner clip
    const r = 16;
    ctx.beginPath();
    ctx.moveTo(rect.x + r, rect.y);
    ctx.arcTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + rect.h, r);
    ctx.arcTo(rect.x + rect.w, rect.y + rect.h, rect.x, rect.y + rect.h, r);
    ctx.arcTo(rect.x, rect.y + rect.h, rect.x, rect.y, r);
    ctx.arcTo(rect.x, rect.y, rect.x + rect.w, rect.y, r);
    ctx.closePath();
    ctx.clip();

    // Filter
    if (filter && filter !== 'none') {
      ctx.filter = filter;
    }

    // Cover-fit crop
    const imgAspect = img.width / img.height;
    const targetAspect = rect.w / rect.h;
    let drawW = rect.w;
    let drawH = rect.h;
    let offX = 0;
    let offY = 0;

    if (imgAspect > targetAspect) {
      drawW = rect.h * imgAspect;
      offX = -(drawW - rect.w) / 2;
    } else {
      drawH = rect.w / imgAspect;
      offY = -(drawH - rect.h) / 2;
    }

    ctx.drawImage(img, rect.x + offX, rect.y + offY, drawW, drawH);
    ctx.restore();

    // Subtle border
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
    ctx.restore();
  });

  // If transparent PNG frame overlay exists, composite it right over the photos!
  if (event.framePngUrl) {
    try {
      const overlayImg = await loadImage(event.framePngUrl);
      ctx.save();
      // Draw transparent PNG overlay keeping full transparency
      ctx.drawImage(overlayImg, 0, 0, width, height);
      ctx.restore();
    } catch (e) {
      console.warn('Failed to load event frame overlay, falling back to dynamic typography:', e);
    }
  }

  // Draw Event branding typography (Header & Footer) if no full custom overlay replaced it
  ctx.save();
  ctx.fillStyle = event.primaryColor || '#ffffff';
  ctx.textAlign = 'center';

  // Event Header (top)
  if (!event.framePngUrl) {
    ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
    ctx.fillText(event.name.toUpperCase(), width / 2, 75);

    ctx.font = '500 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillStyle = '#f4f4f5';
    ctx.letterSpacing = '0.15em';
    ctx.fillText(event.subtitle || 'SPECIAL EVENT PHOTOBOOTH', width / 2, 115);

    // Event Footer (bottom)
    const footY = height - 80;
    ctx.fillStyle = event.primaryColor || '#ffffff';
    ctx.font = '600 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(event.date || '', width / 2, footY);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.65)';
    ctx.font = '400 15px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(event.footerText || 'MEMORY KEEPER', width / 2, footY + 32);
  }
  ctx.restore();

  return canvas.toDataURL('image/jpeg', 0.94);
}
