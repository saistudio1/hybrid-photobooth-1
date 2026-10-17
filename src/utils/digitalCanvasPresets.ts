import { DigitalCanvasPreset } from '../types/photobooth';

export const DIGITAL_CANVAS_PRESETS: DigitalCanvasPreset[] = [
  // INSTAGRAM
  {
    id: 'ig-portrait',
    name: 'Instagram Post Portrait',
    category: 'instagram',
    width: 1080,
    height: 1350,
    ratioText: '4:5',
    badge: 'Popular IG',
    description: 'Format feed paling optimal & menarik perhatian di Instagram',
  },
  {
    id: 'ig-square',
    name: 'Instagram Square Post',
    category: 'instagram',
    width: 1080,
    height: 1080,
    ratioText: '1:1',
    badge: 'Classic Square',
    description: 'Format kotak klasik Instagram feed',
  },
  {
    id: 'ig-story',
    name: 'Instagram Story',
    category: 'instagram',
    width: 1080,
    height: 1920,
    ratioText: '9:16',
    badge: 'Story/Reels',
    description: 'Layar penuh vertikal untuk IG Story',
  },
  {
    id: 'ig-reels-cover',
    name: 'Instagram/Reels Cover',
    category: 'instagram',
    width: 1080,
    height: 1920,
    ratioText: '9:16',
    badge: 'Cover Reels',
    description: 'Cover thumbnail reels & video vertikal',
  },

  // SOCIAL MEDIA LAINNYA
  {
    id: 'tiktok-vertical',
    name: 'TikTok / Story Vertical',
    category: 'social',
    width: 1080,
    height: 1920,
    ratioText: '9:16',
    badge: 'TikTok',
    description: 'Format vertikal video & photo post TikTok',
  },
  {
    id: 'fb-post',
    name: 'Facebook Post Portrait',
    category: 'social',
    width: 1200,
    height: 1500,
    ratioText: '4:5',
    badge: 'Facebook',
    description: 'Foto vertikal feed Facebook resolusi tinggi',
  },
  {
    id: 'fb-landscape',
    name: 'Facebook Landscape',
    category: 'social',
    width: 1200,
    height: 630,
    ratioText: '1.91:1',
    badge: 'Banner FB',
    description: 'Format horizontal landscape feed atau link preview',
  },
  {
    id: 'wa-status',
    name: 'WhatsApp Status',
    category: 'social',
    width: 1080,
    height: 1920,
    ratioText: '9:16',
    badge: 'WA Status',
    description: 'Vertikal jernih untuk status WhatsApp & Telegram',
  },
  {
    id: 'square-digital',
    name: 'Square Digital Photo',
    category: 'social',
    width: 1080,
    height: 1080,
    ratioText: '1:1',
    badge: 'Avatar/Square',
    description: 'Foto profil dan album digital',
  },
];

export const DEFAULT_DIGITAL_PRESET = DIGITAL_CANVAS_PRESETS[0]; // 1080 x 1350 (4:5)

export function getDigitalPresetById(id: string): DigitalCanvasPreset | undefined {
  return DIGITAL_CANVAS_PRESETS.find((p) => p.id === id);
}
