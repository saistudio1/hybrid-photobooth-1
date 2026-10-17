export type AppMode = 'general' | 'kiosk' | 'event';

export type EventLayout = 'single' | 'strip-3' | 'strip-4' | 'grid-2x2' | 'overlay-custom';

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
  framePngUrl?: string; // Transparent PNG overlay URL or data URI
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
  events: EventConfig[];
  themes: ThemeConfig[];
}
