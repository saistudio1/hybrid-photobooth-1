export type AppMode = 'lite' | 'kiosk' | 'event' | 'general';

export type EventLayout = 'single' | 'strip-3' | 'strip-4' | 'grid-2x2' | 'overlay-custom';

export type Layout4R =
  | 'double_strip_4r' // 1 sheet 4R contains 2 twin vertical strips (2x6" each) with cut line
  | 'single_strip_4r' // 1 centered vertical photostrip on 4R
  | 'grid_2x2_4r'     // 4 photos in 2x2 grid
  | 'collage_3_4r'    // 1 featured photo + 2 companion photos
  | 'single_4r';      // 1 single full 4R photo

export type DigitalCanvasCategory = 'instagram' | 'social' | 'custom';

export interface DigitalCanvasPreset {
  id: string;
  name: string;
  category: DigitalCanvasCategory;
  width: number;
  height: number;
  ratioText: string;
  badge?: string;
  description: string;
}

export type DigitalFitMode = 'cover' | 'contain';

export type DigitalLayoutId =
  // 1 Foto
  | 'digital_1_full'
  // 2 Foto
  | 'digital_2_split_v'   // Side-by-side (2 columns)
  | 'digital_2_split_h'   // Top and bottom (2 rows)
  // 3 Foto
  | 'digital_3_strip'     // Vertical strip of 3
  | 'digital_3_hero_top'  // 1 hero top + 2 bottom side-by-side
  | 'digital_3_hero_left' // 1 hero left + 2 right stacked
  // 4 Foto
  | 'digital_4_grid'      // 2x2 grid
  | 'digital_4_strip'     // Vertical strip of 4
  | 'digital_4_hero'      // 1 hero top + 3 bottom horizontal
  // 5 Foto
  | 'digital_5_hero_grid' // 1 large hero top + 4 bottom grid (2x2)
  | 'digital_5_strip'     // Vertical strip of 5
  | 'digital_5_collage';  // 2 top + 3 bottom

export interface SlotRect {
  index: number;
  x: number;
  y: number;
  width: number;
  height: number;
  radius?: number;
}

export interface DigitalLayoutDef {
  id: DigitalLayoutId;
  photoCount: number; // 1 | 2 | 3 | 4 | 5
  name: string;
  badge: string;
  desc: string;
  previewIcon?: string;
}

export type FilterCategory = 'natural' | 'vintage' | 'monochrome' | 'aesthetic' | 'dramatic' | 'wedding';

export interface FilterDef {
  id: string;
  name: string;
  category: FilterCategory;
  cssFilter: string;
  description?: string;
}

export type FrameStyle =
  | 'solid'
  | 'thin'
  | 'thick'
  | 'rounded'
  | 'double_line'
  | 'minimalist'
  | 'polaroid'
  | 'wedding_minimalist'
  | 'none';

export interface FrameCustomization {
  style: FrameStyle;
  color: string;
  bgColor: string;
  textColor: string;
  thickness: number; // 0 to 40 px
  padding: number;   // 0 to 60 px
  radius: number;    // 0 to 32 px
  gap?: number;      // gap between photos (0 to 30 px)
  margin?: number;   // outer margin (0 to 60 px)
}

export interface ThemeConfig {
  id: string;
  name: string;
  bgGradient: string;
  panelBg: string;
  accentColor: string;
  accentGradient: string;
  textColor: string;
  fontFamily: 'sans' | 'serif';
  isDark: boolean;
}

export interface WeddingConfig {
  coupleNames: string;
  weddingDate: string;
  accentColor: string; // e.g. '#c5a059' (Champagne Gold), '#d48c96' (Dusty Rose), '#b59a79' (Beige)
  ornament: 'floral' | 'rings' | 'monogram' | 'minimal';
  subtext: string; // e.g. 'The Wedding of' or 'Together Forever'
  venueText?: string; // e.g. 'Grand Ballroom Jakarta'
}

export interface GeneralSettings {
  appName: string;
  appSubtitle: string;
  cameraCountdown: number;
  mirrorCamera: boolean;
  soundEnabled: boolean;
  themeId: string;
}

export interface KioskSettings {
  welcomeTitle: string;
  welcomeSubtitle: string;
  startButtonText: string;
  countdownDuration: number;
  autoResetTimeoutSeconds: number;
  enableAutoReset: boolean;
  themeId: string;
  showQRIS: boolean;
  allowFilterSelection: boolean;
  allowFrameCustomization: boolean;
  defaultLayout4R: Layout4R;
}

export interface EventConfig {
  id: string;
  name: string;
  subtitle: string;
  date: string;
  welcomeHeadline: string;
  welcomeSubheadline: string;
  footerText: string;
  logoUrl?: string;
  framePngUrl?: string;
  photoCount: number;
  layoutType: EventLayout;
  primaryColor: string;
  themeId: string;
  createdAt: number;
}

export interface AppSettings {
  activeMode: AppMode;
  general: GeneralSettings;
  kiosk: KioskSettings;
  activeEventId: string;
  wedding: WeddingConfig;
  events: EventConfig[];
  themes: ThemeConfig[];
}
