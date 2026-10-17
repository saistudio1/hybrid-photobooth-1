function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = src;
  });
}

export interface GeneralRenderOptions {
  photo: string;
  dateStr: string;
  filter?: string;
  caption?: string;
}

export async function renderGeneralPhoto(opts: GeneralRenderOptions): Promise<string> {
  const { photo, dateStr, filter = 'none', caption = 'SAI STUDIO' } = opts;
  const img = await loadImage(photo);

  // Modern clean photo card (1200 x 1500)
  const width = 1200;
  const height = 1500;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  // Clean white card background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Photo frame dimensions (Polaroid / Minimalist gallery card)
  const pad = 60;
  const photoW = width - pad * 2;
  const photoH = 1180;

  ctx.save();
  // Clip rounded photo
  const r = 8;
  ctx.beginPath();
  ctx.moveTo(pad + r, pad);
  ctx.arcTo(pad + photoW, pad, pad + photoW, pad + photoH, r);
  ctx.arcTo(pad + photoW, pad + photoH, pad, pad + photoH, r);
  ctx.arcTo(pad, pad + photoH, pad, pad, r);
  ctx.arcTo(pad, pad, pad + photoW, pad, r);
  ctx.closePath();
  ctx.clip();

  if (filter && filter !== 'none') {
    ctx.filter = filter;
  }

  // Cover image
  const imgAspect = img.width / img.height;
  const targetAspect = photoW / photoH;
  let drawW = photoW;
  let drawH = photoH;
  let offX = 0;
  let offY = 0;

  if (imgAspect > targetAspect) {
    drawW = photoH * imgAspect;
    offX = -(drawW - photoW) / 2;
  } else {
    drawH = photoW / imgAspect;
    offY = -(drawH - photoH) / 2;
  }

  ctx.drawImage(img, pad + offX, pad + offY, drawW, drawH);
  ctx.restore();

  // Subtle photo border
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.lineWidth = 2;
  ctx.strokeRect(pad, pad, photoW, photoH);

  // Minimalist Footer
  ctx.fillStyle = '#0f172a';
  ctx.textAlign = 'left';
  ctx.font = 'bold 36px "Playfair Display", serif';
  ctx.fillText(caption, pad, height - 120);

  ctx.fillStyle = '#64748b';
  ctx.font = '500 20px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText(dateStr, width - pad, height - 120);

  return canvas.toDataURL('image/jpeg', 0.94);
}
