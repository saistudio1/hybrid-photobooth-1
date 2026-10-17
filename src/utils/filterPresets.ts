import { FilterCategory, FilterDef } from '../types/photobooth';

export const FILTER_CATEGORIES: { id: FilterCategory | 'all'; label: string; icon?: string }[] = [
  { id: 'all', label: 'Semua Filter' },
  { id: 'natural', label: 'Natural' },
  { id: 'aesthetic', label: 'Aesthetic' },
  { id: 'wedding', label: 'Wedding' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'monochrome', label: 'Monochrome' },
  { id: 'dramatic', label: 'Dramatic' },
];

export const PHOTO_FILTERS: FilterDef[] = [
  // 1. NATURAL
  {
    id: 'original',
    name: 'Original',
    category: 'natural',
    cssFilter: 'none',
    description: 'Foto asli tanpa efek filter',
  },
  {
    id: 'natural_soft',
    name: 'Soft',
    category: 'natural',
    cssFilter: 'contrast(96%) brightness(104%) saturate(106%)',
    description: 'Pencahayaan lembut dan halus',
  },
  {
    id: 'natural_bright',
    name: 'Bright',
    category: 'natural',
    cssFilter: 'brightness(112%) contrast(104%) saturate(108%)',
    description: 'Tampilan bersih, jernih, dan cerah',
  },
  {
    id: 'natural_warm',
    name: 'Warm',
    category: 'natural',
    cssFilter: 'sepia(18%) saturate(125%) hue-rotate(-6deg) brightness(102%)',
    description: 'Nuansa hangat lembut alami',
  },
  {
    id: 'natural_cool',
    name: 'Cool',
    category: 'natural',
    cssFilter: 'contrast(106%) saturate(112%) hue-rotate(10deg) brightness(103%)',
    description: 'Nuansa sejuk jernih modern',
  },
  {
    id: 'natural_clean',
    name: 'Clean',
    category: 'natural',
    cssFilter: 'contrast(108%) brightness(106%) saturate(102%)',
    description: 'Kontras tajam dan warna murni',
  },
  {
    id: 'natural_portrait',
    name: 'Portrait Soft',
    category: 'natural',
    cssFilter: 'contrast(98%) brightness(106%) saturate(114%) sepia(8%)',
    description: 'Optimal untuk rona warna kulit portrait',
  },

  // 2. VINTAGE
  {
    id: 'vintage_classic',
    name: 'Vintage',
    category: 'vintage',
    cssFilter: 'sepia(65%) contrast(108%) brightness(96%) saturate(110%)',
    description: 'Gaya foto klasik era 80-an',
  },
  {
    id: 'vintage_retro',
    name: 'Retro',
    category: 'vintage',
    cssFilter: 'sepia(40%) saturate(135%) contrast(115%) hue-rotate(-12deg)',
    description: 'Warna pop retro analog',
  },
  {
    id: 'vintage_fade',
    name: 'Fade',
    category: 'vintage',
    cssFilter: 'contrast(88%) brightness(110%) saturate(85%) sepia(16%)',
    description: 'Efek pudar nostalgik elegan',
  },
  {
    id: 'vintage_film',
    name: 'Film',
    category: 'vintage',
    cssFilter: 'contrast(118%) brightness(104%) saturate(92%) sepia(20%)',
    description: 'Karakter roll film 35mm',
  },
  {
    id: 'vintage_matte',
    name: 'Matte',
    category: 'vintage',
    cssFilter: 'contrast(90%) brightness(108%) saturate(90%)',
    description: 'Finishing matte tanpa pantulan keras',
  },
  {
    id: 'vintage_grainy',
    name: 'Grainy Film',
    category: 'vintage',
    cssFilter: 'contrast(125%) brightness(98%) saturate(88%) sepia(26%)',
    description: 'Tekstur film analog klasik',
  },

  // 3. MONOCHROME
  {
    id: 'mono_bw',
    name: 'Black & White',
    category: 'monochrome',
    cssFilter: 'grayscale(100%) contrast(115%) brightness(100%)',
    description: 'Hitam putih bersih dan seimbang',
  },
  {
    id: 'mono_classic',
    name: 'Classic B&W',
    category: 'monochrome',
    cssFilter: 'grayscale(100%) contrast(128%) brightness(95%)',
    description: 'Hitam putih klasik bergaya studio foto',
  },
  {
    id: 'mono_softgray',
    name: 'Soft Monochrome',
    category: 'monochrome',
    cssFilter: 'grayscale(100%) contrast(92%) brightness(108%)',
    description: 'Monokrom halus dan bergradasi abu-abu lembut',
  },
  {
    id: 'mono_highcontrast',
    name: 'High Contrast B&W',
    category: 'monochrome',
    cssFilter: 'grayscale(100%) contrast(155%) brightness(96%)',
    description: 'Hitam pekat dramatis berkarakter kuat',
  },

  // 4. AESTHETIC
  {
    id: 'aes_cream',
    name: 'Cream',
    category: 'aesthetic',
    cssFilter: 'sepia(24%) brightness(106%) saturate(108%) contrast(98%)',
    description: 'Gradasi krem lembut ala kafe Korea',
  },
  {
    id: 'aes_beige',
    name: 'Beige',
    category: 'aesthetic',
    cssFilter: 'sepia(30%) brightness(104%) contrast(102%) saturate(95%)',
    description: 'Warna hangat beige natural aesthetic',
  },
  {
    id: 'aes_softpink',
    name: 'Soft Pink',
    category: 'aesthetic',
    cssFilter: 'hue-rotate(335deg) saturate(120%) brightness(105%) contrast(100%)',
    description: 'Sentuhan rona merah muda manis',
  },
  {
    id: 'aes_peach',
    name: 'Peach',
    category: 'aesthetic',
    cssFilter: 'sepia(22%) hue-rotate(-15deg) saturate(135%) brightness(106%)',
    description: 'Nuansa peach ceria dan segar',
  },
  {
    id: 'aes_dreamy',
    name: 'Dreamy',
    category: 'aesthetic',
    cssFilter: 'contrast(92%) brightness(112%) saturate(118%) hue-rotate(5deg)',
    description: 'Pencahayaan dreamy bercahaya lembut',
  },
  {
    id: 'aes_pastel',
    name: 'Pastel',
    category: 'aesthetic',
    cssFilter: 'brightness(110%) contrast(94%) saturate(112%) hue-rotate(-4deg)',
    description: 'Warna-warna pastel manis dan cerah',
  },
  {
    id: 'aes_milky',
    name: 'Milky',
    category: 'aesthetic',
    cssFilter: 'contrast(88%) brightness(116%) saturate(88%)',
    description: 'Rona putih susu halus nan estetik',
  },
  {
    id: 'aes_goldenhour',
    name: 'Golden Hour',
    category: 'aesthetic',
    cssFilter: 'sepia(38%) saturate(150%) hue-rotate(-12deg) contrast(106%) brightness(104%)',
    description: 'Sinar matahari sore keemasan yang memukau',
  },

  // 5. DRAMATIC
  {
    id: 'dram_contrast',
    name: 'Contrast',
    category: 'dramatic',
    cssFilter: 'contrast(135%) brightness(102%) saturate(120%)',
    description: 'Warna tajam dan berdimensi tinggi',
  },
  {
    id: 'dram_moody',
    name: 'Moody',
    category: 'dramatic',
    cssFilter: 'contrast(125%) brightness(92%) saturate(85%) hue-rotate(8deg)',
    description: 'Gaya moody sinematik gelap estetik',
  },
  {
    id: 'dram_cinematic',
    name: 'Cinematic',
    category: 'dramatic',
    cssFilter: 'contrast(118%) brightness(98%) saturate(115%) sepia(15%) hue-rotate(-5deg)',
    description: 'Nuansa film layar lebar',
  },
  {
    id: 'dram_deepshadow',
    name: 'Deep Shadow',
    category: 'dramatic',
    cssFilter: 'contrast(140%) brightness(90%) saturate(105%)',
    description: 'Bayangan dalam dengan siluet tegas',
  },

  // 6. WEDDING
  {
    id: 'wed_bridal',
    name: 'Bridal White',
    category: 'wedding',
    cssFilter: 'contrast(96%) brightness(114%) saturate(104%) sepia(6%)',
    description: 'Dominasi putih bersih anggun untuk gaun pengantin',
  },
  {
    id: 'wed_ivory',
    name: 'Ivory Soft',
    category: 'wedding',
    cssFilter: 'sepia(20%) brightness(108%) contrast(98%) saturate(102%)',
    description: 'Ivory lembut bernuansa editorial elegan',
  },
  {
    id: 'wed_champagne',
    name: 'Champagne',
    category: 'wedding',
    cssFilter: 'sepia(28%) saturate(125%) hue-rotate(-8deg) brightness(106%) contrast(102%)',
    description: 'Kemilau champagne mewah dan hangat',
  },
  {
    id: 'wed_romantic',
    name: 'Romantic Glow',
    category: 'wedding',
    cssFilter: 'contrast(98%) brightness(110%) saturate(120%) hue-rotate(-6deg) sepia(10%)',
    description: 'Kilau romantis dengan warna kulit bersinar',
  },
  {
    id: 'wed_softfilm',
    name: 'Soft Film',
    category: 'wedding',
    cssFilter: 'contrast(106%) brightness(105%) saturate(95%) sepia(14%)',
    description: 'Sentuhan dokumentasi film pernikahan abadi',
  },
];

export function getFilterById(id: string): FilterDef {
  return PHOTO_FILTERS.find((f) => f.id === id) || PHOTO_FILTERS[0];
}

export function getCssFilterString(filterId: string): string {
  const f = getFilterById(filterId);
  return f ? f.cssFilter : 'none';
}
