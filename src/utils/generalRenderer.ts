import { renderDigitalPhoto } from './digitalRenderer';
import { DEFAULT_FRAME_CUSTOMIZATION } from './framePresets';

export interface GeneralRenderOptions {
  photo: string;
  dateStr: string;
  filter?: string;
  caption?: string;
}

export async function renderGeneralPhoto(opts: GeneralRenderOptions): Promise<string> {
  const { photo, dateStr, filter = 'original', caption = 'SAI STUDIO' } = opts;

  return renderDigitalPhoto({
    photos: [photo],
    targetCount: 1,
    layoutId: 'digital_1_full',
    width: 1080,
    height: 1350,
    filterId: filter,
    fitMode: 'cover',
    cropOffsetY: 0,
    frame: {
      ...DEFAULT_FRAME_CUSTOMIZATION,
      style: 'polaroid',
      color: '#ffffff',
      bgColor: '#ffffff',
      textColor: '#0f172a',
    },
    caption,
    dateStr,
    format: 'image/jpeg',
  });
}
