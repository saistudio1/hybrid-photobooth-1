import React, { useState } from 'react';
import {
  Settings,
  X,
  Sliders,
  Store,
  Calendar,
  Palette,
  Plus,
  Trash2,
  Copy,
  Check,
  Upload,
  Image as ImageIcon,
  Sparkles,
  RefreshCw,
  Camera,
  Layers,
  Heart,
  Printer,
  LogOut,
  RotateCcw,
  Smartphone,
  SlidersHorizontal
} from 'lucide-react';
import { AppSettings, EventConfig, EventLayout, Layout4R, ThemeConfig, WeddingConfig } from '../types/photobooth';
import { DEFAULT_SETTINGS } from '../utils/defaultData';
import { renderPhotostrip4R } from '../utils/renderer4R';
import { createSamplePose } from '../utils/samplePoses';
import { DIGITAL_CANVAS_PRESETS } from '../utils/digitalCanvasPresets';
import { FILTER_CATEGORIES, PHOTO_FILTERS } from '../utils/filterPresets';
import { FRAME_COLOR_PRESETS, FRAME_STYLES, WEDDING_FRAME_PRESETS } from '../utils/framePresets';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogout: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  onLogout,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<
    'wedding' | 'layout4r' | 'digital' | 'filters_frames' | 'general' | 'kiosk' | 'events' | 'themes'
  >('wedding');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [preview4RDataUrl, setPreview4RDataUrl] = useState<string>('');
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false);

  // Sync when opened
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  // Generate live preview for Wedding / Layout 4R
  React.useEffect(() => {
    if (!isOpen) return;
    let isCancelled = false;

    const generatePreview = async () => {
      setIsGeneratingPreview(true);
      try {
        const dummyPhotos = [
          createSamplePose(0),
          createSamplePose(1),
          createSamplePose(2),
          createSamplePose(3),
        ];

        const isWed = activeTab === 'wedding' || localSettings.kiosk.themeId === 'wedding-minimalist';
        const url = await renderPhotostrip4R({
          photos: dummyPhotos,
          layout: localSettings.kiosk.defaultLayout4R || 'double_strip_4r',
          filter: 'normal',
          frameBgColor: isWed ? '#fdfbf7' : '#ffffff',
          frameTextColor: isWed ? '#292524' : '#141414',
          dateStr: localSettings.wedding.weddingDate || '24.10.2026',
          title: localSettings.wedding.coupleNames || 'SARAH & DIMAS',
          isWeddingTheme: isWed,
          weddingConfig: localSettings.wedding,
        });

        if (!isCancelled) {
          setPreview4RDataUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate admin 4R preview:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingPreview(false);
        }
      }
    };

    generatePreview();
    return () => {
      isCancelled = true;
    };
  }, [isOpen, activeTab, localSettings.wedding, localSettings.kiosk.defaultLayout4R, localSettings.kiosk.themeId]);

  if (!isOpen) return null;

  const currentEditingEvent = localSettings.events.find((e) => e.id === editingEventId);

  // Save handler
  const handleSaveAndClose = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  // Reset to default settings
  const handleResetToDefault = () => {
    if (window.confirm('Kembalikan semua pengaturan ke nilai bawaan default? Perubahan yang belum disimpan akan hilang.')) {
      setLocalSettings(DEFAULT_SETTINGS);
      onSaveSettings(DEFAULT_SETTINGS);
    }
  };

  // Event handlers
  const handleSelectActiveEvent = (eventId: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      activeEventId: eventId,
    }));
  };

  const handleCreateNewEvent = () => {
    const newId = `event-${Date.now()}`;
    const newEvent: EventConfig = {
      id: newId,
      name: 'Event Baru',
      subtitle: 'Venue / Lokasi Acara',
      date: new Date().toLocaleDateString('id-ID'),
      welcomeHeadline: 'Selamat Datang di Acara Kami',
      welcomeSubheadline: 'Abadikan momen spesialmu di photobooth ini!',
      footerText: 'Terima kasih atas kehadiran Anda',
      photoCount: 4,
      layoutType: 'strip-4',
      primaryColor: '#c5a059',
      themeId: 'wedding-minimalist',
      createdAt: Date.now(),
    };
    setLocalSettings((prev) => ({
      ...prev,
      events: [newEvent, ...prev.events],
      activeEventId: newId,
    }));
    setEditingEventId(newId);
    setShowEventForm(true);
  };

  const handleDuplicateEvent = (event: EventConfig) => {
    const newId = `event-${Date.now()}`;
    const copy: EventConfig = {
      ...event,
      id: newId,
      name: `${event.name} (Copy)`,
      createdAt: Date.now(),
    };
    setLocalSettings((prev) => ({
      ...prev,
      events: [copy, ...prev.events],
    }));
  };

  const handleDeleteEvent = (eventId: string) => {
    if (localSettings.events.length <= 1) {
      alert('Minimal harus ada 1 event tersisa.');
      return;
    }
    if (window.confirm('Hapus konfigurasi event ini?')) {
      const filtered = localSettings.events.filter((e) => e.id !== eventId);
      const nextActive = localSettings.activeEventId === eventId ? filtered[0].id : localSettings.activeEventId;
      setLocalSettings((prev) => ({
        ...prev,
        events: filtered,
        activeEventId: nextActive,
      }));
      if (editingEventId === eventId) {
        setEditingEventId(null);
        setShowEventForm(false);
      }
    }
  };

  const handleUpdateEditingEvent = (field: keyof EventConfig, value: unknown) => {
    if (!editingEventId) return;
    setLocalSettings((prev) => ({
      ...prev,
      events: prev.events.map((e) => (e.id === editingEventId ? { ...e, [field]: value } : e)),
    }));
  };

  const handleFrameUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEventId) return;

    if (!file.type.includes('png')) {
      alert('Mohon gunakan file format PNG transparan (.png) untuk frame overlay.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdateEditingEvent('framePngUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 overflow-hidden backdrop-blur-md"
      style={{ backgroundColor: 'var(--overlay-bg)' }}
    >
      <div className="glass-panel rounded-3xl max-w-5xl w-full h-[92vh] shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-[var(--panel-border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-yellow-600 flex items-center justify-center text-neutral-950 shadow-md font-bold">
              <Settings className="w-5 h-5 text-neutral-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)]">
                  Panel Pengaturan & Konfigurasi Admin
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                  TERAUTENTIKASI
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)]">
                Kelola tema wedding, 5 layout 4R, mode Lite / Digital, filter foto, & frame
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onLogout}
              className="py-2 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-600 dark:text-rose-300 text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
              title="Keluar dari mode admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout Admin</span>
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl glass-button text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="px-4 md:px-5 pt-3 pb-2 flex gap-2 border-b border-[var(--panel-border)] overflow-x-auto text-xs">
          {[
            { id: 'wedding', label: 'Wedding Minimalist', icon: Heart, badge: 'Baru' },
            { id: 'layout4r', label: '5 Layout Cetak 4R', icon: Printer, badge: 'Print' },
            { id: 'digital', label: 'Lite / Digital Presets', icon: Smartphone, badge: 'Medsos' },
            { id: 'filters_frames', label: 'Filter & Frame Presets', icon: SlidersHorizontal },
            { id: 'general', label: 'General Settings', icon: Sliders },
            { id: 'kiosk', label: 'Kiosk Booth Settings', icon: Store },
            { id: 'events', label: 'Event Manager', icon: Calendar },
            { id: 'themes', label: 'Pilihan Tema', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setShowEventForm(false);
                }}
                className={`py-2 px-3.5 rounded-xl font-semibold flex items-center gap-2 transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-neutral-950 font-bold shadow-md shadow-amber-500/20'
                    : 'glass-button hover:opacity-90'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[9px] font-black ${
                      isActive ? 'bg-neutral-950 text-amber-300' : 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {/* TAB 1: WEDDING MINIMALIST */}
          {activeTab === 'wedding' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              <div className="lg:col-span-7 space-y-5">
                <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-300 text-sm font-bold mb-1">
                    <Sparkles className="w-4 h-4" /> Tema Spesial: Wedding Minimalist — White Elegance
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                    Tema pernikahan estetik bergaya editorial bersih. Menggunakan dominasi putih ivory, tipografi serif elegan Playfair Display, dan aksen champagne gold lembut.
                  </p>
                </div>

                {/* Form fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1.5">Nama Pasangan</label>
                    <input
                      type="text"
                      value={localSettings.wedding.coupleNames}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          wedding: { ...prev.wedding, coupleNames: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Sarah & Dimas"
                      className="w-full px-3.5 py-2.5 rounded-xl themed-input"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1.5">Tanggal Acara Pernikahan</label>
                    <input
                      type="text"
                      value={localSettings.wedding.weddingDate}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          wedding: { ...prev.wedding, weddingDate: e.target.value },
                        }))
                      }
                      placeholder="Contoh: 24.10.2026"
                      className="w-full px-3.5 py-2.5 rounded-xl themed-input"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1.5">Subteks / Kicker Atas</label>
                    <input
                      type="text"
                      value={localSettings.wedding.subtext}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          wedding: { ...prev.wedding, subtext: e.target.value },
                        }))
                      }
                      placeholder="THE WEDDING OF"
                      className="w-full px-3.5 py-2.5 rounded-xl themed-input"
                    />
                  </div>

                  <div>
                    <label className="font-bold text-[var(--text-primary)] block mb-1.5">Lokasi / Venue</label>
                    <input
                      type="text"
                      value={localSettings.wedding.venueText || ''}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          wedding: { ...prev.wedding, venueText: e.target.value },
                        }))
                      }
                      placeholder="Contoh: Grand Ballroom Jakarta"
                      className="w-full px-3.5 py-2.5 rounded-xl themed-input"
                    />
                  </div>
                </div>

                {/* Accent Color Selection */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-2">Pilihan Aksen Warna Wedding</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    {[
                      { name: 'Champagne Gold', hex: '#c5a059' },
                      { name: 'Dusty Rose', hex: '#d48c96' },
                      { name: 'Soft Beige', hex: '#b59a79' },
                      { name: 'Classic Slate', hex: '#64748b' },
                    ].map((c) => (
                      <button
                        key={c.name}
                        type="button"
                        onClick={() =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            wedding: { ...prev.wedding, accentColor: c.hex },
                          }))
                        }
                        className={`p-2.5 rounded-xl flex items-center gap-2 border transition cursor-pointer ${
                          localSettings.wedding.accentColor === c.hex
                            ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30'
                            : 'glass-card border-[var(--panel-border)] hover:opacity-90'
                        }`}
                      >
                        <span
                          style={{ backgroundColor: c.hex }}
                          className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0"
                        />
                        <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ornaments */}
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-2">Ornamen Minimalis</label>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    {[
                      { id: 'floral', label: '🌿 Floral' },
                      { id: 'rings', label: '💍 Cincin' },
                      { id: 'monogram', label: '🤍 Monogram' },
                      { id: 'minimal', label: '— Garis Tipis' },
                    ].map((orn) => (
                      <button
                        key={orn.id}
                        type="button"
                        onClick={() =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            wedding: { ...prev.wedding, ornament: orn.id as WeddingConfig['ornament'] },
                          }))
                        }
                        className={`p-2.5 rounded-xl text-center border font-semibold transition cursor-pointer ${
                          localSettings.wedding.ornament === orn.id
                            ? 'bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300'
                            : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:opacity-90'
                        }`}
                      >
                        <div>{orn.label}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply as active theme button */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, themeId: 'wedding-minimalist' },
                        general: { ...prev.general, themeId: 'wedding-minimalist' },
                      }));
                      alert('Tema "Wedding Minimalist — White Elegance" berhasil diaktifkan untuk Kiosk & Lite/Digital mode!');
                    }}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Check className="w-4 h-4 text-neutral-950" />
                    <span>Terapkan Sebagai Tema Aktif Saat Ini</span>
                  </button>
                </div>
              </div>

              {/* Preview Column */}
              <div className="lg:col-span-5 flex flex-col items-center">
                <span className="text-xs font-bold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                  <Printer className="w-3.5 h-3.5 text-amber-500" /> Live Preview Cetak 4R (300 DPI)
                </span>

                <div className="w-full max-w-[280px] aspect-[4/6] rounded-2xl glass-card border border-[var(--panel-border)] p-2 shadow-xl flex items-center justify-center overflow-hidden relative">
                  {isGeneratingPreview ? (
                    <div className="text-center text-xs text-[var(--text-muted)]">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Memuat preview 4R...
                    </div>
                  ) : preview4RDataUrl ? (
                    <img
                      src={preview4RDataUrl}
                      alt="Wedding 4R Preview"
                      className="w-full h-full object-contain rounded-xl shadow-md"
                    />
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">Preview siap</span>
                  )}
                </div>
                <p className="text-[10px] text-[var(--text-muted)] text-center mt-2 max-w-xs">
                  Desain ini adalah representasi presisi 1200 × 1800 px pada kertas 4R asli.
                </p>
              </div>
            </div>
          )}

          {/* TAB 2: 5 PILIHAN LAYOUT CETAK 4R */}
          {activeTab === 'layout4r' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Printer className="w-4 h-4 text-amber-500" /> 5 Pilihan Layout Cetak Standar 4R (10,16 × 15,24 cm)
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Semua pilihan menggunakan satu kanvas standar 4R (1200 × 1800 piksel @ 300 DPI). Sisa margin aman sekitar 3.5 mm dari tepi kertas telah diperhitungkan untuk printer foto komersial (seperti Epson L320).
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    id: 'double_strip_4r' as Layout4R,
                    title: '1. Double Photo Strip (4R)',
                    desc: 'Dua strip vertikal 2×6" berdampingan dalam 1 lembar 4R. Dilengkapi garis potong tengah (✂). Paling populer untuk souvenir & berbagi.',
                    poses: 4,
                  },
                  {
                    id: 'single_strip_4r' as Layout4R,
                    title: '2. Single Photo Strip (4R)',
                    desc: 'Satu photostrip vertikal klasik terpusat di lembar 4R dengan bingkai proporsional elegan dan ruang kertas optimal.',
                    poses: 4,
                  },
                  {
                    id: 'grid_2x2_4r' as Layout4R,
                    title: '3. Kolase 2 × 2 (4R)',
                    desc: 'Empat foto dalam susunan 2 kolom × 2 baris seimbang. Sangat cocok untuk foto keluarga, grup sahabat, dan wisuda.',
                    poses: 4,
                  },
                  {
                    id: 'collage_3_4r' as Layout4R,
                    title: '4. Kolase 3 Foto (4R)',
                    desc: 'Satu foto utama berukuran lebih besar di atas, didampingi dua foto pendukung di bawah tanpa distorsi rasio.',
                    poses: 3,
                  },
                  {
                    id: 'single_4r' as Layout4R,
                    title: '5. Foto Tunggal 4R (Full)',
                    desc: 'Satu foto utama memenuhi lembar 4R dengan safe margin. Dilengkapi slider pengaturan crop vertikal wajah.',
                    poses: 1,
                  },
                ].map((l) => (
                  <div
                    key={l.id}
                    onClick={() =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, defaultLayout4R: l.id },
                      }))
                    }
                    className={`p-4 rounded-2xl border cursor-pointer transition relative flex flex-col justify-between ${
                      localSettings.kiosk.defaultLayout4R === l.id
                        ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/25'
                        : 'glass-card border-[var(--panel-border)] hover:opacity-90'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-[var(--text-primary)]">{l.title}</span>
                        {localSettings.kiosk.defaultLayout4R === l.id && (
                          <span className="w-5 h-5 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center text-[10px] font-black">
                            ✓
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">{l.desc}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[var(--panel-border)] flex items-center justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Rasio: 4 × 6 inci (300 DPI)</span>
                      <span className="font-bold text-amber-600 dark:text-amber-300">{l.poses} Pose</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Technical notes on Epson L320 & Printer Margins */}
              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-2 text-xs">
                <span className="font-bold text-amber-700 dark:text-amber-300 block">
                  Catatan Teknis Cetak Printer (Epson L320 & Printer Foto 4R):
                </span>
                <ul className="space-y-1 text-[var(--text-secondary)] text-[11px] list-disc list-inside">
                  <li>
                    <strong>Safe Area Margin:</strong> Seluruh layout memiliki margin aman ~3.5–4 mm (40 piksel) dari tepi terluar kanvas agar tidak terpotong oleh roll penarik kertas printer.
                  </li>
                  <li>
                    <strong>Pengaturan Cetak di Browser:</strong> Saat dialog cetak terbuka, pilih ukuran kertas <code>4 × 6 in</code> (atau <code>100 × 150 mm</code> / <code>Postcard</code>), atur Skala ke <code>Fit to Printable Area</code> atau <code>100%</code>.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: LITE / DIGITAL PRESETS */}
          {activeTab === 'digital' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-cyan-500" /> Preset Kanvas Digital & Media Sosial (Mode Lite / Digital)
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Preset resolusi siap pakai untuk konten Instagram, TikTok, Facebook, dan WhatsApp Status tanpa menggunakan ukuran kertas 4R.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {DIGITAL_CANVAS_PRESETS.map((p) => (
                  <div key={p.id} className="p-3.5 rounded-2xl glass-card border border-[var(--panel-border)] flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="px-2 py-0.5 rounded-md bg-cyan-500/15 text-cyan-600 dark:text-cyan-300 text-[10px] font-bold">
                          {p.badge}
                        </span>
                        <span className="text-[11px] font-mono text-[var(--text-muted)] font-semibold">{p.ratioText}</span>
                      </div>
                      <h5 className="font-bold text-xs text-[var(--text-primary)]">{p.name}</h5>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1">{p.description}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-[var(--panel-border)] text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400">
                      {p.width} × {p.height} px
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: FILTER & FRAME PRESETS */}
          {activeTab === 'filters_frames' && (
            <div className="space-y-6 max-w-4xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <SlidersHorizontal className="w-4 h-4 text-amber-500" /> Katalog Filter Foto & Preset Bingkai
                </h4>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Tersedia 30+ filter foto yang dikelompokkan ke dalam 6 kategori dan 18 preset warna bingkai bawaan.
                </p>
              </div>

              {/* Filter Categories */}
              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-3">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Kategori Filter Foto:</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 text-xs">
                  {FILTER_CATEGORIES.filter((c) => c.id !== 'all').map((cat) => (
                    <div key={cat.id} className="p-3 rounded-xl glass-panel text-center">
                      <div className="font-bold text-[var(--text-primary)]">{cat.label}</div>
                      <span className="text-[10px] text-[var(--text-muted)] mt-1 block">
                        {PHOTO_FILTERS.filter((f) => f.category === cat.id).length} Filter
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frame Colors */}
              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-3">
                <span className="text-xs font-bold text-[var(--text-primary)] block">18 Preset Warna Frame Bawaan:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {FRAME_COLOR_PRESETS.map((c) => (
                    <div key={c.name} className="p-2 rounded-xl glass-panel flex items-center gap-2">
                      <div
                        style={{ backgroundColor: c.hex }}
                        className="w-4 h-4 rounded-full border border-black/20 shadow-sm shrink-0"
                      />
                      <span className="text-[10px] font-semibold text-[var(--text-primary)] truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Frame Styles */}
              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-3">
                <span className="text-xs font-bold text-[var(--text-primary)] block">Variasi Gaya Bingkai:</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {FRAME_STYLES.map((fs) => (
                    <div key={fs.id} className="p-3 rounded-xl glass-panel">
                      <span className="font-bold text-[var(--text-primary)] block">{fs.name}</span>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-0.5">{fs.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Pengaturan Umum Aplikasi</h4>
                <p className="text-xs text-[var(--text-secondary)]">Pengaturan dasar identitas dan kamera untuk seluruh sistem.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Nama Aplikasi / Studio</label>
                  <input
                    type="text"
                    value={localSettings.general.appName}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, appName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Subjudul / Brand Kiosk</label>
                  <input
                    type="text"
                    value={localSettings.general.appSubtitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, appSubtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-4">
                <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-500" /> Kamera & Efek Suara
                </h5>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.general.mirrorCamera}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          general: { ...prev.general, mirrorCamera: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-[var(--text-primary)]">Cerminkan Kamera (Mirror/Selfie)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localSettings.general.soundEnabled}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          general: { ...prev.general, soundEnabled: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-[var(--text-primary)]">Efek Suara Shutter & Beep</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                    Durasi Countdown Default: {localSettings.general.cameraCountdown} detik
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={localSettings.general.cameraCountdown}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, cameraCountdown: Number(e.target.value) },
                      }))
                    }
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: KIOSK SETTINGS */}
          {activeTab === 'kiosk' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Pengaturan Photobooth Kiosk Mode</h4>
                <p className="text-xs text-[var(--text-secondary)]">Sesuaikan alur touchscreen, welcome screen, dan idle auto-reset.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Judul Welcome Screen</label>
                  <input
                    type="text"
                    value={localSettings.kiosk.welcomeTitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, welcomeTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Subjudul Welcome Screen</label>
                  <textarea
                    rows={2}
                    value={localSettings.kiosk.welcomeSubtitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, welcomeSubtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Teks Tombol Mulai</label>
                  <input
                    type="text"
                    value={localSettings.kiosk.startButtonText}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, startButtonText: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-4">
                <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-500" /> Auto-Reset & Idle Timeout
                </h5>
                <p className="text-xs text-[var(--text-secondary)]">
                  Secara otomatis kembali ke Welcome Screen jika pengunjung meninggalkan booth atau tidak ada aktivitas.
                </p>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={localSettings.kiosk.enableAutoReset}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, enableAutoReset: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-[var(--text-primary)]">Aktifkan Auto-Reset</span>
                  </label>

                  {localSettings.kiosk.enableAutoReset && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-[var(--text-muted)]">Durasi:</span>
                      <select
                        value={localSettings.kiosk.autoResetTimeoutSeconds}
                        onChange={(e) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            kiosk: { ...prev.kiosk, autoResetTimeoutSeconds: Number(e.target.value) },
                          }))
                        }
                        className="p-1.5 rounded-lg themed-select"
                      >
                        <option value={30}>30 Detik</option>
                        <option value={45}>45 Detik</option>
                        <option value={60}>60 Detik</option>
                        <option value={90}>90 Detik</option>
                        <option value={120}>2 Menit</option>
                      </select>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-[var(--panel-border)] flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <input
                      type="checkbox"
                      checked={localSettings.kiosk.showQRIS}
                      onChange={(e) =>
                        setLocalSettings((prev) => ({
                          ...prev,
                          kiosk: { ...prev.kiosk, showQRIS: e.target.checked },
                        }))
                      }
                      className="w-4 h-4 rounded text-amber-500"
                    />
                    <span className="text-[var(--text-primary)]">Tampilkan Langkah Pembayaran QRIS (Komersial)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: EVENT MANAGER */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {!showEventForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)]">Daftar Konfigurasi Event</h4>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Pilih event yang sedang berjalan atau buat konfigurasi event baru dengan frame PNG khusus.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNewEvent}
                      className="py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer transition"
                    >
                      <Plus className="w-4 h-4 text-neutral-950" /> Buat Event Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localSettings.events.map((ev) => {
                      const isActive = ev.id === localSettings.activeEventId;
                      return (
                        <div
                          key={ev.id}
                          className={`p-5 rounded-2xl glass-panel border transition relative ${
                            isActive ? 'border-amber-500 ring-2 ring-amber-500/25' : 'border-[var(--panel-border)]'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span
                                style={{ backgroundColor: ev.primaryColor }}
                                className="inline-block w-2.5 h-2.5 rounded-full mr-2 shadow-sm"
                              />
                              <h5 className="font-bold text-sm text-[var(--text-primary)] inline">{ev.name}</h5>
                              <p className="text-xs text-[var(--text-secondary)] mt-0.5">{ev.subtitle}</p>
                            </div>
                            {isActive && (
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                ACTIVE EVENT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[var(--text-muted)] my-3">
                            <span>Layout: {ev.layoutType}</span>
                            <span>·</span>
                            <span>{ev.photoCount} Foto</span>
                            <span>·</span>
                            <span>{ev.framePngUrl ? '✨ Custom Frame PNG' : 'Auto Typography'}</span>
                          </div>

                          <div className="pt-3 border-t border-[var(--panel-border)] flex items-center justify-between gap-2">
                            {!isActive && (
                              <button
                                onClick={() => handleSelectActiveEvent(ev.id)}
                                className="py-1.5 px-3 rounded-lg glass-button text-xs font-semibold text-[var(--text-primary)] transition"
                              >
                                Aktifkan Event Ini
                              </button>
                            )}
                            <div className="flex items-center gap-1.5 ml-auto">
                              <button
                                onClick={() => {
                                  setEditingEventId(ev.id);
                                  setShowEventForm(true);
                                }}
                                className="p-2 rounded-lg glass-button text-xs text-[var(--text-primary)]"
                                title="Edit Event"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDuplicateEvent(ev)}
                                className="p-2 rounded-lg glass-button text-xs text-[var(--text-primary)]"
                                title="Duplikat Event"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-2 rounded-lg glass-button text-xs text-rose-500 hover:bg-rose-500/20"
                                title="Hapus Event"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : currentEditingEvent ? (
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-[var(--panel-border)]">
                    <div>
                      <h4 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                        Edit Konfigurasi: {currentEditingEvent.name}
                      </h4>
                      <p className="text-xs text-[var(--text-secondary)]">Atur frame PNG transparan, branding, dan teks acara.</p>
                    </div>
                    <button
                      onClick={() => setShowEventForm(false)}
                      className="py-1.5 px-3 rounded-lg glass-button text-xs font-semibold text-[var(--text-primary)]"
                    >
                      ← Kembali ke Daftar Event
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Nama Acara / Event</label>
                      <input
                        type="text"
                        value={currentEditingEvent.name}
                        onChange={(e) => handleUpdateEditingEvent('name', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Subjudul / Lokasi</label>
                      <input
                        type="text"
                        value={currentEditingEvent.subtitle}
                        onChange={(e) => handleUpdateEditingEvent('subtitle', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Tanggal Acara</label>
                      <input
                        type="text"
                        value={currentEditingEvent.date}
                        onChange={(e) => handleUpdateEditingEvent('date', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Layout & Jumlah Pose</label>
                      <select
                        value={currentEditingEvent.layoutType}
                        onChange={(e) => {
                          const layout = e.target.value as EventLayout;
                          const count = layout === 'single' ? 1 : layout === 'strip-3' ? 3 : 4;
                          handleUpdateEditingEvent('layoutType', layout);
                          handleUpdateEditingEvent('photoCount', count);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl themed-select text-xs"
                      >
                        <option value="strip-4">Classic Strip (4 Pose Vertikal)</option>
                        <option value="strip-3">Strip 3 Pose Vertikal</option>
                        <option value="grid-2x2">Grid 2x2 Collage (4 Pose)</option>
                        <option value="single">Single Photo (1 Pose Besar)</option>
                      </select>
                    </div>
                  </div>

                  {/* Frame PNG Overlay upload */}
                  <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-3">
                    <div className="flex items-center justify-between">
                      <h5 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-500" /> Frame PNG Transparan (Overlay 4R)
                      </h5>
                      {currentEditingEvent.framePngUrl && (
                        <button
                          onClick={() => handleUpdateEditingEvent('framePngUrl', undefined)}
                          className="text-[11px] text-rose-500 hover:underline"
                        >
                          Hapus Frame
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {currentEditingEvent.framePngUrl ? (
                        <div className="w-20 h-28 rounded-xl border border-[var(--panel-border)] glass-panel p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={currentEditingEvent.framePngUrl}
                            alt="Frame Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-28 rounded-xl border border-dashed border-[var(--panel-border)] glass-card flex flex-col items-center justify-center text-[10px] text-[var(--text-muted)] shrink-0">
                          <ImageIcon className="w-6 h-6 mb-1 text-[var(--text-muted)]" />
                          <span>No Frame</span>
                        </div>
                      )}

                      <label className="py-2.5 px-4 rounded-xl glass-button text-xs font-semibold text-[var(--text-primary)] flex items-center gap-2 cursor-pointer w-fit">
                        <Upload className="w-4 h-4 text-cyan-500" />
                        <span>Pilih File Frame PNG Transparan...</span>
                        <input
                          type="file"
                          accept="image/png"
                          onChange={handleFrameUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 8: THEMES */}
          {activeTab === 'themes' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h4 className="text-sm font-bold text-[var(--text-primary)] mb-1">Pengaturan Tema & Identitas Visual</h4>
                <p className="text-xs text-[var(--text-secondary)]">
                  Pilih tema bawaan atau tentukan tema berbeda untuk setiap mode aplikasi.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] block">Tema Lite / Digital:</span>
                  <select
                    value={localSettings.general.themeId}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, themeId: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-xl themed-select text-xs"
                  >
                    {localSettings.themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] block">Tema Kiosk Mode:</span>
                  <select
                    value={localSettings.kiosk.themeId}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, themeId: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-xl themed-select text-xs"
                  >
                    {localSettings.themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-2xl glass-card border border-[var(--panel-border)] space-y-2">
                  <span className="text-xs font-bold text-[var(--text-primary)] block">Tema Acara Event:</span>
                  <select
                    value={localSettings.events.find((e) => e.id === localSettings.activeEventId)?.themeId || 'wedding-minimalist'}
                    onChange={(e) => {
                      const themeId = e.target.value;
                      setLocalSettings((prev) => ({
                        ...prev,
                        events: prev.events.map((ev) =>
                          ev.id === prev.activeEventId ? { ...ev, themeId } : ev
                        ),
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl themed-select text-xs"
                  >
                    {localSettings.themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Theme Showcase Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 pt-2">
                {localSettings.themes.map((t) => (
                  <div
                    key={t.id}
                    onClick={() => {
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, themeId: t.id },
                        kiosk: { ...prev.kiosk, themeId: t.id },
                      }));
                    }}
                    className={`p-4 rounded-2xl border glass-panel space-y-2 relative overflow-hidden cursor-pointer transition ${
                      localSettings.kiosk.themeId === t.id ? 'border-amber-500 ring-2 ring-amber-500/25' : 'border-[var(--panel-border)] hover:opacity-95'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[var(--text-primary)] truncate mr-2">{t.name}</span>
                      <div
                        style={{ backgroundColor: t.accentColor }}
                        className="w-3.5 h-3.5 rounded-full shadow shrink-0"
                      />
                    </div>
                    <div className="h-6 rounded-lg bg-gradient-to-r overflow-hidden border border-black/10 flex items-center justify-center text-[10px] font-bold tracking-wider">
                      <span className={`w-full h-full bg-gradient-to-r ${t.accentGradient} opacity-85 flex items-center justify-center text-neutral-950 font-extrabold`}>
                        Aa {t.fontFamily === 'serif' ? 'Serif' : 'Sans'} {t.isDark ? '(Dark)' : '(Light)'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--panel-border)] flex items-center justify-between glass-panel">
          <button
            onClick={handleResetToDefault}
            className="py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-600 dark:text-rose-300 hover:bg-rose-500/15 transition flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Default</span>
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="py-2.5 px-5 rounded-xl glass-button text-xs font-semibold text-[var(--text-primary)] cursor-pointer"
            >
              Tutup
            </button>
            <button
              onClick={handleSaveAndClose}
              className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 flex items-center gap-2 cursor-pointer transition active:scale-95"
            >
              <Check className="w-4 h-4 text-neutral-950" /> Simpan Semua Pengaturan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
