import React, { useState, useEffect, useRef, useMemo } from 'react';
import confetti from 'canvas-confetti';
import QRCode from 'qrcode';
import {
  Camera,
  RotateCcw,
  Printer,
  Download,
  Calendar,
  Sparkles,
  Volume2,
  VolumeX,
  FlipHorizontal,
  Check,
  ChevronRight,
  Upload,
  Image as ImageIcon,
  Palette,
  Sliders,
  QrCode,
  Settings,
  Store,
  Layers,
  Maximize2,
  Minimize2,
  User,
  PartyPopper
} from 'lucide-react';
import { playCountdownBeep, playShutterSound, playSuccessChime } from './utils/audio';
import { createSamplePose } from './utils/samplePoses';
import { renderPhotostrip, LayoutType, FilterType } from './utils/renderer';
import { renderEventPhotostrip } from './utils/eventRenderer';
import { renderGeneralPhoto } from './utils/generalRenderer';
import { loadSettings, saveSettings, getThemeById, getActiveEvent } from './utils/storage';
import { AppMode, AppSettings, EventConfig } from './types/photobooth';
import { AdminSettingsModal } from './components/AdminSettingsModal';

interface PackageOption {
  id: LayoutType;
  title: string;
  poses: number;
  price: number;
  description: string;
  badge: string;
}

const PACKAGES: PackageOption[] = [
  {
    id: 'strip',
    title: 'Classic Strip',
    poses: 4,
    price: 35000,
    description: 'Format vertikal klasik 4 pose yang ramping, elegan, dan ikonik.',
    badge: 'Paling Populer',
  },
  {
    id: 'grid',
    title: 'Grid 2x2 Collage',
    poses: 4,
    price: 40000,
    description: 'Susunan kotak 2x2 modern, pas untuk foto grup atau pose variatif.',
    badge: 'Best For Group',
  },
  {
    id: 'double_strip',
    title: 'Double Bestie Strip',
    poses: 4,
    price: 45000,
    description: 'Dua strip 4-pose berdampingan dengan garis potong untuk berbagi.',
    badge: '2 Lembar Siap Gunting',
  },
  {
    id: 'bookmark',
    title: 'Bookmark Strip',
    poses: 3,
    price: 30000,
    description: 'Format 3 pose minimalis pas untuk pembatas buku kenang-kenangan.',
    badge: '3 Pose Ringkas',
  },
];

const FRAME_COLORS = [
  { name: 'Pure White', bg: '#ffffff', text: '#141414', swatchClass: 'bg-white border-neutral-300 text-neutral-900' },
  { name: 'Matte Obsidian', bg: '#141414', text: '#ffffff', swatchClass: 'bg-neutral-900 border-neutral-700 text-white' },
  { name: 'Sakura Blush', bg: '#fce7f3', text: '#831843', swatchClass: 'bg-pink-100 border-pink-300 text-pink-900' },
  { name: 'Butter Cream', bg: '#fef3c7', text: '#78350f', swatchClass: 'bg-amber-100 border-amber-300 text-amber-900' },
  { name: 'Sky Baby Blue', bg: '#dbeafe', text: '#1e3a8a', swatchClass: 'bg-blue-100 border-blue-300 text-blue-900' },
  { name: 'Sage Mint', bg: '#dcfce7', text: '#14532d', swatchClass: 'bg-emerald-100 border-emerald-300 text-emerald-900' },
  { name: 'Lavender Haze', bg: '#f3e8ff', text: '#581c87', swatchClass: 'bg-purple-100 border-purple-300 text-purple-900' },
];

const FILTERS: { id: FilterType; label: string }[] = [
  { id: 'normal', label: 'Natural' },
  { id: 'bw', label: 'B&W Film' },
  { id: 'warm', label: 'Golden' },
  { id: 'cool', label: 'Y2K Cool' },
  { id: 'sepia', label: 'Vintage' },
  { id: 'film', label: 'Cinematic' },
  { id: 'glow', label: 'Soft Glow' },
];

const STAMPS = ['✨', '🫶', '🤍', '🎀', '🌸', '🎞️', '⭐', '🧸'];

function getTodayFormatted(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

export default function App() {
  // Settings State
  const [settings, setSettings] = useState<AppSettings>(loadSettings);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Active Mode: 'general' | 'kiosk' | 'event'
  const activeMode = settings.activeMode;
  const activeEvent = useMemo(() => getActiveEvent(settings), [settings]);

  // Current Theme based on active mode
  const currentTheme = useMemo(() => {
    let themeId = settings.general.themeId;
    if (activeMode === 'kiosk') themeId = settings.kiosk.themeId;
    if (activeMode === 'event') themeId = activeEvent.themeId || settings.general.themeId;
    return getThemeById(themeId, settings.themes);
  }, [activeMode, activeEvent, settings]);

  // Kiosk / Event Flow State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [soundEnabled, setSoundEnabled] = useState(settings.general.soundEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Selected Package (Kiosk)
  const [selectedPackage, setSelectedPackage] = useState<PackageOption>(PACKAGES[0]);

  // Camera & Capture State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(settings.general.mirrorCamera);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [retakeTargetIndex, setRetakeTargetIndex] = useState<number | null>(null);

  // General Mode specific state
  const [generalCaption, setGeneralCaption] = useState('SAI STUDIO');
  const [generalFilter, setGeneralFilter] = useState<FilterType>('normal');

  // Customization State (Kiosk)
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('normal');
  const [frameBg, setFrameBg] = useState(FRAME_COLORS[0].bg);
  const [frameTextColor, setFrameTextColor] = useState(FRAME_COLORS[0].text);
  const [customTitle, setCustomTitle] = useState('SAI STUDIO');
  const [selectedStamp, setSelectedStamp] = useState('✨');
  const [currentLayout, setCurrentLayout] = useState<LayoutType>('strip');

  // Step 5 & Print State
  const [finalImageSrc, setFinalImageSrc] = useState<string>('');
  const [isBuildingFinal, setIsBuildingFinal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);
  const [qrExpired, setQrExpired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target Pose Count for current mode
  const targetPoseCount = useMemo(() => {
    if (activeMode === 'general') return 1;
    if (activeMode === 'event') return activeEvent.photoCount;
    return selectedPackage.poses;
  }, [activeMode, activeEvent, selectedPackage]);

  // Start Camera
  const startCamera = async () => {
    try {
      setCameraError(null);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: unknown) {
      console.warn('Camera access unavailable:', err);
      setCameraError('Kamera tidak dapat diakses atau diblokir oleh browser.');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((t) => t.stop());
      setCameraStream(null);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // When video element mounts and stream is ready
  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, currentStep, activeMode]);

  // Start camera automatically in General Mode
  useEffect(() => {
    if (activeMode === 'general') {
      startCamera();
    }
  }, [activeMode]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen error:', e);
    }
  };

  // Idle Timeout / Auto-Reset to Welcome Screen for Kiosk and Event Mode
  useEffect(() => {
    if ((activeMode === 'kiosk' || activeMode === 'event') && settings.kiosk.enableAutoReset && hasStarted) {
      let timeout: NodeJS.Timeout;
      const resetTimer = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          handleResetSession();
        }, settings.kiosk.autoResetTimeoutSeconds * 1000);
      };

      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach((name) => window.addEventListener(name, resetTimer));
      resetTimer();

      return () => {
        clearTimeout(timeout);
        events.forEach((name) => window.removeEventListener(name, resetTimer));
      };
    }
  }, [activeMode, settings.kiosk.enableAutoReset, settings.kiosk.autoResetTimeoutSeconds, hasStarted]);

  // Payment QR Code generation
  const [paymentQrSrc, setPaymentQrSrc] = useState<string>('');
  useEffect(() => {
    if (currentStep === 2 && activeMode === 'kiosk') {
      QRCode.toDataURL(`ID.QRIS.SAISTUDIO.${selectedPackage.price}.${Date.now()}`, {
        width: 220,
        margin: 1,
        color: { dark: '#111827', light: '#ffffff' },
      }).then((url) => setPaymentQrSrc(url));
    }
  }, [currentStep, activeMode, selectedPackage]);

  // Generate Download QR in Step 5
  const generateDownloadQrCode = async () => {
    setQrExpired(false);
    setQrSecondsLeft(30);
    const token = `SAI-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const shareUrl = `https://saistudio.id/share?photo=${token}`;
    try {
      const qrUrl = await QRCode.toDataURL(shareUrl, {
        width: 220,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrCodeDataUrl(qrUrl);
    } catch (err) {
      console.error('QR code generation error:', err);
    }
  };

  // QR Code Expiry Countdown
  useEffect(() => {
    if (currentStep !== 5) return;
    const interval = setInterval(() => {
      setQrSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setQrExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [currentStep, qrCodeDataUrl]);

  // Trigger capture sequence
  const startCapture = (targetIndex?: number) => {
    if (countdown !== null) return;
    const idx = targetIndex !== undefined ? targetIndex : capturedPhotos.length;
    if (idx >= targetPoseCount && targetIndex === undefined) return;

    setRetakeTargetIndex(targetIndex !== undefined ? targetIndex : null);
    let count = settings.general.cameraCountdown || 3;
    setCountdown(count);
    if (soundEnabled) playCountdownBeep(false);

    const timer = setInterval(() => {
      count -= 1;
      if (count > 0) {
        setCountdown(count);
        if (soundEnabled) playCountdownBeep(false);
      } else {
        clearInterval(timer);
        setCountdown(0);
        if (soundEnabled) {
          playCountdownBeep(true);
          setTimeout(playShutterSound, 150);
        }
        setIsFlashing(true);
        setTimeout(() => setIsFlashing(false), 200);

        takeSnapshot(targetIndex);
      }
    }, 1000);
  };

  const takeSnapshot = (targetIndex?: number) => {
    const video = videoRef.current;
    let photoData = '';

    if (video && video.videoWidth > 0 && cameraStream) {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        if (isMirrored) {
          ctx.translate(canvas.width, 0);
          ctx.scale(-1, 1);
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        photoData = canvas.toDataURL('image/jpeg', 0.92);
      }
    } else {
      const sampleIdx = targetIndex !== undefined ? targetIndex : capturedPhotos.length;
      photoData = createSamplePose(sampleIdx);
    }

    setCapturedPhotos((prev) => {
      const next = [...prev];
      if (targetIndex !== undefined && targetIndex < next.length) {
        next[targetIndex] = photoData;
      } else {
        next.push(photoData);
      }
      return next;
    });

    setCountdown(null);
    setRetakeTargetIndex(null);
  };

  // Spacebar to capture
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && countdown === null) {
        if (activeMode === 'general' && capturedPhotos.length === 0) {
          e.preventDefault();
          startCapture();
        } else if ((activeMode === 'kiosk' || activeMode === 'event') && currentStep === 3) {
          e.preventDefault();
          if (capturedPhotos.length < targetPoseCount) {
            startCapture();
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep, countdown, capturedPhotos.length, targetPoseCount, activeMode]);

  // Load sample demo poses
  const loadDemoPoses = () => {
    const poses = Array.from({ length: targetPoseCount }, (_, i) => createSamplePose(i));
    setCapturedPhotos(poses);
  };

  // Upload Photo
  const handleUploadPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !files.length) return;
    const readers = Array.from(files).slice(0, targetPoseCount);
    const loadedData: string[] = [];

    readers.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          loadedData.push(event.target.result as string);
          if (loadedData.length === readers.length) {
            setCapturedPhotos((prev) => [...prev, ...loadedData].slice(0, targetPoseCount));
          }
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Build Final Output (Adapts to Mode: General, Kiosk, or Event)
  const buildFinalOutput = async () => {
    if (!capturedPhotos.length) return;
    setIsBuildingFinal(true);
    try {
      let dataUrl = '';
      if (activeMode === 'general') {
        dataUrl = await renderGeneralPhoto({
          photo: capturedPhotos[0],
          dateStr: getTodayFormatted(),
          filter: generalFilter === 'normal' ? 'none' : `filter-${generalFilter}`,
          caption: generalCaption || settings.general.appName,
        });
      } else if (activeMode === 'event') {
        dataUrl = await renderEventPhotostrip({
          photos: capturedPhotos,
          event: activeEvent,
          filter: selectedFilter === 'normal' ? 'none' : `filter-${selectedFilter}`,
        });
      } else {
        // Kiosk Mode
        dataUrl = await renderPhotostrip({
          photos: capturedPhotos,
          layout: currentLayout,
          filter: selectedFilter,
          frameBgColor: frameBg,
          frameTextColor: frameTextColor,
          dateStr: getTodayFormatted(),
          customText: customTitle || settings.general.appName,
          stamp: selectedStamp,
        });
      }

      setFinalImageSrc(dataUrl);

      const printImg = document.getElementById('printImage') as HTMLImageElement | null;
      if (printImg) {
        printImg.src = dataUrl;
      }

      setIsBuildingFinal(false);
      return dataUrl;
    } catch (err) {
      console.error('Failed to render output:', err);
      setIsBuildingFinal(false);
    }
  };

  // Finish session
  const proceedToFinish = async () => {
    setCurrentStep(5);
    stopCamera();
    await buildFinalOutput();
    await generateDownloadQrCode();

    if (soundEnabled) playSuccessChime();

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ['#f43f5e', '#a855f7', '#38bdf8', '#fbbf24', '#ffffff'],
    });
  };

  // Print
  const handlePrint = async () => {
    if (!finalImageSrc) {
      await buildFinalOutput();
    }
    const printImg = document.getElementById('printImage') as HTMLImageElement | null;
    if (printImg) {
      printImg.src = finalImageSrc;
      printImg.onload = () => setTimeout(() => window.print(), 100);
      if (printImg.complete) setTimeout(() => window.print(), 100);
    }
  };

  // Download
  const handleDownload = () => {
    if (!finalImageSrc) return;
    const link = document.createElement('a');
    link.href = finalImageSrc;
    const prefix = activeMode === 'event' ? activeEvent.name.replace(/\s+/g, '-') : 'SAI-Photobooth';
    link.download = `${prefix}-${Date.now()}.jpg`;
    link.click();
  };

  // Reset
  const handleResetSession = () => {
    stopCamera();
    setCapturedPhotos([]);
    setFinalImageSrc('');
    setCountdown(null);
    setCurrentStep(1);
    setHasStarted(false);
    if (activeMode === 'general') {
      startCamera();
    }
  };

  // Mode Switcher handler
  const handleSwitchMode = (mode: AppMode) => {
    handleResetSession();
    const updated: AppSettings = { ...settings, activeMode: mode };
    setSettings(updated);
    saveSettings(updated);
  };

  // Save Settings from Modal
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setSoundEnabled(newSettings.general.soundEnabled);
    setIsMirrored(newSettings.general.mirrorCamera);
  };

  return (
    <div
      className={`min-h-screen ${
        currentTheme.isDark ? 'bg-neutral-950 text-neutral-100' : 'bg-slate-50 text-slate-900'
      } flex flex-col justify-between relative overflow-hidden transition-colors duration-300 font-${currentTheme.fontFamily}`}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-25 blur-[100px] bg-gradient-to-tr ${currentTheme.accentGradient}`}
        />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full opacity-20 blur-[120px] bg-purple-600 animate-orb-2" />
      </div>

      {/* Camera shutter flash effect */}
      <div
        className={`fixed inset-0 bg-white pointer-events-none z-50 transition-opacity duration-200 ${
          isFlashing ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* TOP OPERATOR & HYBRID MODE NAVIGATION BAR */}
      <header className="p-3 md:p-4 flex flex-wrap justify-between items-center z-20 glass-panel border-b border-white/10 m-3 rounded-2xl gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentTheme.accentGradient} flex items-center justify-center shadow-lg font-bold text-lg text-white`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-wide">
              {settings.general.appName}
              <span className="text-rose-400 font-serif-title italic ml-1">Hybrid</span>
            </h1>
            <p className="text-[10px] text-neutral-400 font-medium">
              {activeMode === 'general'
                ? 'General Quick Photo Mode'
                : activeMode === 'event'
                ? `Event Mode: ${activeEvent.name}`
                : 'Photobooth Kiosk Mode'}
            </p>
          </div>
        </div>

        {/* HYBRID MODE SELECTOR TABS */}
        <div className="flex items-center p-1 glass-card rounded-xl text-xs font-semibold">
          <button
            onClick={() => handleSwitchMode('general')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === 'general'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>General Mode</span>
          </button>

          <button
            onClick={() => handleSwitchMode('kiosk')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === 'kiosk'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kiosk Mode</span>
          </button>

          <button
            onClick={() => handleSwitchMode('event')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 ${
              activeMode === 'event'
                ? 'bg-rose-500 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5 text-amber-400" />
            <span>Event Mode</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Settings Admin Modal Trigger */}
          <button
            onClick={() => setShowAdminModal(true)}
            title="Buka Pengaturan & Admin"
            className="glass-button px-3 py-2 rounded-xl text-xs font-semibold text-neutral-200 flex items-center gap-1.5 hover:text-white"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Settings</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Kiosk'}
            className="glass-button p-2.5 rounded-xl text-neutral-300 hover:text-white hidden sm:flex"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-purple-400" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            className="glass-button p-2.5 rounded-xl text-neutral-300 hover:text-white"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-rose-400" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            title="Reset Sesi"
            className="glass-button px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-400" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MODE A: GENERAL PHOTO MODE (CLEAN & FAST)
         ======================================================== */}
      {activeMode === 'general' && (
        <main className="flex-1 relative flex items-center justify-center p-4 md:p-6 z-10 overflow-y-auto">
          <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            {/* Viewfinder Column */}
            <div className="md:col-span-7 glass-panel p-4 md:p-6 rounded-3xl flex flex-col items-center">
              <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : 'scale-x-100'}`}
                />

                {/* Camera gate */}
                {(!cameraStream || cameraError) && (
                  <div className="absolute inset-0 bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                    <Camera className="w-10 h-10 text-rose-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Kamera Belum Aktif</h4>
                    <p className="text-xs text-neutral-400 mt-1 mb-4">
                      {cameraError || 'Izinkan kamera atau gunakan foto studio demo.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="py-2.5 px-4 bg-white text-neutral-950 font-bold rounded-xl text-xs shadow"
                      >
                        Buka Kamera
                      </button>
                      <button
                        onClick={loadDemoPoses}
                        className="py-2.5 px-4 glass-button text-neutral-200 font-bold rounded-xl text-xs"
                      >
                        Foto Demo
                      </button>
                    </div>
                  </div>
                )}

                {/* Countdown */}
                {countdown !== null && (
                  <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
                      {countdown === 0 ? '📸' : countdown}
                    </span>
                    <span className="text-xs font-bold tracking-widest uppercase text-rose-300 mt-3">
                      {countdown === 0 ? 'SMILE!' : 'BERSIAP!'}
                    </span>
                  </div>
                )}
              </div>

              {/* Viewfinder controls */}
              <div className="w-full mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 flex items-center gap-1.5"
                >
                  <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                  <span>Cermin</span>
                </button>

                <button
                  onClick={() => startCapture()}
                  disabled={countdown !== null}
                  className="py-3.5 px-8 rounded-2xl bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-extrabold text-sm shadow-xl shadow-rose-500/30 flex items-center gap-2 cursor-pointer transition"
                >
                  <Camera className="w-5 h-5" />
                  <span>Ambil Foto (Spasi)</span>
                </button>

                {capturedPhotos.length > 0 && (
                  <button
                    onClick={() => setCapturedPhotos([])}
                    className="glass-button px-3 py-2 rounded-xl text-xs font-semibold text-neutral-300"
                  >
                    Foto Ulang
                  </button>
                )}
              </div>
            </div>

            {/* Result & Minimalist Card Column */}
            <div className="md:col-span-5 glass-panel p-5 rounded-3xl flex flex-col items-center space-y-4">
              <h3 className="font-bold text-sm text-white flex items-center gap-2 self-start">
                <ImageIcon className="w-4 h-4 text-rose-400" /> Preview Foto Kartu
              </h3>

              {capturedPhotos[0] ? (
                <div className="w-full bg-white text-slate-900 p-4 rounded-2xl shadow-xl flex flex-col items-center">
                  <div className="w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-200">
                    <img
                      src={capturedPhotos[0]}
                      alt="Captured"
                      className={`w-full h-full object-cover filter-${generalFilter}`}
                    />
                  </div>
                  <div className="w-full mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="font-serif-title font-bold text-sm">{generalCaption || 'SAI STUDIO'}</span>
                    <span className="text-slate-400 text-[11px] font-mono">{getTodayFormatted()}</span>
                  </div>
                </div>
              ) : (
                <div className="w-full aspect-[4/3] rounded-2xl border border-dashed border-white/20 bg-neutral-900/60 flex flex-col items-center justify-center text-xs text-neutral-500 p-6 text-center">
                  <Camera className="w-8 h-8 text-neutral-600 mb-2" />
                  <span>Belum ada foto. Tekan tombol Ambil Foto untuk memotret.</span>
                </div>
              )}

              {/* Quick Filters */}
              <div className="w-full space-y-1.5">
                <span className="text-[11px] font-bold text-neutral-300">Pilih Filter:</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {FILTERS.slice(0, 4).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setGeneralFilter(f.id)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold transition ${
                        generalFilter === f.id ? 'bg-rose-500 text-white' : 'glass-button text-neutral-300'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption Input */}
              <div className="w-full">
                <label className="text-[11px] font-bold text-neutral-300 block mb-1">Teks / Caption</label>
                <input
                  type="text"
                  value={generalCaption}
                  onChange={(e) => setGeneralCaption(e.target.value)}
                  placeholder="SAI STUDIO"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-900 border border-white/15 text-xs text-white"
                />
              </div>

              {/* Action Buttons */}
              {capturedPhotos.length > 0 && (
                <div className="w-full flex gap-2 pt-2">
                  <button
                    onClick={async () => {
                      await buildFinalOutput();
                      handleDownload();
                    }}
                    className="flex-1 py-3 glass-button rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/15"
                  >
                    <Download className="w-4 h-4 text-cyan-300" /> Simpan
                  </button>
                  <button
                    onClick={async () => {
                      await buildFinalOutput();
                      handlePrint();
                    }}
                    className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-500/25"
                  >
                    <Printer className="w-4 h-4" /> Cetak Foto
                  </button>
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ========================================================
          MODE B: KIOSK PHOTOBOOTH & MODE C: EVENT PHOTOBOOTH
         ======================================================== */}
      {(activeMode === 'kiosk' || activeMode === 'event') && (
        <main className="flex-1 relative flex items-center justify-center p-4 md:p-6 z-10 overflow-y-auto">
          {/* WELCOME SCREEN (Step 0) */}
          {!hasStarted && (
            <section className="fixed inset-0 z-40 flex items-center justify-center p-6 bg-neutral-950/85 backdrop-blur-2xl">
              <div className="relative w-full max-w-lg text-center">
                <div className="glass-panel rounded-3xl p-8 md:p-12 border border-white/15 shadow-2xl">
                  {/* Event or Kiosk Badge & Logo */}
                  {activeMode === 'event' && activeEvent.logoUrl ? (
                    <img
                      src={activeEvent.logoUrl}
                      alt={activeEvent.name}
                      className="w-20 h-20 mx-auto object-contain mb-5"
                    />
                  ) : (
                    <div
                      className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr ${currentTheme.accentGradient} flex items-center justify-center shadow-xl shadow-rose-500/30 mb-6`}
                    >
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  )}

                  <p
                    style={{ color: currentTheme.accentColor }}
                    className="text-xs font-bold tracking-[0.3em] uppercase mb-2"
                  >
                    {activeMode === 'event' ? activeEvent.name : settings.general.appName}
                  </p>
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
                    {activeMode === 'event' ? activeEvent.welcomeHeadline : settings.kiosk.welcomeTitle}
                  </h2>
                  <h3 className="font-serif-title italic text-2xl md:text-3xl text-rose-300 mt-1">
                    {activeMode === 'event' ? activeEvent.welcomeSubheadline : 'Abadikan momentmu yuk!'}
                  </h3>
                  <p className="text-sm text-neutral-300 mt-4 leading-relaxed max-w-md mx-auto">
                    {activeMode === 'event'
                      ? activeEvent.subtitle || 'Dapatkan photostrip eksklusif bertema acara ini.'
                      : settings.kiosk.welcomeSubtitle}
                  </p>

                  <button
                    onClick={() => {
                      setHasStarted(true);
                      if (activeMode === 'event') {
                        setCurrentStep(3);
                        startCamera();
                      } else {
                        setCurrentStep(1);
                      }
                    }}
                    className="mt-8 w-full py-4 bg-white text-neutral-950 rounded-2xl font-extrabold text-base shadow-xl hover:bg-neutral-100 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {activeMode === 'event'
                      ? 'Mulai Foto Acara Ini'
                      : settings.kiosk.startButtonText || 'Mulai Sesi Foto'}{' '}
                    <ChevronRight className="w-5 h-5 text-neutral-900" />
                  </button>

                  {/* Mode details */}
                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" />{' '}
                      {activeMode === 'event' ? `${activeEvent.photoCount} Pose Khusus` : 'Live Webcam HD'}
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Cetak & QR Softcopy
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 1: PAKET SELECTION (KIOSK ONLY) */}
          {currentStep === 1 && activeMode === 'kiosk' && (
            <section className="w-full max-w-4xl py-4">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest uppercase text-rose-400">PILIHAN SESI FOTO</span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-white mt-2">Abadikan Momen Terbaikmu</h2>
                <p className="text-sm text-neutral-400 mt-2 max-w-lg mx-auto">
                  Pilih format foto yang kamu inginkan. Lengkap dengan pilihan filter estetis dan cetakan instan.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {PACKAGES.map((pkg) => (
                  <div
                    key={pkg.id}
                    onClick={() => {
                      setSelectedPackage(pkg);
                      setCurrentLayout(pkg.id);
                      if (settings.kiosk.showQRIS) {
                        setCurrentStep(2);
                      } else {
                        setCurrentStep(3);
                        startCamera();
                      }
                    }}
                    className={`glass-panel p-6 rounded-3xl border cursor-pointer group hover:-translate-y-1 transition-all duration-200 relative overflow-hidden ${
                      selectedPackage.id === pkg.id
                        ? 'border-rose-500/60 ring-2 ring-rose-500/20'
                        : 'border-white/10 hover:border-white/25'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        {pkg.badge}
                      </span>
                      <span className="text-xl font-black text-white">Rp {pkg.price.toLocaleString('id-ID')}</span>
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-rose-300 transition-colors">
                      {pkg.title}
                    </h3>
                    <p className="text-xs text-neutral-400 mb-6 leading-relaxed">{pkg.description}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center gap-3 text-xs text-neutral-300">
                        <span className="flex items-center gap-1">
                          <Camera className="w-3.5 h-3.5 text-rose-400" /> {pkg.poses} Pose
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1">
                          <Printer className="w-3.5 h-3.5 text-amber-400" /> 2 Lembar
                        </span>
                      </div>

                      <button className="w-9 h-9 rounded-full bg-rose-500 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 2: PEMBAYARAN QRIS (KIOSK ONLY) */}
          {currentStep === 2 && activeMode === 'kiosk' && (
            <section className="w-full max-w-md py-4">
              <div className="glass-panel rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden">
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Langkah Pembayaran</span>
                <h2 className="text-2xl font-bold text-white mt-1">Pembayaran QRIS</h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Scan QR Code berikut menggunakan GoPay, OVO, ShopeePay, DANA, atau Mobile Banking.
                </p>

                <div className="bg-white p-5 rounded-2xl inline-block shadow-2xl my-6 border border-white/40">
                  {paymentQrSrc ? (
                    <img src={paymentQrSrc} alt="QRIS SAI Studio" className="w-48 h-48 mx-auto" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">Menyiapkan QR...</div>
                  )}
                  <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-700 font-bold">
                    <span>{selectedPackage.title}</span>
                    <span className="text-rose-600 font-extrabold text-sm">
                      Rp {selectedPackage.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>

                <div className="glass-card py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-xs text-neutral-300 font-medium">Menunggu Verifikasi Pembayaran...</span>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setCurrentStep(3);
                      startCamera();
                    }}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-extrabold rounded-2xl text-sm shadow-lg shadow-emerald-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Konfirmasi Pembayaran Berhasil
                  </button>
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="w-full py-3 glass-button text-xs font-semibold text-neutral-400 hover:text-white rounded-xl"
                  >
                    Batal & Pilih Paket Lain
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* STEP 3: SESI FOTO (LIVE WEBCAM & MULTI-POSE) */}
          {currentStep === 3 && (
            <section className="w-full max-w-6xl py-2">
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                {/* Viewfinder */}
                <div className="lg:col-span-3 glass-panel rounded-3xl p-4 md:p-6 relative flex flex-col items-center">
                  <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex items-center justify-center">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className={`w-full h-full object-cover transition-transform duration-200 ${
                        isMirrored ? '-scale-x-100' : 'scale-x-100'
                      }`}
                    />

                    {/* Camera Gate */}
                    {(!cameraStream || cameraError) && (
                      <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex items-center justify-center p-6 z-10">
                        <div className="glass-panel p-6 rounded-2xl max-w-md w-full text-center">
                          <Camera className="w-10 h-10 text-rose-400 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-white">Kamera Belum Aktif</h3>
                          <p className="text-xs text-neutral-300 mt-1 mb-5">
                            {cameraError || 'Izinkan browser mengakses webcam untuk memulai sesi foto.'}
                          </p>

                          <div className="space-y-2.5">
                            <button
                              onClick={startCamera}
                              className="w-full py-3 bg-white text-neutral-950 rounded-xl font-bold text-xs shadow hover:bg-neutral-100 transition"
                            >
                              Coba Aktifkan Webcam
                            </button>
                            <button
                              onClick={loadDemoPoses}
                              className="w-full py-3 glass-button rounded-xl font-semibold text-xs text-neutral-200 hover:text-white transition flex items-center justify-center gap-2"
                            >
                              <Sparkles className="w-4 h-4 text-rose-400" /> Gunakan Foto Studio Demo
                            </button>
                            <label className="w-full py-3 glass-button rounded-xl font-semibold text-xs text-neutral-200 hover:text-white transition flex items-center justify-center gap-2 cursor-pointer">
                              <Upload className="w-4 h-4 text-purple-400" />
                              <span>Upload Foto Dari Perangkat</span>
                              <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handleUploadPhoto}
                                className="hidden"
                              />
                            </label>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Countdown */}
                    {countdown !== null && (
                      <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                        <span className="text-9xl font-black text-white drop-shadow-2xl animate-pulse">
                          {countdown === 0 ? '📸' : countdown}
                        </span>
                        <span className="text-sm font-bold tracking-widest uppercase text-rose-300 mt-3">
                          {countdown === 0 ? 'SMILE!' : 'BERSIAP!'}
                        </span>
                      </div>
                    )}

                    {/* Kiosk HUD */}
                    <div className="absolute inset-5 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-4 z-10">
                      <div className="flex justify-between items-center text-[11px] font-mono tracking-widest text-white/70 uppercase">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REC · LIVE
                        </span>
                        <span>
                          POSE {Math.min(capturedPhotos.length + 1, targetPoseCount)} / {targetPoseCount}
                        </span>
                      </div>
                      <div className="self-center text-white/40 text-xs font-mono tracking-widest">
                        {activeMode === 'event' ? activeEvent.name.toUpperCase() : 'SAI STUDIO FRAME GUIDE'}
                      </div>
                    </div>
                  </div>

                  {/* Controls Bar */}
                  <div className="w-full mt-5 flex items-center justify-between px-2 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMirrored(!isMirrored)}
                        className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-neutral-300 flex items-center gap-1.5 hover:text-white"
                      >
                        <FlipHorizontal className="w-4 h-4 text-cyan-400" />
                        <span className="hidden sm:inline">Cermin</span>
                      </button>
                    </div>

                    <button
                      disabled={capturedPhotos.length >= targetPoseCount || countdown !== null}
                      onClick={() => startCapture()}
                      className={`px-8 py-4 rounded-2xl font-black text-sm md:text-base flex items-center gap-3 transition-all cursor-pointer ${
                        capturedPhotos.length >= targetPoseCount
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-rose-500 via-purple-500 to-indigo-600 text-white shadow-xl shadow-rose-500/30 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Camera className="w-5 h-5" />
                      <span>
                        {capturedPhotos.length >= targetPoseCount
                          ? 'Semua Pose Selesai'
                          : 'AMBIL FOTO (Spasi)'}
                      </span>
                    </button>

                    <button
                      onClick={() => setCapturedPhotos([])}
                      className="glass-button px-4 py-2 rounded-xl text-xs font-semibold text-neutral-400 hover:text-white transition"
                    >
                      Ulang Semua
                    </button>
                  </div>
                </div>

                {/* Sidebar Pose Manager */}
                <div className="glass-panel rounded-3xl p-5 flex flex-col h-full min-h-[460px]">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2 mb-4">
                    <ImageIcon className="w-4 h-4 text-rose-400" />
                    Hasil Pose ({capturedPhotos.length}/{targetPoseCount})
                  </h3>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                    {Array.from({ length: targetPoseCount }).map((_, idx) => {
                      const photo = capturedPhotos[idx];
                      return (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-white/10 bg-neutral-900 aspect-[4/3] flex items-center justify-center group"
                        >
                          {photo ? (
                            <>
                              <img src={photo} alt={`Pose ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                                #{idx + 1}
                              </div>
                              <button
                                onClick={() => startCapture(idx)}
                                title="Retake Pose Ini"
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/70 text-rose-300 hover:text-white hover:bg-rose-600 transition"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-3">
                              <span className="text-neutral-600 text-xs font-mono font-bold">POSE #{idx + 1}</span>
                              <p className="text-[10px] text-neutral-500 mt-0.5">Belum diambil</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    disabled={capturedPhotos.length < targetPoseCount}
                    onClick={() => {
                      if (activeMode === 'event') {
                        proceedToFinish();
                      } else {
                        setCurrentStep(4);
                      }
                    }}
                    className={`mt-4 w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                      capturedPhotos.length >= targetPoseCount
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/25 hover:bg-rose-600 active:scale-95 cursor-pointer'
                        : 'bg-white/10 text-neutral-500 cursor-not-allowed'
                    }`}
                  >
                    <span>{activeMode === 'event' ? 'Proses & Cetak Event' : 'Lanjut Ke Layout & Filter'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: CUSTOMIZE (KIOSK MODE) */}
          {currentStep === 4 && activeMode === 'kiosk' && (
            <section className="w-full max-w-5xl py-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Preview Column */}
                <div className="lg:col-span-5 flex justify-center items-center">
                  <div className="glass-panel p-6 rounded-3xl shadow-2xl flex justify-center w-full max-w-sm">
                    <div
                      style={{ backgroundColor: frameBg, color: frameTextColor }}
                      className="p-4 rounded-xl shadow-2xl transition-colors duration-300 w-full flex flex-col items-center select-none"
                    >
                      <div className="text-center mb-3">
                        <p className="text-[9px] font-semibold tracking-[0.25em] opacity-80">AESTHETIC PHOTO STUDIO</p>
                        <h4 className="font-serif-title italic font-bold text-lg tracking-wide">
                          {customTitle || 'SAI STUDIO'}
                        </h4>
                      </div>

                      <div
                        className={`w-full gap-2 mb-3 ${
                          currentLayout === 'grid'
                            ? 'grid grid-cols-2'
                            : currentLayout === 'double_strip'
                            ? 'grid grid-cols-2'
                            : 'flex flex-col'
                        }`}
                      >
                        {capturedPhotos
                          .slice(0, currentLayout === 'bookmark' ? 3 : 4)
                          .map((imgSrc, i) => (
                            <div key={i} className="relative rounded-md overflow-hidden aspect-[4/3] bg-neutral-200">
                              <img
                                src={imgSrc}
                                alt={`Strip photo ${i + 1}`}
                                className={`w-full h-full object-cover filter-${selectedFilter}`}
                              />
                            </div>
                          ))}
                      </div>

                      <div className="text-center pt-2 border-t border-current/20 w-full flex flex-col items-center justify-center">
                        <span className="text-sm">{selectedStamp}</span>
                        <p className="text-[10px] font-semibold tracking-wider mt-0.5">{getTodayFormatted()}</p>
                        <p className="text-[8px] font-mono tracking-widest opacity-60">MEMORY KEEPER · SAI STUDIO</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls Column */}
                <div className="lg:col-span-7 glass-panel rounded-3xl p-6 md:p-8 space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-rose-400" /> Kustomisasi Frame & Filter
                    </h3>
                    <p className="text-xs text-neutral-400 mt-1">
                      Sesuaikan warna frame, filter foto, teks, dan hiasan photostrip kamu.
                    </p>
                  </div>

                  {/* Filter Selector */}
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-2.5">Filter Foto</label>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                      {FILTERS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFilter(f.id)}
                          className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                            selectedFilter === f.id
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50'
                              : 'glass-button text-neutral-300 hover:text-white'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Frame Colors */}
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-2.5 flex items-center justify-between">
                      <span>Warna Frame</span>
                      <span className="text-[11px] text-neutral-400 font-normal">
                        {FRAME_COLORS.find((c) => c.bg === frameBg)?.name || 'Custom'}
                      </span>
                    </label>
                    <div className="flex flex-wrap gap-2.5 items-center">
                      {FRAME_COLORS.map((c) => (
                        <button
                          key={c.name}
                          onClick={() => {
                            setFrameBg(c.bg);
                            setFrameTextColor(c.text);
                          }}
                          title={c.name}
                          className={`w-10 h-10 rounded-xl border-2 transition-all ${c.swatchClass} ${
                            frameBg === c.bg ? 'ring-2 ring-rose-500 scale-110 shadow-lg' : 'opacity-80 hover:opacity-100'
                          }`}
                        />
                      ))}
                      <label className="w-10 h-10 rounded-xl glass-button flex items-center justify-center cursor-pointer border border-white/20 hover:border-white/40">
                        <Palette className="w-4 h-4 text-rose-300" />
                        <input
                          type="color"
                          value={frameBg}
                          onChange={(e) => {
                            setFrameBg(e.target.value);
                            const hex = e.target.value.replace('#', '');
                            const r = parseInt(hex.substring(0, 2), 16) || 0;
                            const g = parseInt(hex.substring(2, 4), 16) || 0;
                            const b = parseInt(hex.substring(4, 6), 16) || 0;
                            const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                            setFrameTextColor(luminance > 140 ? '#111827' : '#ffffff');
                          }}
                          className="sr-only"
                        />
                      </label>
                    </div>
                  </div>

                  {/* Layout selector */}
                  <div>
                    <label className="text-xs font-bold text-neutral-300 block mb-2.5">Format Layout</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'strip' as LayoutType, label: '1x4 Strip' },
                        { id: 'grid' as LayoutType, label: '2x2 Grid' },
                        { id: 'double_strip' as LayoutType, label: 'Double Strip' },
                        { id: 'bookmark' as LayoutType, label: '3-Bookmark' },
                      ].map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setCurrentLayout(item.id)}
                          className={`py-2 px-3 rounded-xl text-xs font-semibold transition-all ${
                            currentLayout === item.id
                              ? 'bg-rose-500 text-white shadow-md shadow-rose-500/25 ring-2 ring-rose-400/50'
                              : 'glass-button text-neutral-300 hover:text-white'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title & Stamp */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-2">Judul Frame</label>
                      <input
                        type="text"
                        maxLength={24}
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Contoh: BESTIES / SAI STUDIO"
                        className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-900 border border-white/15 text-white text-xs focus:outline-none focus:border-rose-400"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-neutral-300 block mb-2">Stempel / Ikon</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {STAMPS.map((s) => (
                          <button
                            key={s}
                            onClick={() => setSelectedStamp(s)}
                            className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm transition-all ${
                              selectedStamp === s ? 'bg-rose-500/30 border border-rose-500 scale-105' : 'glass-button hover:bg-white/10'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Finalize Action */}
                  <div className="pt-2 flex gap-3">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="py-4 px-5 glass-button text-xs font-semibold text-neutral-300 hover:text-white rounded-2xl"
                    >
                      Kembali
                    </button>
                    <button
                      onClick={proceedToFinish}
                      className="flex-1 py-4 bg-white text-neutral-950 hover:bg-neutral-100 active:scale-95 transition-all rounded-2xl font-extrabold text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer className="w-4 h-4" /> Selesai & Cetak Sekarang
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: CETAK, DOWNLOAD & QR SOFTCOPY */}
          {currentStep === 5 && (
            <section className="w-full max-w-4xl py-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Result Showcase */}
                <div className="md:col-span-6 flex flex-col items-center">
                  <div className="glass-panel p-5 rounded-3xl shadow-2xl flex justify-center max-w-xs w-full">
                    {isBuildingFinal ? (
                      <div className="py-20 text-center text-neutral-400 text-xs">
                        <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Membuat hasil render resolusi tinggi...
                      </div>
                    ) : finalImageSrc ? (
                      <img
                        src={finalImageSrc}
                        alt="Hasil Photostrip SAI Studio"
                        className="w-full rounded-xl shadow-2xl"
                      />
                    ) : (
                      <div className="py-20 text-center text-neutral-400 text-xs">Menyiapkan gambar...</div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 w-full max-w-xs">
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 glass-button rounded-xl text-xs font-bold text-white flex items-center justify-center gap-2 hover:bg-white/15"
                    >
                      <Download className="w-4 h-4 text-cyan-300" /> Simpan
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-rose-600 shadow-lg shadow-rose-500/25"
                    >
                      <Printer className="w-4 h-4" /> Cetak Foto
                    </button>
                  </div>
                </div>

                {/* QR Code Softcopy */}
                <div className="md:col-span-6 glass-panel rounded-3xl p-8 text-center shadow-2xl">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 mb-3">
                    <Check className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-white">Foto Berhasil Dibuat!</h2>
                  <p className="text-xs text-neutral-300 mt-1">
                    Scan QR di bawah dengan kamera HP kamu untuk mengunduh softcopy foto secara langsung.
                  </p>

                  <div className="bg-white p-5 rounded-2xl inline-block shadow-2xl my-5 border border-white/50">
                    {qrExpired ? (
                      <div className="w-48 h-48 flex flex-col items-center justify-center text-neutral-400">
                        <QrCode className="w-10 h-10 mb-2 text-neutral-400" />
                        <span className="text-xs font-bold text-neutral-700">QR Kadaluarsa</span>
                      </div>
                    ) : qrCodeDataUrl ? (
                      <img src={qrCodeDataUrl} alt="QR Softcopy" className="w-48 h-48" />
                    ) : (
                      <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">
                        Menyiapkan QR...
                      </div>
                    )}
                  </div>

                  <div className="max-w-[260px] mx-auto">
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(qrSecondsLeft / 30) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-2">
                      {qrExpired ? (
                        <span className="text-rose-400 font-semibold">QR telah kadaluarsa demi privasi.</span>
                      ) : (
                        <>
                          QR aktif selama <strong className="text-white">{qrSecondsLeft}</strong> detik.
                        </>
                      )}
                    </p>
                  </div>

                  {qrExpired && (
                    <button
                      onClick={generateDownloadQrCode}
                      className="mt-3 px-4 py-2 glass-button rounded-xl text-xs font-bold text-rose-300 hover:text-white"
                    >
                      Buat QR Baru
                    </button>
                  )}

                  <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 justify-center">
                    {activeMode === 'kiosk' && (
                      <button
                        onClick={() => setCurrentStep(4)}
                        className="py-3 px-5 glass-button text-xs font-semibold text-neutral-300 hover:text-white rounded-xl"
                      >
                        Edit Frame Lagi
                      </button>
                    )}
                    <button
                      onClick={handleResetSession}
                      className="py-3 px-6 bg-white text-neutral-950 rounded-xl text-xs font-extrabold hover:bg-neutral-100 transition shadow"
                    >
                      Selesai & Sesi Baru
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      )}

      {/* PRINT-ONLY TARGET */}
      <div id="printOnly" aria-hidden="true">
        <img id="printImage" alt="SAI Studio Photostrip Printout" />
      </div>

      {/* ADMIN & SETTINGS MODAL */}
      <AdminSettingsModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
