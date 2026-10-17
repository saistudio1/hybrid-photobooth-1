import { AppSettings, EventConfig, ThemeConfig } from '../types/photobooth';
import { DEFAULT_SETTINGS, generateSampleWeddingOverlay, generateSampleTechOverlay } from './defaultData';

const STORAGE_KEY = 'sai_photobooth_settings_v3';

export function loadSettings(): AppSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with sample overlays
      const initial = { ...DEFAULT_SETTINGS };
      try {
        const weddingOverlay = generateSampleWeddingOverlay();
        const techOverlay = generateSampleTechOverlay();
        if (weddingOverlay) {
          initial.events[0].framePngUrl = weddingOverlay;
        }
        if (techOverlay) {
          initial.events[1].framePngUrl = techOverlay;
        }
      } catch (e) {
        console.warn('Could not generate sample overlay in SSR/headless:', e);
      }
      saveSettings(initial);
      return initial;
    }
    const parsed = JSON.parse(raw) as AppSettings;
    // Merge safely with defaults to prevent missing fields
    return {
      ...DEFAULT_SETTINGS,
      ...parsed,
      general: { ...DEFAULT_SETTINGS.general, ...(parsed.general || {}) },
      kiosk: { ...DEFAULT_SETTINGS.kiosk, ...(parsed.kiosk || {}) },
      events: parsed.events && parsed.events.length > 0 ? parsed.events : DEFAULT_SETTINGS.events,
      themes: parsed.themes && parsed.themes.length > 0 ? parsed.themes : DEFAULT_SETTINGS.themes,
    };
  } catch (err) {
    console.error('Failed to load settings from storage, using defaults:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.error('Failed to save settings to localStorage:', err);
  }
}

export function getThemeById(themeId: string, themes: ThemeConfig[]): ThemeConfig {
  return themes.find((t) => t.id === themeId) || themes[0];
}

export function getActiveEvent(settings: AppSettings): EventConfig {
  const found = settings.events.find((e) => e.id === settings.activeEventId);
  return found || settings.events[0] || DEFAULT_SETTINGS.events[0];
}
