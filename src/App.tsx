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
  Store,
  Layers,
  Maximize2,
  Minimize2,
  PartyPopper,
  Lock,
  SlidersHorizontal,
  Heart,
  Smartphone,
  Crop,
  Maximize,
  Ratio,
  ZoomIn,
  Eye,
  Grid,
  Trash2,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';
import { playCountdownBeep, playShutterSound, playSuccessChime } from './utils/audio';
import { createSamplePose } from './utils/samplePoses';
import { renderPhotostrip4R } from './utils/renderer4R';
import { renderEventPhotostrip } from './utils/eventRenderer';
import { renderDigitalPhoto } from './utils/digitalRenderer';
import { loadSettings, saveSettings, getThemeById, getActiveEvent } from './utils/storage';
import {
  AppMode,
  AppSettings,
  DigitalCanvasPreset,
  DigitalFitMode,
  DigitalLayoutDef,
  DigitalLayoutId,
  FilterCategory,
  FrameCustomization,
  FrameStyle,
  Layout4R,
} from './types/photobooth';
import {
  DIGITAL_CANVAS_PRESETS,
  DEFAULT_DIGITAL_PRESET,
  getDigitalPresetById,
} from './utils/digitalCanvasPresets';
import {
  DIGITAL_LAYOUTS,
  getDigitalLayoutsByCount,
  getDigitalLayoutById,
} from './utils/digitalLayouts';
import {
  FILTER_CATEGORIES,
  PHOTO_FILTERS,
  getFilterById,
  getCssFilterString,
} from './utils/filterPresets';
import {
  FRAME_COLOR_PRESETS,
  FRAME_STYLES,
  WEDDING_FRAME_PRESETS,
  DEFAULT_FRAME_CUSTOMIZATION,
  getAutoTextColor,
} from './utils/framePresets';
import { AdminSettingsModal } from './components/AdminSettingsModal';
import { AdminLoginModal } from './components/AdminLoginModal';

interface Layout4ROption {
  id: Layout4R;
  title: string;
  badge: string;
  desc: string;
  poses: number;
}

const LAYOUTS_4R: Layout4ROption[] = [
  {
    id: 'double_strip_4r',
    title: 'Double Photo Strip (4R)',
    badge: 'Souvenir / Gunting ✂',
    desc: 'Dua strip vertikal 2×6" berdampingan dengan garis potong tengah.',
    poses: 4,
  },
  {
    id: 'single_strip_4r',
    title: 'Single Photo Strip (4R)',
    badge: 'Klasik',
    desc: 'Satu strip vertikal elegan terpusat di lembar 4R.',
    poses: 4,
  },
  {
    id: 'grid_2x2_4r',
    title: 'Kolase 2 × 2 (4R)',
    badge: 'Best for Group',
    desc: 'Empat foto tersusun dalam 2 kolom × 2 baris seimbang.',
    poses: 4,
  },
  {
    id: 'collage_3_4r',
    title: 'Kolase 3 Foto (4R)',
    badge: '1 Utama + 2 Pendukung',
    desc: 'Satu foto utama besar di atas, didampingi 2 foto lebih kecil di bawah.',
    poses: 3,
  },
  {
    id: 'single_4r',
    title: 'Foto Tunggal 4R',
    badge: 'Portrait 4R',
    desc: 'Satu foto besar memenuhi lembar 4R dengan pengaturan posisi wajah.',
    poses: 1,
  },
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

  // Admin Auth State (Prototype password: 111101)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  // Active Mode: 'lite' | 'kiosk' | 'event' (maps 'general' to 'lite')
  const activeMode: AppMode = settings.activeMode === 'general' ? 'lite' : settings.activeMode;
  const activeEvent = useMemo(() => getActiveEvent(settings), [settings]);

  // Current Theme based on active mode
  const currentTheme = useMemo(() => {
    let themeId = settings.general.themeId;
    if (activeMode === 'kiosk') themeId = settings.kiosk.themeId;
    if (activeMode === 'event') themeId = activeEvent.themeId || settings.general.themeId;
    return getThemeById(themeId, settings.themes);
  }, [activeMode, activeEvent, settings]);

  // Wedding Mode check
  const [isWeddingThemeActive, setIsWeddingThemeActive] = useState(
    currentTheme.id === 'wedding-minimalist'
  );

  useEffect(() => {
    setIsWeddingThemeActive(currentTheme.id === 'wedding-minimalist');
  }, [currentTheme.id]);

  // Theme Class for centralized light/dark contrast
  const themeClass = isWeddingThemeActive
    ? 'theme-wedding'
    : currentTheme.isDark
    ? 'theme-dark'
    : 'theme-light';

  // Kiosk / Event Flow State
  const [hasStarted, setHasStarted] = useState(false);
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [soundEnabled, setSoundEnabled] = useState(settings.general.soundEnabled);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 4R Layout State
  const [selectedLayout4R, setSelectedLayout4R] = useState<Layout4R>(
    settings.kiosk.defaultLayout4R || 'double_strip_4r'
  );
  const [cropOffsetY, setCropOffsetY] = useState(0);

  // Camera & Capture State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isMirrored, setIsMirrored] = useState(settings.general.mirrorCamera);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isFlashing, setIsFlashing] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [retakeTargetIndex, setRetakeTargetIndex] = useState<number | null>(null);

  // ========================================================
  // LITE / DIGITAL MODE STATE
  // ========================================================
  const [selectedDigitalPresetId, setSelectedDigitalPresetId] = useState<string>(DEFAULT_DIGITAL_PRESET.id);
  const [digitalPhotoCount, setDigitalPhotoCount] = useState<number>(1); // 1 to 5
  const [selectedDigitalLayoutId, setSelectedDigitalLayoutId] = useState<DigitalLayoutId>('digital_1_full');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  const [showZoomModal, setShowZoomModal] = useState<boolean>(false);
  const [customDigitalWidth, setCustomDigitalWidth] = useState<number>(1080);
  const [customDigitalHeight, setCustomDigitalHeight] = useState<number>(1350);
  const [lockAspectRatio, setLockAspectRatio] = useState<boolean>(true);
  const [customAspectLockedRatio, setCustomAspectLockedRatio] = useState<number>(1080 / 1350);
  const [digitalFitMode, setDigitalFitMode] = useState<DigitalFitMode>('cover');
  const [digitalCropOffsetY, setDigitalCropOffsetY] = useState<number>(0);
  const [digitalFilter, setDigitalFilter] = useState<string>('original');
  const [digitalFilterCategory, setDigitalFilterCategory] = useState<FilterCategory | 'all'>('all');
  const [digitalFrame, setDigitalFrame] = useState<FrameCustomization>({
    ...DEFAULT_FRAME_CUSTOMIZATION,
    style: 'polaroid',
    color: '#ffffff',
    bgColor: '#ffffff',
    textColor: '#0f172a',
    gap: 12,
    margin: 16,
  });
  const [digitalCaption, setDigitalCaption] = useState<string>('SAI STUDIO');
  const [digitalShowDate, setDigitalShowDate] = useState<boolean>(true);
  const [digitalFormat, setDigitalFormat] = useState<'image/jpeg' | 'image/png'>('image/jpeg');
  const [digitalPreviewUrl, setDigitalPreviewUrl] = useState<string>('');
  const [isGeneratingDigitalPreview, setIsGeneratingDigitalPreview] = useState<boolean>(false);

  const handleSelectDigitalPhotoCount = (count: number) => {
    setDigitalPhotoCount(count);
    const availableLayouts = getDigitalLayoutsByCount(count);
    if (availableLayouts.length > 0) {
      setSelectedDigitalLayoutId(availableLayouts[0].id);
    }
  };

  // Active digital canvas dimensions
  const activeDigitalDimensions = useMemo(() => {
    if (selectedDigitalPresetId === 'custom') {
      return {
        width: Math.max(320, Math.min(3840, customDigitalWidth || 1080)),
        height: Math.max(320, Math.min(3840, customDigitalHeight || 1350)),
        ratioText: 'Custom',
      };
    }
    const preset = getDigitalPresetById(selectedDigitalPresetId) || DEFAULT_DIGITAL_PRESET;
    return {
      width: preset.width,
      height: preset.height,
      ratioText: preset.ratioText,
    };
  }, [selectedDigitalPresetId, customDigitalWidth, customDigitalHeight]);

  // ========================================================
  // KIOSK 4R CUSTOMIZATION STATE (STEP 4)
  // ========================================================
  const [selectedFilter, setSelectedFilter] = useState<string>('original');
  const [kioskFilterCategory, setKioskFilterCategory] = useState<FilterCategory | 'all'>('all');
  const [frameBg, setFrameBg] = useState<string>('#ffffff');
  const [frameTextColor, setFrameTextColor] = useState<string>('#141414');
  const [frameBorderColor, setFrameBorderColor] = useState<string>('#ffffff');
  const [customHexColor, setCustomHexColor] = useState<string>('#ffffff');
  const [customTitle, setCustomTitle] = useState<string>('SAI STUDIO');
  const [selectedStamp, setSelectedStamp] = useState<string>('✨');

  // Step 4 Live 4R Canvas Preview
  const [step4PreviewUrl, setStep4PreviewUrl] = useState<string>('');
  const [isGeneratingStep4Preview, setIsGeneratingStep4Preview] = useState(false);

  // Step 5 & Print State
  const [finalImageSrc, setFinalImageSrc] = useState<string>('');
  const [isBuildingFinal, setIsBuildingFinal] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [qrSecondsLeft, setQrSecondsLeft] = useState(30);
  const [qrExpired, setQrExpired] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Target Pose Count for current session
  const targetPoseCount = useMemo(() => {
    if (activeMode === 'lite') return digitalPhotoCount;
    if (activeMode === 'event') return activeEvent.photoCount;
    return 4; // Kiosk captures 4 poses to allow switching between any 4R layout
  }, [activeMode, activeEvent, digitalPhotoCount]);

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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, currentStep, activeMode]);

  useEffect(() => {
    if (activeMode === 'lite') {
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

  // Idle Timeout / Auto-Reset to Welcome Screen
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
      QRCode.toDataURL(`ID.QRIS.SAISTUDIO.35000.${Date.now()}`, {
        width: 220,
        margin: 1,
        color: { dark: '#111827', light: '#ffffff' },
      }).then((url) => setPaymentQrSrc(url));
    }
  }, [currentStep, activeMode]);

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

  // Capture sequence
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
        photoData = canvas.toDataURL('image/jpeg', 0.94);
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
        if (activeMode === 'lite' && capturedPhotos.length === 0) {
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

  // ========================================================
  // LIVE PREVIEW: LITE / DIGITAL MODE
  // ========================================================
  useEffect(() => {
    if (activeMode !== 'lite') return;
    let isCancelled = false;

    const updateDigitalPreview = async () => {
      setIsGeneratingDigitalPreview(true);
      try {
        const url = await renderDigitalPhoto({
          photos: capturedPhotos,
          targetCount: digitalPhotoCount,
          layoutId: selectedDigitalLayoutId,
          width: activeDigitalDimensions.width,
          height: activeDigitalDimensions.height,
          filterId: digitalFilter,
          fitMode: digitalFitMode,
          cropOffsetY: digitalCropOffsetY,
          frame: digitalFrame,
          caption: digitalCaption,
          dateStr: digitalShowDate ? getTodayFormatted() : '',
          isWeddingTheme: isWeddingThemeActive,
          weddingNames: isWeddingThemeActive ? settings.wedding.coupleNames : '',
          format: digitalFormat,
          quality: 0.92,
          isPreviewMode: true,
        });
        if (!isCancelled) {
          setDigitalPreviewUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate digital preview:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingDigitalPreview(false);
        }
      }
    };

    updateDigitalPreview();
    return () => {
      isCancelled = true;
    };
  }, [
    activeMode,
    capturedPhotos,
    digitalPhotoCount,
    selectedDigitalLayoutId,
    activeDigitalDimensions,
    digitalFilter,
    digitalFitMode,
    digitalCropOffsetY,
    digitalFrame,
    digitalCaption,
    digitalShowDate,
    digitalFormat,
    isWeddingThemeActive,
    settings.wedding.coupleNames,
  ]);

  // ========================================================
  // LIVE PREVIEW: KIOSK 4R STEP 4
  // ========================================================
  useEffect(() => {
    if (currentStep !== 4) return;
    let isCancelled = false;

    const updatePreview = async () => {
      setIsGeneratingStep4Preview(true);
      try {
        const url = await renderPhotostrip4R({
          photos: capturedPhotos,
          layout: selectedLayout4R,
          filter: selectedFilter,
          frameBgColor: frameBg,
          frameTextColor: frameTextColor,
          dateStr: getTodayFormatted(),
          title: customTitle || settings.general.appName,
          stamp: selectedStamp,
          isWeddingTheme: isWeddingThemeActive,
          weddingConfig: settings.wedding,
          cropOffsetY,
        });
        if (!isCancelled) {
          setStep4PreviewUrl(url);
        }
      } catch (err) {
        console.error('Failed to generate step 4 preview:', err);
      } finally {
        if (!isCancelled) {
          setIsGeneratingStep4Preview(false);
        }
      }
    };

    updatePreview();
    return () => {
      isCancelled = true;
    };
  }, [
    currentStep,
    capturedPhotos,
    selectedLayout4R,
    selectedFilter,
    frameBg,
    frameTextColor,
    customTitle,
    selectedStamp,
    isWeddingThemeActive,
    settings.wedding,
    cropOffsetY,
  ]);

  // Build Final Output
  const buildFinalOutput = async () => {
    if (!capturedPhotos.length) return;
    setIsBuildingFinal(true);
    try {
      let dataUrl = '';
      if (activeMode === 'lite') {
        dataUrl = await renderDigitalPhoto({
          photos: capturedPhotos,
          targetCount: digitalPhotoCount,
          layoutId: selectedDigitalLayoutId,
          width: activeDigitalDimensions.width,
          height: activeDigitalDimensions.height,
          filterId: digitalFilter,
          fitMode: digitalFitMode,
          cropOffsetY: digitalCropOffsetY,
          frame: digitalFrame,
          caption: digitalCaption,
          dateStr: digitalShowDate ? getTodayFormatted() : '',
          isWeddingTheme: isWeddingThemeActive,
          weddingNames: isWeddingThemeActive ? settings.wedding.coupleNames : '',
          format: digitalFormat,
          quality: 0.96,
          isPreviewMode: false,
        });
      } else if (activeMode === 'event' && activeEvent.framePngUrl) {
        dataUrl = await renderEventPhotostrip({
          photos: capturedPhotos,
          event: activeEvent,
          filter: selectedFilter === 'original' ? 'none' : getCssFilterString(selectedFilter),
        });
      } else {
        // Standard 4R Kiosk or Wedding Output
        dataUrl = await renderPhotostrip4R({
          photos: capturedPhotos,
          layout: selectedLayout4R,
          filter: selectedFilter,
          frameBgColor: frameBg,
          frameTextColor: frameTextColor,
          dateStr: getTodayFormatted(),
          title: customTitle || settings.general.appName,
          stamp: selectedStamp,
          isWeddingTheme: isWeddingThemeActive || currentTheme.id === 'wedding-minimalist',
          weddingConfig: settings.wedding,
          cropOffsetY,
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

  // Finish session (Kiosk)
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
      colors: ['#c5a059', '#f43f5e', '#a855f7', '#38bdf8', '#ffffff'],
    });
  };

  // Print
  const handlePrint = async () => {
    let src = finalImageSrc;
    if (!src) {
      src = (await buildFinalOutput()) || '';
    }
    const printImg = document.getElementById('printImage') as HTMLImageElement | null;
    if (printImg && src) {
      printImg.src = src;
      printImg.onload = () => setTimeout(() => window.print(), 100);
      if (printImg.complete) setTimeout(() => window.print(), 100);
    }
  };

  // Download
  const handleDownload = async () => {
    let src = finalImageSrc;
    if (!src) {
      src = (await buildFinalOutput()) || '';
    }
    if (!src) return;
    const link = document.createElement('a');
    link.href = src;
    const ext = digitalFormat === 'image/png' ? 'png' : 'jpg';
    const prefix =
      activeMode === 'lite'
        ? `SAI-Digital-${activeDigitalDimensions.width}x${activeDigitalDimensions.height}`
        : activeMode === 'event'
        ? activeEvent.name.replace(/\s+/g, '-')
        : 'SAI-Photobooth-4R';
    link.download = `${prefix}-${Date.now()}.${ext}`;
    link.click();
  };

  // Reset Session
  const handleResetSession = () => {
    stopCamera();
    setCapturedPhotos([]);
    setFinalImageSrc('');
    setStep4PreviewUrl('');
    setDigitalPreviewUrl('');
    setCountdown(null);
    setCurrentStep(1);
    setHasStarted(false);
    if (activeMode === 'lite') {
      startCamera();
    }
  };

  // Switch Mode
  const handleSwitchMode = (mode: AppMode) => {
    handleResetSession();
    const updated: AppSettings = { ...settings, activeMode: mode };
    setSettings(updated);
    saveSettings(updated);
  };

  // Save Settings from Admin Modal
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
    setSoundEnabled(newSettings.general.soundEnabled);
    setIsMirrored(newSettings.general.mirrorCamera);
    if (newSettings.kiosk.defaultLayout4R) {
      setSelectedLayout4R(newSettings.kiosk.defaultLayout4R);
    }
    if (newSettings.kiosk.themeId === 'wedding-minimalist') {
      setIsWeddingThemeActive(true);
    }
  };

  // Admin Logout Handler
  const handleAdminLogout = () => {
    setIsAdminLoggedIn(false);
    setShowAdminModal(false);
  };

  return (
    <div
      className={`min-h-screen ${themeClass} flex flex-col justify-between relative overflow-hidden transition-colors duration-300 font-${currentTheme.fontFamily}`}
      style={{
        backgroundColor: 'var(--app-bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className={`absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-20 blur-[100px] bg-gradient-to-tr ${currentTheme.accentGradient}`}
        />
        <div className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full opacity-15 blur-[120px] bg-purple-600 animate-orb-2" />
      </div>

      {/* Shutter flash effect */}
      <div
        className={`fixed inset-0 bg-white pointer-events-none z-50 transition-opacity duration-200 ${
          isFlashing ? 'opacity-95' : 'opacity-0'
        }`}
      />

      {/* TOP BAR / NAVIGATION */}
      <header className="p-3 md:p-4 flex flex-wrap justify-between items-center z-20 glass-panel border border-[var(--panel-border)] m-3 rounded-2xl gap-3">
        {/* Brand Lockup */}
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${currentTheme.accentGradient} flex items-center justify-center shadow-md font-bold text-lg text-white`}
          >
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-extrabold tracking-wide text-[var(--text-primary)]">
              {settings.general.appName}
              <span className="text-amber-500 font-serif-title italic ml-1.5">
                {activeMode === 'lite' ? 'Lite / Digital' : 'Photobooth Studio'}
              </span>
            </h1>
            <p className="text-[10px] text-[var(--text-muted)] font-medium">
              {activeMode === 'lite'
                ? 'Social Media & Digital Sharing (IG, TikTok, FB, WA)'
                : activeMode === 'event'
                ? `Event: ${activeEvent.name}`
                : 'Photobooth Kiosk Standar 4R (300 DPI)'}
            </p>
          </div>
        </div>

        {/* MODE SELECTOR TABS */}
        <div className="flex items-center p-1 glass-card rounded-xl text-xs font-semibold">
          {/* Lite / Digital Mode (Formerly General) */}
          <button
            onClick={() => handleSwitchMode('lite')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'lite'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Lite / Digital</span>
          </button>

          {/* Kiosk Mode (4R Print) */}
          <button
            onClick={() => handleSwitchMode('kiosk')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'kiosk'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            <span>Kiosk 4R</span>
          </button>

          {/* Event Mode */}
          <button
            onClick={() => handleSwitchMode('event')}
            className={`py-1.5 px-3 rounded-lg transition flex items-center gap-1.5 cursor-pointer ${
              activeMode === 'event'
                ? 'bg-amber-500 text-neutral-950 font-bold shadow-sm'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <PartyPopper className="w-3.5 h-3.5 text-amber-500" />
            <span>Event Mode</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Admin Button with Password Protection */}
          <button
            onClick={() => {
              if (isAdminLoggedIn) {
                setShowAdminModal(true);
              } else {
                setShowLoginModal(true);
              }
            }}
            title="Buka panel admin"
            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
              isAdminLoggedIn
                ? 'bg-amber-500/20 border border-amber-500/40 text-amber-600 dark:text-amber-300 shadow-sm'
                : 'glass-button text-[var(--text-primary)] hover:opacity-90'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Admin</span>
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh Kiosk'}
            className="glass-button p-2.5 rounded-xl text-[var(--text-primary)] hidden sm:flex cursor-pointer"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4 text-purple-500" />}
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            title={soundEnabled ? 'Matikan Suara' : 'Nyalakan Suara'}
            className="glass-button p-2.5 rounded-xl text-[var(--text-primary)] cursor-pointer"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-amber-500" /> : <VolumeX className="w-4 h-4 text-[var(--text-muted)]" />}
          </button>

          {/* Reset Button */}
          <button
            onClick={handleResetSession}
            title="Reset Sesi Foto"
            className="glass-button px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] hover:text-rose-500 flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </header>

      {/* ========================================================
          MODE A: LITE / DIGITAL (SOSMED & KONTEN DIGITAL)
         ======================================================== */}
      {activeMode === 'lite' && (
        <main className="flex-1 relative flex items-center justify-center p-3 md:p-6 z-10 overflow-y-auto">
          <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Viewfinder & Slot Status Column (Left) */}
            <div className="lg:col-span-5 glass-panel p-4 md:p-6 rounded-3xl flex flex-col items-center space-y-4">
              <div className="w-full flex items-center justify-between">
                <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-amber-500" /> Kamera Live View
                </span>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  {isMirrored ? 'Mode Cermin (Mirror)' : 'Mode Normal'}
                </span>
              </div>

              {/* Viewfinder Video */}
              <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-2xl overflow-hidden shadow-xl border border-[var(--panel-border)] flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${isMirrored ? '-scale-x-100' : 'scale-x-100'}`}
                />

                {(!cameraStream || cameraError) && (
                  <div className="absolute inset-0 bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                    <Camera className="w-10 h-10 text-amber-400 mb-2" />
                    <h4 className="font-bold text-white text-sm">Kamera Belum Aktif</h4>
                    <p className="text-xs text-neutral-300 mt-1 mb-4">
                      {cameraError || 'Izinkan kamera browser atau gunakan foto studio demo.'}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={startCamera}
                        className="py-2 px-4 bg-white text-neutral-950 font-bold rounded-xl text-xs shadow cursor-pointer"
                      >
                        Buka Kamera
                      </button>
                      <button
                        onClick={loadDemoPoses}
                        className="py-2 px-4 glass-button text-white font-bold rounded-xl text-xs cursor-pointer"
                      >
                        Foto Demo
                      </button>
                    </div>
                  </div>
                )}

                {countdown !== null && (
                  <div className="absolute inset-0 bg-neutral-950/40 backdrop-blur-sm flex flex-col items-center justify-center z-20">
                    <span className="text-8xl font-black text-white drop-shadow-2xl animate-pulse">
                      {countdown === 0 ? '📸' : countdown}
                    </span>
                    <span className="text-xs font-bold tracking-widest uppercase text-amber-300 mt-2">
                      {countdown === 0 ? 'SMILE!' : `POSE #${(retakeTargetIndex !== null ? retakeTargetIndex : capturedPhotos.length) + 1} - BERSIAP!`}
                    </span>
                  </div>
                )}
              </div>

              {/* Viewfinder Action Buttons */}
              <div className="w-full flex items-center justify-between gap-2 flex-wrap">
                <button
                  onClick={() => setIsMirrored(!isMirrored)}
                  className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer"
                >
                  <FlipHorizontal className="w-4 h-4 text-cyan-500" />
                  <span>Cermin</span>
                </button>

                <button
                  onClick={() => startCapture()}
                  disabled={countdown !== null}
                  className="flex-1 py-3 px-5 rounded-2xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-neutral-950 font-extrabold text-xs md:text-sm shadow-lg shadow-amber-500/25 flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  <Camera className="w-4 h-4 text-neutral-950" />
                  <span>
                    {capturedPhotos.length < digitalPhotoCount
                      ? `Ambil Foto #${capturedPhotos.length + 1} (Spasi)`
                      : 'Ambil Ulang Terakhir (Spasi)'}
                  </span>
                </button>

                <label className="glass-button px-3 py-2 rounded-xl text-xs font-semibold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer">
                  <Upload className="w-4 h-4 text-purple-500" />
                  <span>Upload</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleUploadPhoto}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Slot Indicator & Individual Retake Panel */}
              <div className="w-full pt-3 border-t border-[var(--panel-border)] space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Grid className="w-3.5 h-3.5 text-amber-500" /> Slot Foto ({capturedPhotos.length} dari {digitalPhotoCount} Terisi)
                  </span>
                  {capturedPhotos.length > 0 && (
                    <button
                      onClick={() => setCapturedPhotos([])}
                      className="text-rose-500 text-[11px] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Hapus Semua
                    </button>
                  )}
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, (capturedPhotos.length / digitalPhotoCount) * 100)}%` }}
                  />
                </div>

                {/* Slots Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
                  {Array.from({ length: digitalPhotoCount }).map((_, slotIdx) => {
                    const hasPhoto = !!capturedPhotos[slotIdx];
                    const isNext = capturedPhotos.length === slotIdx;
                    return (
                      <div
                        key={slotIdx}
                        className={`p-2 rounded-xl border flex flex-col items-center gap-1.5 transition text-center ${
                          hasPhoto
                            ? 'glass-card border-[var(--panel-border)]'
                            : isNext
                            ? 'border-dashed border-amber-500 bg-amber-500/10'
                            : 'border-dashed border-[var(--panel-border)] opacity-60'
                        }`}
                      >
                        <div className="w-full aspect-[4/3] rounded-lg overflow-hidden bg-neutral-900 border border-black/10 flex items-center justify-center relative">
                          {hasPhoto ? (
                            <>
                              <img
                                src={capturedPhotos[slotIdx]}
                                alt={`Slot ${slotIdx + 1}`}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-bold text-white">
                                #{slotIdx + 1}
                              </div>
                            </>
                          ) : (
                            <div className="flex flex-col items-center justify-center p-1">
                              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">#{slotIdx + 1}</span>
                              <span className="text-[8px] text-[var(--text-muted)]">Kosong</span>
                            </div>
                          )}
                        </div>

                        <div className="w-full flex justify-between items-center text-[10px]">
                          <span className="font-bold text-[var(--text-primary)]">Foto {slotIdx + 1}</span>
                          <button
                            onClick={() => startCapture(slotIdx)}
                            className="font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                          >
                            {hasPhoto ? 'Ulangi' : 'Ambil'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Editor & Live Preview Column (Right) */}
            <div className="lg:col-span-7 glass-panel p-5 md:p-7 rounded-3xl space-y-6">
              {/* Header Title with Dimensions & Zoom */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base md:text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-amber-500" /> Editor Foto Lite / Digital
                  </h3>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Desain foto digital kolase 1–5 foto dengan ukuran media sosial presisi.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowZoomModal(true)}
                    className="py-1.5 px-3 glass-button rounded-xl text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                    title="Perbesar preview kanvas"
                  >
                    <ZoomIn className="w-3.5 h-3.5 text-amber-500" />
                    <span>Perbesar</span>
                  </button>

                  <div className="px-2.5 py-1 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-600 dark:text-cyan-300 font-mono text-xs font-bold">
                    {activeDigitalDimensions.width} × {activeDigitalDimensions.height} px ({activeDigitalDimensions.ratioText})
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------
                  PROMINENT LIVE PREVIEW BOX (PRIORITAS UTAMA)
                 ---------------------------------------------------- */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-amber-500" /> Live Preview Kanvas (Tampilan Utuh Sesuai Hasil Akhir)
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Mode: <strong className="text-amber-500">{digitalFitMode === 'cover' ? 'Fill (Penuh)' : 'Fit (Utuh)'}</strong>
                  </span>
                </div>

                <div
                  onClick={() => setShowZoomModal(true)}
                  className="w-full rounded-2xl glass-card border border-[var(--panel-border)] p-2 shadow-xl flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-amber-500/40 transition group relative"
                  style={{ minHeight: '260px', maxHeight: '460px' }}
                >
                  {isGeneratingDigitalPreview ? (
                    <div className="py-20 text-center text-xs text-[var(--text-muted)] flex flex-col items-center">
                      <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mb-2" />
                      Memperbarui komposisi kanvas digital...
                    </div>
                  ) : digitalPreviewUrl ? (
                    <img
                      src={digitalPreviewUrl}
                      alt="Digital Live Preview"
                      className="max-h-[440px] max-w-full object-contain rounded-xl shadow-md transition-transform duration-200 group-hover:scale-[1.01]"
                    />
                  ) : (
                    <div className="py-16 text-center text-xs text-[var(--text-muted)]">
                      <ImageIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2 opacity-50" />
                      Memuat kanvas digital...
                    </div>
                  )}

                  <div className="absolute bottom-3 right-3 py-1 px-2.5 rounded-lg bg-black/70 backdrop-blur-sm text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition flex items-center gap-1">
                    <ZoomIn className="w-3 h-3 text-amber-400" /> Klik Untuk Memperbesar
                  </div>
                </div>
              </div>

              {/* ----------------------------------------------------
                  ALUR PENGATURAN TERTATA & BERTAHAP
                 ---------------------------------------------------- */}

              {/* 1. UKURAN KANVAS SOSIAL MEDIA */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-[var(--text-primary)] block">
                  1. Ukuran Kanvas Sosial Media:
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DIGITAL_CANVAS_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedDigitalPresetId(p.id)}
                      className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                        selectedDigitalPresetId === p.id
                          ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 text-[var(--text-primary)]'
                          : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{p.badge}</span>
                        <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">{p.ratioText}</span>
                      </div>
                      <div className="font-bold text-xs truncate">{p.name}</div>
                      <div className="text-[10px] text-[var(--text-muted)] font-mono">{p.width}×{p.height} px</div>
                    </button>
                  ))}

                  {/* Custom Size Option */}
                  <button
                    type="button"
                    onClick={() => setSelectedDigitalPresetId('custom')}
                    className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                      selectedDigitalPresetId === 'custom'
                        ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 text-[var(--text-primary)]'
                        : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:opacity-90'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400">Custom</span>
                      <span className="text-[10px] font-mono text-[var(--text-muted)] font-semibold">Bebas</span>
                    </div>
                    <div className="font-bold text-xs">Ukuran Sendiri</div>
                    <div className="text-[10px] text-[var(--text-muted)] font-mono">Input Px Manual</div>
                  </button>
                </div>

                {/* Custom Dimensions Form */}
                {selectedDigitalPresetId === 'custom' && (
                  <div className="p-3.5 rounded-2xl glass-card border border-[var(--panel-border)] mt-2 space-y-2 text-xs">
                    <span className="font-bold text-[var(--text-primary)] block">Kustomisasi Dimensi Kanvas:</span>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[11px] text-[var(--text-muted)] block mb-1">Lebar (px):</label>
                        <input
                          type="number"
                          min={320}
                          max={3840}
                          value={customDigitalWidth}
                          onChange={(e) => {
                            const val = Math.max(320, Math.min(3840, Number(e.target.value) || 1080));
                            setCustomDigitalWidth(val);
                            if (lockAspectRatio && customAspectLockedRatio > 0) {
                              setCustomDigitalHeight(Math.round(val / customAspectLockedRatio));
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-lg themed-input font-mono"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-[var(--text-muted)] block mb-1">Tinggi (px):</label>
                        <input
                          type="number"
                          min={320}
                          max={3840}
                          value={customDigitalHeight}
                          onChange={(e) => {
                            const val = Math.max(320, Math.min(3840, Number(e.target.value) || 1080));
                            setCustomDigitalHeight(val);
                            if (lockAspectRatio && customAspectLockedRatio > 0) {
                              setCustomDigitalWidth(Math.round(val * customAspectLockedRatio));
                            }
                          }}
                          className="w-full px-3 py-1.5 rounded-lg themed-input font-mono"
                        />
                      </div>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer pt-1">
                      <input
                        type="checkbox"
                        checked={lockAspectRatio}
                        onChange={(e) => {
                          setLockAspectRatio(e.target.checked);
                          if (e.target.checked && customDigitalHeight > 0) {
                            setCustomAspectLockedRatio(customDigitalWidth / customDigitalHeight);
                          }
                        }}
                        className="w-4 h-4 rounded text-amber-500"
                      />
                      <span className="text-[11px] text-[var(--text-primary)] font-medium">Kunci Rasio Aspek (Lock Aspect Ratio)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* 2. JUMLAH FOTO & VARIASI KOLASE (1 - 5 FOTO) */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    2. Jumlah Foto & Variasi Kolase (1–5 Foto):
                  </label>
                  <span className="text-[11px] text-[var(--text-muted)] font-medium">
                    Ganti layout kapan saja tanpa foto ulang
                  </span>
                </div>

                {/* Photo Count Tabs (1 to 5) */}
                <div className="grid grid-cols-5 gap-1.5 text-xs">
                  {[1, 2, 3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => handleSelectDigitalPhotoCount(cnt)}
                      className={`py-2 px-1 rounded-xl font-extrabold border transition text-center cursor-pointer ${
                        digitalPhotoCount === cnt
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                          : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <span>{cnt} Foto</span>
                    </button>
                  ))}
                </div>

                {/* Layout Variations for Selected Photo Count */}
                <div className="space-y-1 pt-1">
                  <span className="text-[11px] text-[var(--text-muted)] block font-semibold">Pilih Variasi Layout:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {getDigitalLayoutsByCount(digitalPhotoCount).map((lay) => (
                      <button
                        key={lay.id}
                        type="button"
                        onClick={() => setSelectedDigitalLayoutId(lay.id)}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          selectedDigitalLayoutId === lay.id
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30 text-[var(--text-primary)]'
                            : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:opacity-90'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">{lay.badge}</span>
                        </div>
                        <div className="font-bold text-xs truncate text-[var(--text-primary)]">{lay.name}</div>
                        <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{lay.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* 3. MODE TAMPILAN FOTO (FIT VS FILL & CROP POSITION) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[var(--text-primary)] block">
                    3. Mode Tampilan Foto (Fit vs Fill):
                  </label>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setDigitalFitMode('cover')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        digitalFitMode === 'cover'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                          : 'glass-card text-[var(--text-secondary)]'
                      }`}
                    >
                      <Crop className="w-3.5 h-3.5" />
                      <span>Fill (Penuh)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDigitalFitMode('contain')}
                      className={`py-2 px-3 rounded-xl font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                        digitalFitMode === 'contain'
                          ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                          : 'glass-card text-[var(--text-secondary)]'
                      }`}
                    >
                      <Maximize className="w-3.5 h-3.5" />
                      <span>Fit (Utuh Proporsional)</span>
                    </button>
                  </div>
                </div>

                {digitalFitMode === 'cover' ? (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold text-[var(--text-primary)]">Posisi Crop Vertikal / Wajah:</span>
                      <span className="text-amber-500 font-mono font-bold">
                        {digitalCropOffsetY > 0 ? `+${digitalCropOffsetY}%` : `${digitalCropOffsetY}%`}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="-40"
                      max="40"
                      value={digitalCropOffsetY}
                      onChange={(e) => setDigitalCropOffsetY(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                      <span>Atas</span>
                      <span>Tengah (Default)</span>
                      <span>Bawah</span>
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-xl glass-card border border-[var(--panel-border)] text-[11px] text-[var(--text-muted)]">
                    Foto ditampilkan secara utuh tanpa pemotongan kepala/badan.
                  </div>
                )}
              </div>

              {/* 4. FILTER FOTO DENGAN THUMBNAIL LIVE */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-[var(--text-primary)]">
                    4. Filter Foto (30+ Pilihan Terkategori):
                  </label>
                  <button
                    type="button"
                    onClick={() => setDigitalFilter('original')}
                    className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                  >
                    Reset Filter (Original)
                  </button>
                </div>

                {/* Filter Category Tabs */}
                <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                  {FILTER_CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setDigitalFilterCategory(cat.id)}
                      className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                        digitalFilterCategory === cat.id
                          ? 'bg-amber-500 text-neutral-950'
                          : 'glass-button text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Filter Thumbnails Grid */}
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1">
                  {PHOTO_FILTERS.filter(
                    (f) => digitalFilterCategory === 'all' || f.category === digitalFilterCategory
                  ).map((f) => {
                    const isSelected = digitalFilter === f.id;
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setDigitalFilter(f.id)}
                        className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                            : 'glass-card border-[var(--panel-border)] hover:opacity-90'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 border border-black/10 shrink-0">
                          {capturedPhotos[0] ? (
                            <img
                              src={capturedPhotos[0]}
                              alt={f.name}
                              style={{ filter: f.cssFilter }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              style={{ filter: f.cssFilter }}
                              className="w-full h-full bg-gradient-to-tr from-rose-400 to-amber-300"
                            />
                          )}
                        </div>
                        <span className="text-[10px] font-bold text-[var(--text-primary)] truncate max-w-full">
                          {f.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 5. PENGATURAN LANJUTAN (ACCORDION COLLAPSIBLE) */}
              <div className="border border-[var(--panel-border)] rounded-2xl overflow-hidden glass-card">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                  className="w-full p-3.5 flex items-center justify-between text-left text-xs font-bold text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/5 transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-amber-500" />
                    <span>Pengaturan Lanjutan (Bingkai, Warna, Teks, & Ornamen)</span>
                  </span>
                  {showAdvancedSettings ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </button>

                {showAdvancedSettings && (
                  <div className="p-4 pt-1 border-t border-[var(--panel-border)] space-y-4">
                    {/* Wedding Minimalist Toggle */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl glass-card border border-[var(--panel-border)]">
                      <div>
                        <span className="text-xs font-bold text-[var(--text-primary)] block">Tema Wedding Minimalist</span>
                        <span className="text-[10px] text-[var(--text-muted)]">Nuansa White Elegance & Champagne Gold</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsWeddingThemeActive(!isWeddingThemeActive)}
                        className={`py-1 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
                          isWeddingThemeActive
                            ? 'bg-amber-500 text-neutral-950 shadow-sm'
                            : 'glass-button text-[var(--text-secondary)]'
                        }`}
                      >
                        {isWeddingThemeActive ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </div>

                    {/* Frame Styles */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-primary)] block">Gaya Bingkai & Frame:</label>
                      <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 text-xs">
                        {FRAME_STYLES.map((fs) => (
                          <button
                            key={fs.id}
                            type="button"
                            onClick={() =>
                              setDigitalFrame((prev) => ({
                                ...prev,
                                style: fs.id,
                                thickness: fs.defaultThickness,
                                padding: fs.defaultPadding,
                                radius: fs.defaultRadius,
                              }))
                            }
                            className={`p-2 rounded-xl border text-center font-bold transition cursor-pointer ${
                              digitalFrame.style === fs.id
                                ? 'bg-amber-500 text-neutral-950 border-amber-500 shadow-sm'
                                : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <span className="text-[11px]">{fs.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* 18 Frame Color Presets */}
                    {digitalFrame.style !== 'none' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-[var(--text-primary)]">18 Preset Warna Bingkai:</span>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                              <span>Picker</span>
                              <input
                                type="color"
                                value={digitalFrame.color}
                                onChange={(e) => {
                                  const hex = e.target.value;
                                  setDigitalFrame((prev) => ({
                                    ...prev,
                                    color: hex,
                                    bgColor: hex,
                                    textColor: getAutoTextColor(hex),
                                  }));
                                }}
                                className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                              />
                            </label>
                            <input
                              type="text"
                              maxLength={7}
                              value={digitalFrame.color}
                              onChange={(e) => {
                                const hex = e.target.value;
                                setDigitalFrame((prev) => ({
                                  ...prev,
                                  color: hex,
                                  bgColor: hex,
                                  textColor: getAutoTextColor(hex),
                                }));
                              }}
                              className="w-18 px-1.5 py-0.5 rounded text-[10px] font-mono themed-input uppercase text-center"
                            />
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1.5 items-center">
                          {FRAME_COLOR_PRESETS.map((c) => (
                            <button
                              key={c.name}
                              type="button"
                              onClick={() =>
                                setDigitalFrame((prev) => ({
                                  ...prev,
                                  color: c.hex,
                                  bgColor: c.hex,
                                  textColor: c.textColor,
                                }))
                              }
                              title={c.name}
                              className={`w-7 h-7 rounded-lg border-2 transition cursor-pointer ${
                                digitalFrame.color === c.hex
                                  ? 'ring-2 ring-amber-500 scale-110 shadow-md border-amber-500'
                                  : 'border-black/20 opacity-80 hover:opacity-100'
                              }`}
                              style={{ backgroundColor: c.hex }}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Frame Sliders: Thickness, Gap, Margin, Radius */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                          Ketebalan ({digitalFrame.thickness}px):
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={36}
                          value={digitalFrame.thickness}
                          onChange={(e) =>
                            setDigitalFrame((prev) => ({ ...prev, thickness: Number(e.target.value) }))
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                          Jarak Foto ({digitalFrame.gap ?? 12}px):
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={30}
                          value={digitalFrame.gap ?? 12}
                          onChange={(e) =>
                            setDigitalFrame((prev) => ({ ...prev, gap: Number(e.target.value) }))
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                          Margin Luar ({digitalFrame.margin ?? 16}px):
                        </label>
                        <input
                          type="range"
                          min={4}
                          max={48}
                          value={digitalFrame.margin ?? 16}
                          onChange={(e) =>
                            setDigitalFrame((prev) => ({ ...prev, margin: Number(e.target.value) }))
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-[var(--text-muted)] block mb-1">
                          Sudut ({digitalFrame.radius}px):
                        </label>
                        <input
                          type="range"
                          min={0}
                          max={32}
                          value={digitalFrame.radius}
                          onChange={(e) =>
                            setDigitalFrame((prev) => ({ ...prev, radius: Number(e.target.value) }))
                          }
                          className="w-full accent-amber-500"
                        />
                      </div>
                    </div>

                    {/* Text Title & Date Footer */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="text-xs font-bold text-[var(--text-primary)] block mb-1">
                          {isWeddingThemeActive ? 'Nama Pasangan Wedding:' : 'Teks / Judul Foto:'}
                        </label>
                        <input
                          type="text"
                          maxLength={28}
                          value={isWeddingThemeActive ? settings.wedding.coupleNames : digitalCaption}
                          onChange={(e) => {
                            if (isWeddingThemeActive) {
                              setSettings((prev) => ({
                                ...prev,
                                wedding: { ...prev.wedding, coupleNames: e.target.value },
                              }));
                            } else {
                              setDigitalCaption(e.target.value);
                            }
                          }}
                          placeholder="SAI STUDIO"
                          className="w-full px-3 py-2 rounded-xl themed-input text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-4">
                        <label className="flex items-center gap-2 cursor-pointer text-xs">
                          <input
                            type="checkbox"
                            checked={digitalShowDate}
                            onChange={(e) => setDigitalShowDate(e.target.checked)}
                            className="w-4 h-4 rounded text-amber-500"
                          />
                          <span className="font-bold text-[var(--text-primary)]">Tampilkan Tanggal ({getTodayFormatted()})</span>
                        </label>

                        <div className="flex items-center gap-1.5 ml-auto">
                          <span className="text-xs text-[var(--text-muted)] font-bold">Format:</span>
                          <button
                            type="button"
                            onClick={() => setDigitalFormat('image/jpeg')}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                              digitalFormat === 'image/jpeg' ? 'bg-amber-500 text-neutral-950' : 'glass-button'
                            }`}
                          >
                            JPG
                          </button>
                          <button
                            type="button"
                            onClick={() => setDigitalFormat('image/png')}
                            className={`px-2 py-1 rounded text-[10px] font-bold cursor-pointer ${
                              digitalFormat === 'image/png' ? 'bg-amber-500 text-neutral-950' : 'glass-button'
                            }`}
                          >
                            PNG
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-[var(--panel-border)] flex flex-col sm:flex-row gap-3 items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-[var(--text-primary)] block">Ekspor Desain Digital</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Resolusi tajam: {activeDigitalDimensions.width} × {activeDigitalDimensions.height} px
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={async () => {
                      await buildFinalOutput();
                      handleDownload();
                    }}
                    disabled={capturedPhotos.length === 0}
                    className={`flex-1 sm:flex-initial py-3.5 px-6 rounded-2xl font-extrabold text-xs md:text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 cursor-pointer ${
                      capturedPhotos.length > 0
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 shadow-amber-500/25'
                        : 'bg-white/10 text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    <Download className="w-4 h-4 text-neutral-950" />
                    <span>Unduh Foto Digital ({digitalFormat === 'image/png' ? 'PNG' : 'JPG'})</span>
                  </button>

                  <button
                    onClick={async () => {
                      await buildFinalOutput();
                      handlePrint();
                    }}
                    disabled={capturedPhotos.length === 0}
                    className="py-3.5 px-4 glass-button rounded-2xl text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 cursor-pointer hover:opacity-90"
                    title="Cetak foto jika diinginkan"
                  >
                    <Printer className="w-4 h-4 text-amber-500" />
                    <span className="hidden sm:inline">Cetak</span>
                  </button>
                </div>
              </div>
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
            <section
              className="fixed inset-0 z-40 flex items-center justify-center p-6 backdrop-blur-2xl"
              style={{ backgroundColor: 'var(--overlay-bg)' }}
            >
              <div className="relative w-full max-w-lg text-center">
                <div className="glass-panel rounded-3xl p-8 md:p-12 border border-[var(--panel-border)] shadow-2xl">
                  {/* Wedding Badge or Event Logo */}
                  {isWeddingThemeActive ? (
                    <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 via-yellow-500 to-amber-600 flex items-center justify-center shadow-xl shadow-amber-500/30 mb-6 text-neutral-950">
                      <Heart className="w-10 h-10 text-neutral-950 fill-neutral-950" />
                    </div>
                  ) : activeMode === 'event' && activeEvent.logoUrl ? (
                    <img
                      src={activeEvent.logoUrl}
                      alt={activeEvent.name}
                      className="w-20 h-20 mx-auto object-contain mb-5"
                    />
                  ) : (
                    <div
                      className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-tr ${currentTheme.accentGradient} flex items-center justify-center shadow-xl shadow-amber-500/30 mb-6`}
                    >
                      <Camera className="w-10 h-10 text-white" />
                    </div>
                  )}

                  <p className="text-xs font-bold tracking-[0.3em] uppercase text-amber-500 mb-2">
                    {activeMode === 'event'
                      ? activeEvent.name
                      : isWeddingThemeActive
                      ? settings.wedding.subtext || 'THE WEDDING OF'
                      : settings.general.appName}
                  </p>
                  <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight text-[var(--text-primary)]">
                    {activeMode === 'event'
                      ? activeEvent.welcomeHeadline
                      : isWeddingThemeActive
                      ? settings.wedding.coupleNames || 'Sarah & Dimas'
                      : settings.kiosk.welcomeTitle}
                  </h2>
                  <h3 className="font-serif-title italic text-2xl md:text-3xl text-amber-600 dark:text-amber-300 mt-1">
                    {activeMode === 'event'
                      ? activeEvent.welcomeSubheadline
                      : isWeddingThemeActive
                      ? settings.wedding.weddingDate || '24.10.2026'
                      : 'Abadikan momentmu yuk!'}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-4 leading-relaxed max-w-md mx-auto">
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
                    className="mt-8 w-full py-4 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-neutral-950 rounded-2xl font-extrabold text-base shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>
                      {activeMode === 'event'
                        ? 'Mulai Foto Acara Ini'
                        : settings.kiosk.startButtonText || 'Mulai Sesi Foto'}
                    </span>
                    <ChevronRight className="w-5 h-5 text-neutral-950" />
                  </button>

                  <div className="mt-6 flex items-center justify-center gap-4 text-xs text-[var(--text-muted)]">
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" /> 5 Pilihan Layout 4R
                    </span>
                    <span>·</span>
                    <span className="flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-500" /> Cetak 300 DPI Epson L320
                    </span>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 1: INITIAL 4R LAYOUT PRE-SELECTION (KIOSK ONLY) */}
          {currentStep === 1 && activeMode === 'kiosk' && (
            <section className="w-full max-w-4xl py-4">
              <div className="text-center mb-8">
                <span className="text-xs font-bold tracking-widest uppercase text-amber-500">
                  STANDAR CETAK 4R (4 × 6 INCI)
                </span>
                <h2 className="text-3xl md:text-5xl font-extrabold text-[var(--text-primary)] mt-2">
                  Pilih Layout Foto 4R
                </h2>
                <p className="text-sm text-[var(--text-secondary)] mt-2 max-w-lg mx-auto">
                  Semua pilihan dicetak pada 1 lembar kertas foto 4R standar (1200 × 1800 px @ 300 DPI). Anda tetap bisa mengganti layout setelah sesi foto!
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {LAYOUTS_4R.map((l) => (
                  <div
                    key={l.id}
                    onClick={() => {
                      setSelectedLayout4R(l.id);
                      if (settings.kiosk.showQRIS) {
                        setCurrentStep(2);
                      } else {
                        setCurrentStep(3);
                        startCamera();
                      }
                    }}
                    className={`glass-panel p-5 rounded-3xl border cursor-pointer group hover:-translate-y-1 transition-all duration-200 relative overflow-hidden flex flex-col justify-between ${
                      selectedLayout4R === l.id
                        ? 'border-amber-500 ring-2 ring-amber-500/25'
                        : 'border-[var(--panel-border)] hover:border-amber-500/50'
                    }`}
                  >
                    <div>
                      <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30">
                          {l.badge}
                        </span>
                        <span className="text-xl font-black text-[var(--text-primary)]">Rp 35.000</span>
                      </div>

                      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1.5 group-hover:text-amber-500 transition-colors">
                        {l.title}
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">{l.desc}</p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[var(--panel-border)]">
                      <span className="text-[11px] text-[var(--text-muted)]">{l.poses} Pose Sesi</span>
                      <button className="w-8 h-8 rounded-full bg-amber-500 text-neutral-950 flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
                        <ChevronRight className="w-4 h-4 text-neutral-950" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* STEP 2: PEMBAYARAN QRIS */}
          {currentStep === 2 && activeMode === 'kiosk' && (
            <section className="w-full max-w-md py-4">
              <div className="glass-panel rounded-3xl p-8 text-center shadow-2xl relative overflow-hidden border border-[var(--panel-border)]">
                <span className="text-xs font-semibold text-amber-500 uppercase tracking-wider">Langkah Pembayaran</span>
                <h2 className="text-2xl font-bold text-[var(--text-primary)] mt-1">Pembayaran QRIS</h2>
                <p className="text-xs text-[var(--text-secondary)] mt-1">
                  Scan QR Code berikut menggunakan e-Wallet atau Mobile Banking untuk memulai sesi foto 4R.
                </p>

                <div className="bg-white p-5 rounded-2xl inline-block shadow-xl my-6 border border-black/10">
                  {paymentQrSrc ? (
                    <img src={paymentQrSrc} alt="QRIS SAI Studio" className="w-48 h-48 mx-auto" />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-neutral-400 text-xs">Menyiapkan QR...</div>
                  )}
                  <div className="mt-2 pt-2 border-t border-neutral-200 flex items-center justify-between text-xs text-neutral-800 font-bold">
                    <span>Sesi Foto 4R</span>
                    <span className="text-amber-600 font-extrabold text-sm">Rp 35.000</span>
                  </div>
                </div>

                <div className="glass-card py-3 px-4 rounded-xl flex items-center justify-center gap-2 mb-6">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-xs text-[var(--text-secondary)] font-medium">Menunggu Verifikasi Pembayaran...</span>
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
                    className="w-full py-3 glass-button text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer"
                  >
                    Batal & Pilih Layout Lain
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
                <div className="lg:col-span-3 glass-panel rounded-3xl p-4 md:p-6 relative flex flex-col items-center border border-[var(--panel-border)]">
                  <div className="relative w-full aspect-[4/3] bg-neutral-950 rounded-2xl overflow-hidden shadow-2xl border border-[var(--panel-border)] flex items-center justify-center">
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
                          <Camera className="w-10 h-10 text-amber-400 mx-auto mb-3" />
                          <h3 className="text-lg font-bold text-white">Kamera Belum Aktif</h3>
                          <p className="text-xs text-neutral-300 mt-1 mb-5">
                            {cameraError || 'Izinkan browser mengakses webcam untuk memulai sesi foto 4R.'}
                          </p>

                          <div className="space-y-2.5">
                            <button
                              onClick={startCamera}
                              className="w-full py-3 bg-white text-neutral-950 rounded-xl font-bold text-xs shadow hover:bg-neutral-100 transition cursor-pointer"
                            >
                              Coba Aktifkan Webcam
                            </button>
                            <button
                              onClick={loadDemoPoses}
                              className="w-full py-3 glass-button rounded-xl font-semibold text-xs text-white hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
                            >
                              <Sparkles className="w-4 h-4 text-amber-400" /> Gunakan Foto Studio Demo
                            </button>
                            <label className="w-full py-3 glass-button rounded-xl font-semibold text-xs text-white hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer">
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
                        <span className="text-sm font-bold tracking-widest uppercase text-amber-300 mt-3">
                          {countdown === 0 ? 'SMILE!' : 'BERSIAP!'}
                        </span>
                      </div>
                    )}

                    {/* HUD */}
                    <div className="absolute inset-5 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between p-4 z-10">
                      <div className="flex justify-between items-center text-[11px] font-mono tracking-widest text-white/80 uppercase">
                        <span className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" /> REC · 4R LIVE
                        </span>
                        <span>
                          POSE {Math.min(capturedPhotos.length + 1, targetPoseCount)} / {targetPoseCount}
                        </span>
                      </div>
                      <div className="self-center text-white/50 text-xs font-mono tracking-widest">
                        {isWeddingThemeActive ? 'WEDDING 4R FRAME GUIDE' : 'SAI STUDIO 4R GUIDE'}
                      </div>
                    </div>
                  </div>

                  {/* Controls Bar */}
                  <div className="w-full mt-5 flex items-center justify-between px-2 gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsMirrored(!isMirrored)}
                        className="glass-button px-3 py-2 rounded-xl text-xs font-medium text-[var(--text-primary)] flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
                      >
                        <FlipHorizontal className="w-4 h-4 text-cyan-500" />
                        <span className="hidden sm:inline">Cermin</span>
                      </button>
                    </div>

                    <button
                      disabled={capturedPhotos.length >= targetPoseCount || countdown !== null}
                      onClick={() => startCapture()}
                      className={`px-8 py-4 rounded-2xl font-black text-sm md:text-base flex items-center gap-3 transition-all cursor-pointer ${
                        capturedPhotos.length >= targetPoseCount
                          ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed'
                          : 'bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 shadow-xl shadow-amber-500/25 hover:scale-105 active:scale-95'
                      }`}
                    >
                      <Camera className="w-5 h-5 text-neutral-950" />
                      <span>
                        {capturedPhotos.length >= targetPoseCount
                          ? 'Semua Pose Selesai'
                          : 'AMBIL FOTO (Spasi)'}
                      </span>
                    </button>

                    <button
                      onClick={() => setCapturedPhotos([])}
                      className="glass-button px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition cursor-pointer"
                    >
                      Ulang Semua
                    </button>
                  </div>
                </div>

                {/* Sidebar Pose Manager */}
                <div className="glass-panel rounded-3xl p-5 flex flex-col h-full min-h-[460px] border border-[var(--panel-border)]">
                  <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <ImageIcon className="w-4 h-4 text-amber-500" />
                    Hasil Pose ({capturedPhotos.length}/{targetPoseCount})
                  </h3>

                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-3 flex-1 overflow-y-auto max-h-[380px] pr-1">
                    {Array.from({ length: targetPoseCount }).map((_, idx) => {
                      const photo = capturedPhotos[idx];
                      return (
                        <div
                          key={idx}
                          className="relative rounded-xl overflow-hidden border border-[var(--panel-border)] bg-neutral-900 aspect-[4/3] flex items-center justify-center group"
                        >
                          {photo ? (
                            <>
                              <img src={photo} alt={`Pose ${idx + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-black/70 text-[10px] font-bold text-white">
                                #{idx + 1}
                              </div>
                              <button
                                onClick={() => startCapture(idx)}
                                title="Foto Ulang Pose Ini Saja"
                                className="absolute top-1.5 right-1.5 p-1.5 rounded-lg bg-black/70 text-amber-300 hover:text-white hover:bg-amber-600 transition cursor-pointer"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            </>
                          ) : (
                            <div className="text-center p-3">
                              <span className="text-[var(--text-muted)] text-xs font-mono font-bold">POSE #{idx + 1}</span>
                              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">Belum diambil</p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <button
                    disabled={capturedPhotos.length < 1}
                    onClick={() => setCurrentStep(4)}
                    className={`mt-4 w-full py-3.5 rounded-2xl font-extrabold text-xs transition-all flex items-center justify-center gap-2 ${
                      capturedPhotos.length >= 1
                        ? 'bg-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 hover:bg-amber-600 active:scale-95 cursor-pointer'
                        : 'bg-white/10 text-[var(--text-muted)] cursor-not-allowed'
                    }`}
                  >
                    <span>Lanjut Ke Pilihan 5 Layout 4R</span>
                    <ChevronRight className="w-4 h-4 text-neutral-950" />
                  </button>
                </div>
              </div>
            </section>
          )}

          {/* STEP 4: CUSTOMIZE 5 4R LAYOUTS, EXPANDED FILTERS & FRAMES */}
          {currentStep === 4 && (
            <section className="w-full max-w-5xl py-2">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* 4R Live Preview Column */}
                <div className="lg:col-span-5 flex flex-col items-center">
                  <div className="glass-panel p-4 rounded-3xl shadow-2xl flex flex-col items-center w-full max-w-xs border border-[var(--panel-border)]">
                    <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-amber-500" /> Kanvas 4R (1200 × 1800 px @ 300 DPI)
                    </span>

                    <div className="w-full aspect-[4/6] rounded-2xl glass-card border border-[var(--panel-border)] p-1.5 shadow-xl flex items-center justify-center overflow-hidden">
                      {isGeneratingStep4Preview ? (
                        <div className="text-center text-xs text-[var(--text-muted)]">
                          <div className="w-7 h-7 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                          Menyesuaikan layout 4R...
                        </div>
                      ) : step4PreviewUrl ? (
                        <img
                          src={step4PreviewUrl}
                          alt="4R Live Preview"
                          className="w-full h-full object-contain rounded-xl shadow-lg"
                        />
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">Memuat preview...</span>
                      )}
                    </div>

                    <p className="text-[10px] text-[var(--text-muted)] text-center mt-2.5">
                      Ukuran cetak 4 × 6 inci dengan batas aman margin Epson L320.
                    </p>
                  </div>
                </div>

                {/* Controls Column */}
                <div className="lg:col-span-7 glass-panel rounded-3xl p-5 md:p-7 space-y-5 border border-[var(--panel-border)]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                        <SlidersHorizontal className="w-5 h-5 text-amber-500" /> 5 Pilihan Layout Cetak 4R
                      </h3>
                      <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                        Ganti layout tanpa perlu foto ulang! Foto sesi Anda langsung diaplikasikan ke desain baru.
                      </p>
                    </div>

                    {/* Wedding Theme Toggle */}
                    <button
                      type="button"
                      onClick={() => setIsWeddingThemeActive(!isWeddingThemeActive)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer ${
                        isWeddingThemeActive
                          ? 'bg-amber-500/25 border border-amber-500 text-amber-700 dark:text-amber-300'
                          : 'glass-button text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      <Heart className="w-3.5 h-3.5 text-amber-500" />
                      <span>Wedding Minimalist</span>
                    </button>
                  </div>

                  {/* 5 4R Layout Selector Buttons */}
                  <div>
                    <label className="text-xs font-bold text-[var(--text-primary)] block mb-2">Pilih Format Cetak 4R:</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {LAYOUTS_4R.map((l) => (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setSelectedLayout4R(l.id)}
                          className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                            selectedLayout4R === l.id
                              ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/25 text-[var(--text-primary)]'
                              : 'glass-card border-[var(--panel-border)] text-[var(--text-secondary)] hover:border-amber-500/30'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-bold text-[var(--text-primary)]">{l.title}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 font-semibold">
                              {l.badge}
                            </span>
                          </div>
                          <p className="text-[10px] text-[var(--text-muted)] line-clamp-1">{l.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Face Vertical Crop Adjustment Slider */}
                  {(selectedLayout4R === 'single_4r' || selectedLayout4R === 'collage_3_4r') && (
                    <div className="p-3.5 rounded-2xl glass-card border border-[var(--panel-border)] space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" /> Penyesuaian Posisi Wajah / Crop Vertikal
                        </span>
                        <span className="text-amber-500 font-mono text-[11px] font-bold">
                          {cropOffsetY > 0 ? `+${cropOffsetY}%` : `${cropOffsetY}%`}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="-40"
                        max="40"
                        value={cropOffsetY}
                        onChange={(e) => setCropOffsetY(Number(e.target.value))}
                        className="w-full accent-amber-500 cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
                        <span>Geser Ke Atas</span>
                        <span>Tengah (Default)</span>
                        <span>Geser Ke Bawah</span>
                      </div>
                    </div>
                  )}

                  {/* Filter Selector with Categories & Miniature Thumbnails */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-[var(--text-primary)]">Filter Foto (30+ Pilihan):</label>
                      <button
                        type="button"
                        onClick={() => setSelectedFilter('original')}
                        className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline cursor-pointer"
                      >
                        Reset Filter (Original)
                      </button>
                    </div>

                    {/* Filter Category Tabs */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px]">
                      {FILTER_CATEGORIES.map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setKioskFilterCategory(cat.id)}
                          className={`px-2.5 py-1 rounded-lg font-bold transition shrink-0 cursor-pointer ${
                            kioskFilterCategory === cat.id
                              ? 'bg-amber-500 text-neutral-950'
                              : 'glass-button text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>

                    {/* Filter Thumbnails Grid */}
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 max-h-36 overflow-y-auto p-1">
                      {PHOTO_FILTERS.filter(
                        (f) => kioskFilterCategory === 'all' || f.category === kioskFilterCategory
                      ).map((f) => {
                        const isSelected = selectedFilter === f.id;
                        return (
                          <button
                            key={f.id}
                            type="button"
                            onClick={() => setSelectedFilter(f.id)}
                            className={`p-1.5 rounded-xl border flex flex-col items-center gap-1 transition cursor-pointer text-center ${
                              isSelected
                                ? 'bg-amber-500/20 border-amber-500 ring-2 ring-amber-500/30'
                                : 'glass-card border-[var(--panel-border)] hover:opacity-90'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-neutral-900 border border-black/10 shrink-0">
                              {capturedPhotos[0] ? (
                                <img
                                  src={capturedPhotos[0]}
                                  alt={f.name}
                                  style={{ filter: f.cssFilter }}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div
                                  style={{ filter: f.cssFilter }}
                                  className="w-full h-full bg-gradient-to-tr from-rose-400 to-amber-300"
                                />
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-[var(--text-primary)] truncate max-w-full">
                              {f.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Frame Colors & Textures */}
                  {!isWeddingThemeActive ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <label className="font-bold text-[var(--text-primary)]">18 Preset Warna Bingkai 4R:</label>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                            <span>Picker</span>
                            <input
                              type="color"
                              value={frameBg}
                              onChange={(e) => {
                                const hex = e.target.value;
                                setFrameBg(hex);
                                setFrameBorderColor(hex);
                                setFrameTextColor(getAutoTextColor(hex));
                              }}
                              className="w-5 h-5 rounded cursor-pointer border-0 p-0"
                            />
                          </label>
                          <input
                            type="text"
                            maxLength={7}
                            value={frameBg}
                            onChange={(e) => {
                              const hex = e.target.value;
                              setFrameBg(hex);
                              setFrameBorderColor(hex);
                              setFrameTextColor(getAutoTextColor(hex));
                            }}
                            className="w-18 px-1.5 py-0.5 rounded text-[10px] font-mono themed-input uppercase text-center"
                          />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1.5 items-center">
                        {FRAME_COLOR_PRESETS.map((c) => (
                          <button
                            key={c.name}
                            type="button"
                            onClick={() => {
                              setFrameBg(c.hex);
                              setFrameBorderColor(c.hex);
                              setFrameTextColor(c.textColor);
                            }}
                            title={c.name}
                            className={`w-7 h-7 rounded-lg border-2 transition cursor-pointer ${
                              frameBg === c.hex
                                ? 'ring-2 ring-amber-500 scale-110 shadow-md border-amber-500'
                                : 'border-black/20 opacity-80 hover:opacity-100'
                            }`}
                            style={{ backgroundColor: c.hex }}
                          />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[var(--text-primary)] block">Preset Wedding Minimalist:</label>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {WEDDING_FRAME_PRESETS.map((wf) => (
                          <button
                            key={wf.id}
                            type="button"
                            onClick={() => {
                              setFrameBg(wf.color);
                              setFrameBorderColor(wf.accentColor);
                              setFrameTextColor(wf.textColor);
                              setSettings((prev) => ({
                                ...prev,
                                wedding: { ...prev.wedding, accentColor: wf.accentColor },
                              }));
                            }}
                            className="p-2 rounded-xl glass-card border border-[var(--panel-border)] flex items-center gap-2 cursor-pointer text-left hover:opacity-90"
                          >
                            <span
                              style={{ backgroundColor: wf.accentColor }}
                              className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-sm"
                            />
                            <span className="text-[11px] font-bold text-[var(--text-primary)] truncate">{wf.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Title & Custom Text */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">
                        {isWeddingThemeActive ? 'Nama Pasangan' : 'Judul Frame 4R'}
                      </label>
                      <input
                        type="text"
                        maxLength={24}
                        value={isWeddingThemeActive ? settings.wedding.coupleNames : customTitle}
                        onChange={(e) => {
                          if (isWeddingThemeActive) {
                            setSettings((prev) => ({
                              ...prev,
                              wedding: { ...prev.wedding, coupleNames: e.target.value },
                            }));
                          } else {
                            setCustomTitle(e.target.value);
                          }
                        }}
                        placeholder="SARAH & DIMAS / SAI STUDIO"
                        className="w-full px-3.5 py-2.5 rounded-xl themed-input text-xs"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-[var(--text-primary)] block mb-1.5">Stempel / Ornamen</label>
                      <div className="flex gap-1.5 flex-wrap">
                        {STAMPS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedStamp(s)}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm transition cursor-pointer ${
                              selectedStamp === s ? 'bg-amber-500/30 border border-amber-500 scale-105' : 'glass-button hover:opacity-90'
                            }`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 flex gap-3">
                    <button
                      onClick={() => setCurrentStep(3)}
                      className="py-3.5 px-5 glass-button text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-2xl cursor-pointer"
                    >
                      Ambil Foto Lagi
                    </button>
                    <button
                      onClick={proceedToFinish}
                      className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 active:scale-95 text-neutral-950 font-extrabold text-sm shadow-xl shadow-amber-500/20 rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition"
                    >
                      <Printer className="w-4 h-4 text-neutral-950" />
                      <span>Selesai & Cetak 4R Sekarang</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* STEP 5: CETAK 4R, DOWNLOAD & QR SOFTCOPY */}
          {currentStep === 5 && (
            <section className="w-full max-w-4xl py-2">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
                {/* Result Showcase */}
                <div className="md:col-span-6 flex flex-col items-center">
                  <div className="glass-panel p-4 rounded-3xl shadow-2xl flex justify-center max-w-xs w-full border border-[var(--panel-border)]">
                    {isBuildingFinal ? (
                      <div className="py-24 text-center text-[var(--text-muted)] text-xs">
                        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                        Membuat kanvas cetak 4R 300 DPI...
                      </div>
                    ) : finalImageSrc ? (
                      <img
                        src={finalImageSrc}
                        alt="Hasil Photostrip 4R"
                        className="w-full rounded-xl shadow-2xl"
                      />
                    ) : (
                      <div className="py-24 text-center text-[var(--text-muted)] text-xs">Menyiapkan gambar 4R...</div>
                    )}
                  </div>

                  <div className="flex gap-3 mt-4 w-full max-w-xs">
                    <button
                      onClick={handleDownload}
                      className="flex-1 py-3 glass-button rounded-xl text-xs font-bold text-[var(--text-primary)] flex items-center justify-center gap-2 cursor-pointer hover:opacity-90"
                    >
                      <Download className="w-4 h-4 text-cyan-500" /> Simpan JPG
                    </button>
                    <button
                      onClick={handlePrint}
                      className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-neutral-950 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-neutral-950" /> Cetak 4R
                    </button>
                  </div>
                </div>

                {/* QR Code Softcopy */}
                <div className="md:col-span-6 glass-panel rounded-3xl p-8 text-center shadow-2xl border border-[var(--panel-border)]">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3">
                    <Check className="w-7 h-7" />
                  </div>
                  <h2 className="text-2xl font-bold text-[var(--text-primary)]">Foto 4R Berhasil Dibuat!</h2>
                  <p className="text-xs text-[var(--text-secondary)] mt-1">
                    Scan QR di bawah dengan kamera smartphone untuk mengunduh softcopy foto secara langsung.
                  </p>

                  <div className="bg-white p-5 rounded-2xl inline-block shadow-2xl my-5 border border-black/10">
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
                    <div className="h-1.5 w-full bg-black/10 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 rounded-full transition-all duration-1000"
                        style={{ width: `${(qrSecondsLeft / 30) * 100}%` }}
                      />
                    </div>
                    <p className="text-[11px] text-[var(--text-muted)] mt-2">
                      {qrExpired ? (
                        <span className="text-amber-500 font-semibold">QR telah kadaluarsa demi privasi.</span>
                      ) : (
                        <>
                          QR aktif selama <strong className="text-[var(--text-primary)]">{qrSecondsLeft}</strong> detik.
                        </>
                      )}
                    </p>
                  </div>

                  {qrExpired && (
                    <button
                      onClick={generateDownloadQrCode}
                      className="mt-3 px-4 py-2 glass-button rounded-xl text-xs font-bold text-amber-600 dark:text-amber-400 hover:opacity-90 cursor-pointer"
                    >
                      Buat QR Baru
                    </button>
                  )}

                  <div className="mt-8 pt-6 border-t border-[var(--panel-border)] flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setCurrentStep(4)}
                      className="py-3 px-5 glass-button text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-xl cursor-pointer"
                    >
                      Ganti Layout 4R Lain
                    </button>
                    <button
                      onClick={handleResetSession}
                      className="py-3 px-6 bg-gradient-to-r from-amber-500 to-yellow-600 text-neutral-950 font-extrabold rounded-xl text-xs hover:from-amber-600 hover:to-yellow-700 transition shadow cursor-pointer"
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
        <img id="printImage" alt="SAI Studio 4R Printout" />
      </div>

      {/* ZOOM PREVIEW MODAL */}
      {showZoomModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl animate-in fade-in duration-200"
          style={{ backgroundColor: 'var(--overlay-bg)' }}
        >
          <div className="glass-panel rounded-3xl p-5 md:p-6 max-w-4xl w-full max-h-[92vh] flex flex-col items-center shadow-2xl relative border border-[var(--panel-border)]">
            <div className="w-full flex items-center justify-between pb-3 border-b border-[var(--panel-border)] mb-3">
              <div className="flex items-center gap-2">
                <ZoomIn className="w-5 h-5 text-amber-500" />
                <div>
                  <span className="font-bold text-sm text-[var(--text-primary)] block">
                    Preview Detail Resolusi Penuh
                  </span>
                  <span className="text-[11px] text-[var(--text-muted)] font-mono">
                    {activeDigitalDimensions.width} × {activeDigitalDimensions.height} px ({activeDigitalDimensions.ratioText})
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowZoomModal(false)}
                className="p-1.5 rounded-xl glass-button text-[var(--text-primary)] hover:opacity-80 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 w-full flex items-center justify-center overflow-auto p-2">
              {digitalPreviewUrl ? (
                <img
                  src={digitalPreviewUrl}
                  alt="Full preview"
                  className="max-h-[65vh] object-contain rounded-xl shadow-2xl border border-[var(--panel-border)]"
                />
              ) : (
                <div className="p-12 text-center text-[var(--text-muted)] text-xs">Memuat preview...</div>
              )}
            </div>

            <div className="w-full pt-3 border-t border-[var(--panel-border)] flex flex-wrap justify-between items-center gap-3 text-xs">
              <span className="text-[var(--text-muted)]">
                Format Ekspor: <strong className="text-[var(--text-primary)]">{digitalFormat === 'image/png' ? 'PNG' : 'JPG'}</strong> · Slot: <strong className="text-amber-500">{capturedPhotos.length} / {digitalPhotoCount}</strong> foto terisi
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowZoomModal(false)}
                  className="px-4 py-2 glass-button rounded-xl font-bold text-[var(--text-primary)] cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  onClick={async () => {
                    await buildFinalOutput();
                    handleDownload();
                  }}
                  disabled={capturedPhotos.length === 0}
                  className={`px-5 py-2 font-extrabold rounded-xl shadow cursor-pointer flex items-center gap-1.5 ${
                    capturedPhotos.length > 0
                      ? 'bg-amber-500 hover:bg-amber-600 text-neutral-950'
                      : 'bg-white/10 text-[var(--text-muted)] cursor-not-allowed'
                  }`}
                >
                  <Download className="w-4 h-4 text-neutral-950" />
                  <span>Unduh Foto</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL */}
      <AdminLoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={() => {
          setIsAdminLoggedIn(true);
          setShowLoginModal(false);
          setShowAdminModal(true);
        }}
      />

      {/* ADMIN SETTINGS & MANAGEMENT MODAL */}
      <AdminSettingsModal
        isOpen={showAdminModal}
        onClose={() => setShowAdminModal(false)}
        onLogout={handleAdminLogout}
        settings={settings}
        onSaveSettings={handleSaveSettings}
      />
    </div>
  );
}
