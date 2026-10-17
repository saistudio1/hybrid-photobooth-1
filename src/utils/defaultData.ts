import { AppSettings, ThemeConfig, EventConfig } from '../types/photobooth';

export const THEME_PRESETS: ThemeConfig[] = [
  {
    id: 'midnight-glow',
    name: 'Midnight Studio (Dark)',
    bgGradient: 'from-neutral-950 via-neutral-900 to-black',
    panelBg: 'rgba(23, 23, 23, 0.72)',
    accentColor: '#f43f5e',
    accentGradient: 'from-rose-500 via-purple-500 to-indigo-600',
    textColor: '#f4f4f5',
    fontFamily: 'sans',
    isDark: true,
  },
  {
    id: 'minimal-light',
    name: 'Clean Gallery (Light)',
    bgGradient: 'from-slate-100 via-white to-slate-200',
    panelBg: 'rgba(255, 255, 255, 0.85)',
    accentColor: '#0ea5e9',
    accentGradient: 'from-sky-500 via-blue-600 to-indigo-600',
    textColor: '#0f172a',
    fontFamily: 'sans',
    isDark: false,
  },
  {
    id: 'royal-gold',
    name: 'Royal Champagne & Gold',
    bgGradient: 'from-neutral-950 via-stone-900 to-neutral-950',
    panelBg: 'rgba(28, 25, 23, 0.82)',
    accentColor: '#eab308',
    accentGradient: 'from-amber-400 via-yellow-500 to-amber-600',
    textColor: '#fef08a',
    fontFamily: 'serif',
    isDark: true,
  },
  {
    id: 'pastel-blush',
    name: 'Pastel Sakura & Cream',
    bgGradient: 'from-pink-50 via-rose-50 to-amber-50',
    panelBg: 'rgba(255, 255, 255, 0.9)',
    accentColor: '#ec4899',
    accentGradient: 'from-pink-400 via-rose-400 to-red-400',
    textColor: '#831843',
    fontFamily: 'serif',
    isDark: false,
  },
  {
    id: 'cyber-neon',
    name: 'Cyberpunk Neon',
    bgGradient: 'from-slate-950 via-purple-950 to-neutral-950',
    panelBg: 'rgba(15, 23, 42, 0.82)',
    accentColor: '#06b6d4',
    accentGradient: 'from-cyan-400 via-fuchsia-500 to-purple-600',
    textColor: '#e0f2fe',
    fontFamily: 'sans',
    isDark: true,
  },
];

/** Generate sample transparent PNG frame overlay for Wedding */
export function generateSampleWeddingOverlay(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 800;
  canvas.height = 2400;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Clear with 100% transparent alpha
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Elegant golden border frame around the outer edge
  ctx.strokeStyle = '#d4af37';
  ctx.lineWidth = 14;
  ctx.strokeRect(16, 16, canvas.width - 32, canvas.height - 32);

  ctx.strokeStyle = '#fef08a';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 30, canvas.width - 60, canvas.height - 60);

  // Top Wedding Header in Gold Foil
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.font = 'bold 36px "Playfair Display", Georgia, serif';
  ctx.fillText('THE WEDDING OF', canvas.width / 2, 85);

  ctx.fillStyle = '#fef08a';
  ctx.font = 'italic 52px "Playfair Display", Georgia, serif';
  ctx.fillText('Sarah & Dimas', canvas.width / 2, 145);

  // Decorative corner floral ornaments
  ctx.font = '40px serif';
  ctx.fillText('✨ 🕊️ ✨', canvas.width / 2, 195);

  // Footer Wedding Details
  const footerY = 2240;
  ctx.fillStyle = '#fef08a';
  ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('14 OCTOBER 2026', canvas.width / 2, footerY);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'italic 28px "Playfair Display", Georgia, serif';
  ctx.fillText('#SarahDimasForever', canvas.width / 2, footerY + 45);

  return canvas.toDataURL('image/png');
}

/** Generate sample transparent PNG frame overlay for Tech Summit */
export function generateSampleTechOverlay(): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 1250;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Modern tech grid neon frame
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 8;
  ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);

  // Top Banner
  ctx.fillStyle = '#38bdf8';
  ctx.font = '900 36px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('SAI TECH SUMMIT 2026', canvas.width / 2, 70);

  ctx.fillStyle = '#a855f7';
  ctx.font = '600 18px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('INNOVATION & FUTURE INTELLIGENCE', canvas.width / 2, 102);

  // Footer Banner
  ctx.fillStyle = '#ffffff';
  ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('JAKARTA INTERNATIONAL EXPO', canvas.width / 2, 1180);

  ctx.fillStyle = '#38bdf8';
  ctx.font = '500 16px monospace';
  ctx.fillText('OFFICIAL ATTENDEE PHOTOBOOTH · PASS #8492', canvas.width / 2, 1210);

  return canvas.toDataURL('image/png');
}

export const DEFAULT_EVENTS: EventConfig[] = [
  {
    id: 'event-wedding-sarah-dimas',
    name: 'Wedding of Sarah & Dimas',
    subtitle: 'Grand Ballroom Hotel Mulia Jakarta',
    date: '14/10/2026',
    welcomeHeadline: 'Welcome to the Wedding of',
    welcomeSubheadline: 'Sarah & Dimas · Capture your happiest moments!',
    footerText: '#SarahDimasForever · Thank you for celebrating with us',
    photoCount: 3,
    layoutType: 'strip-3',
    primaryColor: '#eab308',
    themeId: 'royal-gold',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'event-tech-summit',
    name: 'SAI Tech Summit 2026',
    subtitle: 'Innovation Stage & Exhibition Hall',
    date: '20/11/2026',
    welcomeHeadline: 'SAI Tech Summit 2026',
    welcomeSubheadline: 'Take your VIP Attendee badge photostrip!',
    footerText: 'Powered by SAI Studio Booth · Jakarta Expo',
    photoCount: 4,
    layoutType: 'grid-2x2',
    primaryColor: '#06b6d4',
    themeId: 'cyber-neon',
    createdAt: Date.now() - 43200000,
  },
  {
    id: 'event-sweet-seventeen',
    name: 'Sweet 17th of Michelle',
    subtitle: 'Glitz & Glam Party Night',
    date: '05/12/2026',
    welcomeHeadline: 'Michelle is Turning 17! 💖',
    welcomeSubheadline: 'Pose with your besties and grab your photostrip',
    footerText: 'Best Night Ever · #MichelleSweet17',
    photoCount: 4,
    layoutType: 'strip-4',
    primaryColor: '#ec4899',
    themeId: 'pastel-blush',
    createdAt: Date.now(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  activeMode: 'kiosk',
  general: {
    appName: 'SAI Studio',
    appSubtitle: 'Hybrid Photobooth System',
    cameraCountdown: 3,
    mirrorCamera: true,
    soundEnabled: true,
    themeId: 'midnight-glow',
  },
  kiosk: {
    welcomeTitle: 'Haii... Abadikan momentmu yuk!',
    welcomeSubtitle: 'Siapkan pose terbaikmu dan buat photostrip estetik yang bisa kamu bawa pulang.',
    startButtonText: 'Mulai Sesi Foto',
    countdownDuration: 3,
    autoResetTimeoutSeconds: 60,
    enableAutoReset: true,
    themeId: 'midnight-glow',
    showQRIS: true,
    allowFilterSelection: true,
    allowFrameCustomization: true,
  },
  activeEventId: 'event-wedding-sarah-dimas',
  events: DEFAULT_EVENTS,
  themes: THEME_PRESETS,
};
