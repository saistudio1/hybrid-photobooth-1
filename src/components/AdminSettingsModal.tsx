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
  Eye,
  RefreshCw,
  Camera,
  Layers
} from 'lucide-react';
import { AppSettings, EventConfig, EventLayout, ThemeConfig } from '../types/photobooth';

interface AdminSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
}

export const AdminSettingsModal: React.FC<AdminSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'general' | 'kiosk' | 'events' | 'themes'>('general');
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);

  // Sync when opened
  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const currentEditingEvent = localSettings.events.find((e) => e.id === editingEventId);

  // Save handler
  const handleSaveAndClose = () => {
    onSaveSettings(localSettings);
    onClose();
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
      primaryColor: '#f43f5e',
      themeId: 'midnight-glow',
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

  // Handle PNG Frame Overlay upload
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

  // Handle Event Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingEventId) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      handleUpdateEditingEvent('logoUrl', dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-hidden">
      <div className="glass-panel rounded-3xl max-w-4xl w-full h-[90vh] shadow-2xl border border-white/15 flex flex-col overflow-hidden text-neutral-100">
        {/* Header */}
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-rose-500/25">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Panel Pengaturan & Admin Photobooth
              </h3>
              <p className="text-xs text-neutral-400">Kelola General Mode, Kiosk Booth, Event Khusus, & Tema</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl glass-button text-neutral-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="px-5 pt-3 pb-2 flex gap-2 border-b border-white/10 overflow-x-auto">
          {[
            { id: 'general', label: '1. General Settings', icon: Sliders },
            { id: 'kiosk', label: '2. Kiosk Settings', icon: Store },
            { id: 'events', label: '3. Event Settings', icon: Calendar },
            { id: 'themes', label: '4. Theme & Tampilan', icon: Palette },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as typeof activeTab);
                  setShowEventForm(false);
                }}
                className={`py-2 px-4 rounded-xl text-xs font-semibold flex items-center gap-2 transition shrink-0 ${
                  activeTab === tab.id
                    ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25'
                    : 'glass-button text-neutral-400 hover:text-neutral-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* TAB 1: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Pengaturan Umum Aplikasi</h4>
                <p className="text-xs text-neutral-400">Pengaturan dasar identitas dan kamera untuk seluruh sistem.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">Nama Aplikasi</label>
                  <input
                    type="text"
                    value={localSettings.general.appName}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, appName: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">Subjudul / Brand Kiosk</label>
                  <input
                    type="text"
                    value={localSettings.general.appSubtitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, appSubtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <Camera className="w-4 h-4 text-rose-400" /> Pengaturan Kamera & Efek Suara
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
                      className="w-4 h-4 rounded text-rose-500 bg-neutral-900 border-white/20"
                    />
                    <span className="text-neutral-300">Cerminkan Kamera (Mirror / Selfie Mode)</span>
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
                      className="w-4 h-4 rounded text-rose-500 bg-neutral-900 border-white/20"
                    />
                    <span className="text-neutral-300">Efek Suara Shutter & Beep Aktif</span>
                  </label>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">
                    Durasi Countdown Default (Detik): {localSettings.general.cameraCountdown}s
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
                    className="w-full accent-rose-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: KIOSK SETTINGS */}
          {activeTab === 'kiosk' && (
            <div className="space-y-6 max-w-2xl">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Pengaturan Photobooth Kiosk Mode</h4>
                <p className="text-xs text-neutral-400">Sesuaikan alur touchscreen, welcome screen, dan idle auto-reset.</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">Judul Welcome Screen</label>
                  <input
                    type="text"
                    value={localSettings.kiosk.welcomeTitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, welcomeTitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">Subjudul Welcome Screen</label>
                  <textarea
                    rows={2}
                    value={localSettings.kiosk.welcomeSubtitle}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, welcomeSubtitle: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-300 block mb-1.5">Teks Tombol Mulai</label>
                  <input
                    type="text"
                    value={localSettings.kiosk.startButtonText}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, startButtonText: e.target.value },
                      }))
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                  />
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-amber-400" /> Auto-Reset & Idle Timeout
                </h5>
                <p className="text-xs text-neutral-400">
                  Secara otomatis kembali ke Welcome Screen jika pengunjung meninggalkan layar setelah selesai atau tidak ada aktivitas.
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
                      className="w-4 h-4 rounded text-rose-500 bg-neutral-900 border-white/20"
                    />
                    <span className="text-neutral-300">Aktifkan Auto-Reset</span>
                  </label>

                  {localSettings.kiosk.enableAutoReset && (
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-neutral-400">Durasi:</span>
                      <select
                        value={localSettings.kiosk.autoResetTimeoutSeconds}
                        onChange={(e) =>
                          setLocalSettings((prev) => ({
                            ...prev,
                            kiosk: { ...prev.kiosk, autoResetTimeoutSeconds: Number(e.target.value) },
                          }))
                        }
                        className="p-1.5 rounded-lg bg-neutral-900 border border-white/15 text-white"
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

                <div className="pt-2 border-t border-white/10 flex items-center gap-3">
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
                      className="w-4 h-4 rounded text-rose-500 bg-neutral-900 border-white/20"
                    />
                    <span className="text-neutral-300">Tampilkan Langkah Pembayaran QRIS (Komersial)</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: EVENT SETTINGS */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              {!showEventForm ? (
                <>
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">Daftar Konfigurasi Event</h4>
                      <p className="text-xs text-neutral-400">
                        Pilih event yang sedang berjalan atau buat konfigurasi event baru dengan frame PNG khusus.
                      </p>
                    </div>
                    <button
                      onClick={handleCreateNewEvent}
                      className="py-2.5 px-4 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-500/25 transition"
                    >
                      <Plus className="w-4 h-4" /> Buat Event Baru
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {localSettings.events.map((ev) => {
                      const isActive = ev.id === localSettings.activeEventId;
                      return (
                        <div
                          key={ev.id}
                          className={`p-5 rounded-2xl glass-panel border transition relative ${
                            isActive ? 'border-amber-400/80 ring-2 ring-amber-400/20' : 'border-white/10'
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <span
                                style={{ backgroundColor: ev.primaryColor }}
                                className="inline-block w-2.5 h-2.5 rounded-full mr-2"
                              />
                              <h5 className="font-bold text-sm text-white inline">{ev.name}</h5>
                              <p className="text-xs text-neutral-400 mt-0.5">{ev.subtitle}</p>
                            </div>
                            {isActive && (
                              <span className="px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-500/30">
                                ACTIVE EVENT
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-neutral-300 my-3">
                            <span>Layout: {ev.layoutType}</span>
                            <span>·</span>
                            <span>{ev.photoCount} Foto</span>
                            <span>·</span>
                            <span>{ev.framePngUrl ? '✨ Custom Frame PNG' : 'Auto Typography'}</span>
                          </div>

                          <div className="pt-3 border-t border-white/10 flex items-center justify-between gap-2">
                            {!isActive && (
                              <button
                                onClick={() => handleSelectActiveEvent(ev.id)}
                                className="py-1.5 px-3 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition"
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
                                className="p-2 rounded-lg glass-button text-xs text-neutral-300 hover:text-white"
                                title="Edit Event"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDuplicateEvent(ev)}
                                className="p-2 rounded-lg glass-button text-xs text-neutral-300 hover:text-white"
                                title="Duplikat Event"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteEvent(ev.id)}
                                className="p-2 rounded-lg glass-button text-xs text-rose-400 hover:bg-rose-500/20"
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
                /* EVENT FORM / EDITOR */
                <div className="space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        Edit Konfigurasi: {currentEditingEvent.name}
                      </h4>
                      <p className="text-xs text-neutral-400">Atur frame PNG transparan, branding, dan teks acara.</p>
                    </div>
                    <button
                      onClick={() => setShowEventForm(false)}
                      className="py-1.5 px-3 rounded-lg glass-button text-xs font-semibold text-neutral-300 hover:text-white"
                    >
                      ← Kembali ke Daftar Event
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Nama Acara / Event</label>
                      <input
                        type="text"
                        value={currentEditingEvent.name}
                        onChange={(e) => handleUpdateEditingEvent('name', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Subjudul / Lokasi</label>
                      <input
                        type="text"
                        value={currentEditingEvent.subtitle}
                        onChange={(e) => handleUpdateEditingEvent('subtitle', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Tanggal Acara</label>
                      <input
                        type="text"
                        value={currentEditingEvent.date}
                        onChange={(e) => handleUpdateEditingEvent('date', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Layout & Jumlah Pose</label>
                      <select
                        value={currentEditingEvent.layoutType}
                        onChange={(e) => {
                          const layout = e.target.value as EventLayout;
                          const count = layout === 'single' ? 1 : layout === 'strip-3' ? 3 : 4;
                          handleUpdateEditingEvent('layoutType', layout);
                          handleUpdateEditingEvent('photoCount', count);
                        }}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white focus:outline-none focus:border-rose-400"
                      >
                        <option value="strip-4">Classic Strip (4 Pose Vertikal)</option>
                        <option value="strip-3">Strip 3 Pose Vertikal</option>
                        <option value="grid-2x2">Grid 2x2 Collage (4 Pose)</option>
                        <option value="single">Single Photo (1 Pose Besar)</option>
                      </select>
                    </div>
                  </div>

                  {/* FRAME PNG TRANSPARENT OVERLAY UPLOADER */}
                  <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h5 className="text-xs font-bold text-white flex items-center gap-2">
                          <Layers className="w-4 h-4 text-cyan-400" /> Frame PNG Transparan (Overlay)
                        </h5>
                        <p className="text-[11px] text-neutral-400 mt-0.5">
                          Unggah file PNG dengan transparansi di area foto. Frame akan diletakkan di atas foto secara presisi.
                        </p>
                      </div>
                      {currentEditingEvent.framePngUrl && (
                        <button
                          onClick={() => handleUpdateEditingEvent('framePngUrl', undefined)}
                          className="text-[11px] text-rose-400 hover:underline"
                        >
                          Hapus Frame
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      {currentEditingEvent.framePngUrl ? (
                        <div className="w-20 h-28 rounded-xl border border-white/20 bg-neutral-950 p-1 flex items-center justify-center overflow-hidden shrink-0">
                          <img
                            src={currentEditingEvent.framePngUrl}
                            alt="Frame Preview"
                            className="max-h-full max-w-full object-contain"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-28 rounded-xl border border-dashed border-white/20 bg-neutral-900 flex flex-col items-center justify-center text-[10px] text-neutral-500 shrink-0">
                          <ImageIcon className="w-6 h-6 mb-1 text-neutral-600" />
                          <span>No Frame</span>
                        </div>
                      )}

                      <div className="flex-1 space-y-2">
                        <label className="py-2.5 px-4 rounded-xl glass-button text-xs font-semibold text-white hover:bg-white/15 flex items-center gap-2 cursor-pointer w-fit">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>Pilih File Frame PNG Transparan...</span>
                          <input
                            type="file"
                            accept="image/png"
                            onChange={handleFrameUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-[10px] text-neutral-400">
                          Rekomendasi resolusi: 800 x 2400 px untuk strip, atau 1000 x 1250 px untuk grid 2x2.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Welcome & Footer Texts */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Judul Welcome Screen Acara</label>
                      <input
                        type="text"
                        value={currentEditingEvent.welcomeHeadline}
                        onChange={(e) => handleUpdateEditingEvent('welcomeHeadline', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Teks Footer / Catatan Bawah</label>
                      <input
                        type="text"
                        value={currentEditingEvent.footerText}
                        onChange={(e) => handleUpdateEditingEvent('footerText', e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-1.5">Warna Aksen Acara</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={currentEditingEvent.primaryColor}
                          onChange={(e) => handleUpdateEditingEvent('primaryColor', e.target.value)}
                          className="w-10 h-10 rounded-xl bg-transparent cursor-pointer"
                        />
                        <span className="text-xs font-mono text-neutral-400">{currentEditingEvent.primaryColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {/* TAB 4: THEME SETTINGS */}
          {activeTab === 'themes' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h4 className="text-sm font-bold text-white mb-1">Pengaturan Tema & Identitas Visual</h4>
                <p className="text-xs text-neutral-400">
                  Pilih tema bawaan atau tentukan tema berbeda untuk setiap mode aplikasi.
                </p>
              </div>

              {/* Mode Theme Assignments */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">Tema General Mode:</span>
                  <select
                    value={localSettings.general.themeId}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        general: { ...prev.general, themeId: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
                  >
                    {localSettings.themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">Tema Kiosk Mode:</span>
                  <select
                    value={localSettings.kiosk.themeId}
                    onChange={(e) =>
                      setLocalSettings((prev) => ({
                        ...prev,
                        kiosk: { ...prev.kiosk, themeId: e.target.value },
                      }))
                    }
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
                  >
                    {localSettings.themes.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="p-4 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-2">
                  <span className="text-xs font-bold text-white block">Tema Default Event:</span>
                  <select
                    value={localSettings.events.find((e) => e.id === localSettings.activeEventId)?.themeId || 'midnight-glow'}
                    onChange={(e) => {
                      const themeId = e.target.value;
                      setLocalSettings((prev) => ({
                        ...prev,
                        events: prev.events.map((ev) =>
                          ev.id === prev.activeEventId ? { ...ev, themeId } : ev
                        ),
                      }));
                    }}
                    className="w-full p-2.5 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
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
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-white block">Pilihan Palet Tema Bawaan:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {localSettings.themes.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 rounded-2xl border border-white/10 bg-neutral-900 space-y-2 relative overflow-hidden"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">{t.name}</span>
                        <div
                          style={{ backgroundColor: t.accentColor }}
                          className="w-3.5 h-3.5 rounded-full shadow"
                        />
                      </div>
                      <div className="h-6 rounded-lg bg-gradient-to-r overflow-hidden border border-white/10 flex items-center justify-center text-[10px] text-white font-bold tracking-wider">
                        <span className={`w-full h-full bg-gradient-to-r ${t.accentGradient} opacity-80 flex items-center justify-center`}>
                          Aa {t.fontFamily === 'serif' ? 'Serif' : 'Sans'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between">
          <button
            onClick={onClose}
            className="py-2.5 px-5 rounded-xl glass-button text-xs font-semibold text-neutral-300 hover:text-white"
          >
            Batal
          </button>
          <button
            onClick={handleSaveAndClose}
            className="py-2.5 px-6 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs shadow-lg shadow-rose-500/25 flex items-center gap-2 cursor-pointer transition"
          >
            <Check className="w-4 h-4" /> Simpan Semua Pengaturan
          </button>
        </div>
      </div>
    </div>
  );
};
