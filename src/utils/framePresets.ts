import { FrameCustomization, FrameStyle } from '../types/photobooth';

export interface FrameColorPreset {
  name: string;
  hex: string;
  textColor: string;
  category?: 'basic' | 'pastel' | 'luxury';
}

export const FRAME_COLOR_PRESETS: FrameColorPreset[] = [
  { name: 'White', hex: '#ffffff', textColor: '#0f172a', category: 'basic' },
  { name: 'Ivory', hex: '#fdfbf7', textColor: '#292524', category: 'basic' },
  { name: 'Cream', hex: '#fef9ee', textColor: '#451a03', category: 'basic' },
  { name: 'Beige', hex: '#f5ebe0', textColor: '#44403c', category: 'basic' },
  { name: 'Black', hex: '#0f0f12', textColor: '#f8fafc', category: 'basic' },
  { name: 'Charcoal', hex: '#262626', textColor: '#f5f5f5', category: 'basic' },
  { name: 'Gray', hex: '#737373', textColor: '#ffffff', category: 'basic' },
  { name: 'Navy', hex: '#1e293b', textColor: '#f8fafc', category: 'basic' },
  { name: 'Sky Blue', hex: '#bae6fd', textColor: '#0c4a6e', category: 'pastel' },
  { name: 'Sage Green', hex: '#d1fae5', textColor: '#064e3b', category: 'pastel' },
  { name: 'Olive', hex: '#3f4f2c', textColor: '#f8fafc', category: 'basic' },
  { name: 'Dusty Pink', hex: '#fbcfe8', textColor: '#831843', category: 'pastel' },
  { name: 'Blush', hex: '#ffe4e6', textColor: '#9f1239', category: 'pastel' },
  { name: 'Peach', hex: '#ffedd5', textColor: '#7c2d12', category: 'pastel' },
  { name: 'Burgundy', hex: '#581c27', textColor: '#fff1f2', category: 'luxury' },
  { name: 'Lavender', hex: '#e9d5ff', textColor: '#581c87', category: 'pastel' },
  { name: 'Champagne Gold', hex: '#c5a059', textColor: '#1c1917', category: 'luxury' },
  { name: 'Silver', hex: '#e2e8f0', textColor: '#1e293b', category: 'luxury' },
];

export interface FrameStyleOption {
  id: FrameStyle;
  name: string;
  desc: string;
  defaultThickness: number;
  defaultPadding: number;
  defaultRadius: number;
}

export const FRAME_STYLES: FrameStyleOption[] = [
  {
    id: 'solid',
    name: 'Solid Border',
    desc: 'Bingkai standar klasik dengan ketebalan merata di sekeliling foto',
    defaultThickness: 16,
    defaultPadding: 12,
    defaultRadius: 10,
  },
  {
    id: 'thin',
    name: 'Thin Border',
    desc: 'Garis tepi halus dan minimalis',
    defaultThickness: 4,
    defaultPadding: 8,
    defaultRadius: 6,
  },
  {
    id: 'thick',
    name: 'Thick Border',
    desc: 'Bingkai tebal berani bergaya poster galeri seni',
    defaultThickness: 32,
    defaultPadding: 16,
    defaultRadius: 12,
  },
  {
    id: 'rounded',
    name: 'Rounded Frame',
    desc: 'Sudut melengkung manis dan modern',
    defaultThickness: 14,
    defaultPadding: 14,
    defaultRadius: 24,
  },
  {
    id: 'double_line',
    name: 'Double Line',
    desc: 'Garis ganda luar dan dalam berefek mewah',
    defaultThickness: 12,
    defaultPadding: 16,
    defaultRadius: 8,
  },
  {
    id: 'minimalist',
    name: 'Minimalist',
    desc: 'Ruang putih lapang dengan garis tepi sangat tipis',
    defaultThickness: 2,
    defaultPadding: 24,
    defaultRadius: 4,
  },
  {
    id: 'polaroid',
    name: 'Polaroid Style',
    desc: 'Bagian bawah lebih lebar untuk tulisan memo/judul',
    defaultThickness: 16,
    defaultPadding: 14,
    defaultRadius: 4,
  },
  {
    id: 'wedding_minimalist',
    name: 'Wedding Minimalist',
    desc: 'Kombinasi border ganda champagne gold dan ivory elegan',
    defaultThickness: 8,
    defaultPadding: 20,
    defaultRadius: 8,
  },
  {
    id: 'none',
    name: 'No Frame',
    desc: 'Foto penuh tanpa bingkai (Full Bleed)',
    defaultThickness: 0,
    defaultPadding: 0,
    defaultRadius: 0,
  },
];

export const WEDDING_FRAME_PRESETS = [
  {
    id: 'white_elegance',
    name: 'White Elegance',
    color: '#ffffff',
    accentColor: '#c5a059',
    textColor: '#1c1917',
    style: 'wedding_minimalist' as FrameStyle,
  },
  {
    id: 'ivory_beige',
    name: 'Ivory & Beige',
    color: '#fdfbf7',
    accentColor: '#b59a79',
    textColor: '#292524',
    style: 'wedding_minimalist' as FrameStyle,
  },
  {
    id: 'champagne_gold',
    name: 'Champagne Gold',
    color: '#fbf7ee',
    accentColor: '#c5a059',
    textColor: '#1c1917',
    style: 'double_line' as FrameStyle,
  },
  {
    id: 'dusty_rose',
    name: 'Dusty Rose',
    color: '#fdf2f4',
    accentColor: '#d48c96',
    textColor: '#831843',
    style: 'wedding_minimalist' as FrameStyle,
  },
  {
    id: 'minimal_bw',
    name: 'Minimal Black & White',
    color: '#ffffff',
    accentColor: '#171717',
    textColor: '#171717',
    style: 'minimalist' as FrameStyle,
  },
];

export const DEFAULT_FRAME_CUSTOMIZATION: FrameCustomization = {
  style: 'solid',
  color: '#ffffff',
  bgColor: '#ffffff',
  textColor: '#0f172a',
  thickness: 16,
  padding: 14,
  radius: 12,
};

/** Get contrasting text color based on hex brightness */
export function getAutoTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  if (hex.length < 6) return '#0f172a';
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // YIQ luminance formula
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 140 ? '#0f172a' : '#f8fafc';
}
