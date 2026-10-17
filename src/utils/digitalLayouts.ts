import { DigitalLayoutDef, DigitalLayoutId, SlotRect } from '../types/photobooth';

export const DIGITAL_LAYOUTS: DigitalLayoutDef[] = [
  // 1 FOTO
  {
    id: 'digital_1_full',
    photoCount: 1,
    name: 'Single Full',
    badge: '1 Foto',
    desc: 'Satu foto utama proporsional memenuhi kanvas',
  },

  // 2 FOTO
  {
    id: 'digital_2_split_v',
    photoCount: 2,
    name: 'Berdampingan (2 Kolom)',
    badge: '2 Foto',
    desc: 'Dua foto sejajar kiri dan kanan',
  },
  {
    id: 'digital_2_split_h',
    photoCount: 2,
    name: 'Atas Bawah (2 Baris)',
    badge: '2 Foto',
    desc: 'Dua foto bertumpuk atas dan bawah',
  },

  // 3 FOTO
  {
    id: 'digital_3_strip',
    photoCount: 3,
    name: 'Photo Strip (3 Foto)',
    badge: '3 Foto',
    desc: 'Tiga foto vertikal berukuran sama gaya strip',
  },
  {
    id: 'digital_3_hero_top',
    photoCount: 3,
    name: '1 Hero Atas + 2 Bawah',
    badge: '3 Foto',
    desc: 'Satu foto besar di atas dan 2 foto pendukung di bawah',
  },
  {
    id: 'digital_3_hero_left',
    photoCount: 3,
    name: '1 Hero Kiri + 2 Kanan',
    badge: '3 Foto',
    desc: 'Satu foto vertikal di kiri dan 2 foto di kanan',
  },

  // 4 FOTO
  {
    id: 'digital_4_grid',
    photoCount: 4,
    name: 'Grid 2×2',
    badge: '4 Foto',
    desc: 'Empat foto simetris dalam formasi 2 baris 2 kolom',
  },
  {
    id: 'digital_4_strip',
    photoCount: 4,
    name: 'Vertical Strip 4',
    badge: '4 Foto',
    desc: 'Empat foto vertikal berurutan dari atas ke bawah',
  },
  {
    id: 'digital_4_hero',
    photoCount: 4,
    name: '1 Hero + 3 Baris Bawah',
    badge: '4 Foto',
    desc: 'Satu foto utama di atas dengan 3 foto mini di bawah',
  },

  // 5 FOTO
  {
    id: 'digital_5_hero_grid',
    photoCount: 5,
    name: '1 Hero Atas + 4 Grid',
    badge: '5 Foto',
    desc: 'Satu foto utama lanskap dengan 4 foto 2×2 di bawah',
  },
  {
    id: 'digital_5_strip',
    photoCount: 5,
    name: 'Vertical Strip 5',
    badge: '5 Foto',
    desc: 'Lima foto vertikal bertumpuk gaya photobooth strip panjang',
  },
  {
    id: 'digital_5_collage',
    photoCount: 5,
    name: 'Kolase 2 Atas + 3 Bawah',
    badge: '5 Foto',
    desc: 'Dua foto di baris atas dan tiga foto di baris bawah',
  },
];

export function getDigitalLayoutsByCount(count: number): DigitalLayoutDef[] {
  return DIGITAL_LAYOUTS.filter((l) => l.photoCount === count);
}

export function getDigitalLayoutById(id: DigitalLayoutId): DigitalLayoutDef {
  return DIGITAL_LAYOUTS.find((l) => l.id === id) || DIGITAL_LAYOUTS[0];
}

/**
 * Calculates slot coordinates for a given layout on a canvas of width x height
 */
export function calculateDigitalSlots(
  layoutId: DigitalLayoutId,
  canvasW: number,
  canvasH: number,
  padX: number,
  padY: number,
  gap: number,
  footerH: number,
  slotRadius: number
): SlotRect[] {
  const contentW = Math.max(10, canvasW - padX * 2);
  const contentH = Math.max(10, canvasH - padY * 2 - footerH);

  switch (layoutId) {
    case 'digital_1_full':
      return [
        {
          index: 0,
          x: padX,
          y: padY,
          width: contentW,
          height: contentH,
          radius: slotRadius,
        },
      ];

    case 'digital_2_split_v': {
      const colW = (contentW - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: colW, height: contentH, radius: slotRadius },
        { index: 1, x: padX + colW + gap, y: padY, width: colW, height: contentH, radius: slotRadius },
      ];
    }

    case 'digital_2_split_h': {
      const rowH = (contentH - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: rowH, radius: slotRadius },
        { index: 1, x: padX, y: padY + rowH + gap, width: contentW, height: rowH, radius: slotRadius },
      ];
    }

    case 'digital_3_strip': {
      const rowH = (contentH - gap * 2) / 3;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: rowH, radius: slotRadius },
        { index: 1, x: padX, y: padY + rowH + gap, width: contentW, height: rowH, radius: slotRadius },
        { index: 2, x: padX, y: padY + (rowH + gap) * 2, width: contentW, height: rowH, radius: slotRadius },
      ];
    }

    case 'digital_3_hero_top': {
      const topH = Math.round((contentH - gap) * 0.58);
      const botH = contentH - gap - topH;
      const botW = (contentW - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: topH, radius: slotRadius },
        { index: 1, x: padX, y: padY + topH + gap, width: botW, height: botH, radius: slotRadius },
        { index: 2, x: padX + botW + gap, y: padY + topH + gap, width: botW, height: botH, radius: slotRadius },
      ];
    }

    case 'digital_3_hero_left': {
      const leftW = Math.round((contentW - gap) * 0.58);
      const rightW = contentW - gap - leftW;
      const rightRowH = (contentH - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: leftW, height: contentH, radius: slotRadius },
        { index: 1, x: padX + leftW + gap, y: padY, width: rightW, height: rightRowH, radius: slotRadius },
        { index: 2, x: padX + leftW + gap, y: padY + rightRowH + gap, width: rightW, height: rightRowH, radius: slotRadius },
      ];
    }

    case 'digital_4_grid': {
      const colW = (contentW - gap) / 2;
      const rowH = (contentH - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: colW, height: rowH, radius: slotRadius },
        { index: 1, x: padX + colW + gap, y: padY, width: colW, height: rowH, radius: slotRadius },
        { index: 2, x: padX, y: padY + rowH + gap, width: colW, height: rowH, radius: slotRadius },
        { index: 3, x: padX + colW + gap, y: padY + rowH + gap, width: colW, height: rowH, radius: slotRadius },
      ];
    }

    case 'digital_4_strip': {
      const rowH = (contentH - gap * 3) / 4;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: rowH, radius: slotRadius },
        { index: 1, x: padX, y: padY + rowH + gap, width: contentW, height: rowH, radius: slotRadius },
        { index: 2, x: padX, y: padY + (rowH + gap) * 2, width: contentW, height: rowH, radius: slotRadius },
        { index: 3, x: padX, y: padY + (rowH + gap) * 3, width: contentW, height: rowH, radius: slotRadius },
      ];
    }

    case 'digital_4_hero': {
      const topH = Math.round((contentH - gap) * 0.60);
      const botH = contentH - gap - topH;
      const colW = (contentW - gap * 2) / 3;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: topH, radius: slotRadius },
        { index: 1, x: padX, y: padY + topH + gap, width: colW, height: botH, radius: slotRadius },
        { index: 2, x: padX + colW + gap, y: padY + topH + gap, width: colW, height: botH, radius: slotRadius },
        { index: 3, x: padX + (colW + gap) * 2, y: padY + topH + gap, width: colW, height: botH, radius: slotRadius },
      ];
    }

    case 'digital_5_hero_grid': {
      const topH = Math.round((contentH - gap) * 0.48);
      const botH = contentH - gap - topH;
      const botColW = (contentW - gap) / 2;
      const botRowH = (botH - gap) / 2;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: topH, radius: slotRadius },
        { index: 1, x: padX, y: padY + topH + gap, width: botColW, height: botRowH, radius: slotRadius },
        { index: 2, x: padX + botColW + gap, y: padY + topH + gap, width: botColW, height: botRowH, radius: slotRadius },
        { index: 3, x: padX, y: padY + topH + gap + botRowH + gap, width: botColW, height: botRowH, radius: slotRadius },
        { index: 4, x: padX + botColW + gap, y: padY + topH + gap + botRowH + gap, width: botColW, height: botRowH, radius: slotRadius },
      ];
    }

    case 'digital_5_strip': {
      const rowH = (contentH - gap * 4) / 5;
      return [
        { index: 0, x: padX, y: padY, width: contentW, height: rowH, radius: slotRadius },
        { index: 1, x: padX, y: padY + rowH + gap, width: contentW, height: rowH, radius: slotRadius },
        { index: 2, x: padX, y: padY + (rowH + gap) * 2, width: contentW, height: rowH, radius: slotRadius },
        { index: 3, x: padX, y: padY + (rowH + gap) * 3, width: contentW, height: rowH, radius: slotRadius },
        { index: 4, x: padX, y: padY + (rowH + gap) * 4, width: contentW, height: rowH, radius: slotRadius },
      ];
    }

    case 'digital_5_collage': {
      const rowH = (contentH - gap) / 2;
      const topW = (contentW - gap) / 2;
      const botW = (contentW - gap * 2) / 3;
      return [
        { index: 0, x: padX, y: padY, width: topW, height: rowH, radius: slotRadius },
        { index: 1, x: padX + topW + gap, y: padY, width: topW, height: rowH, radius: slotRadius },
        { index: 2, x: padX, y: padY + rowH + gap, width: botW, height: rowH, radius: slotRadius },
        { index: 3, x: padX + botW + gap, y: padY + rowH + gap, width: botW, height: rowH, radius: slotRadius },
        { index: 4, x: padX + (botW + gap) * 2, y: padY + rowH + gap, width: botW, height: rowH, radius: slotRadius },
      ];
    }

    default:
      return [
        {
          index: 0,
          x: padX,
          y: padY,
          width: contentW,
          height: contentH,
          radius: slotRadius,
        },
      ];
  }
}
