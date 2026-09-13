export interface SamplePhotoItem {
  id: string;
  photoNumber: number;
  title: string;
  fileName: string;
  previewUrl: string;
  description: string;
}

export const FASHION_PHOTO_SHOOT_SAMPLES: SamplePhotoItem[] = [
  {
    id: 'sample-photo-1',
    photoNumber: 1,
    title: 'Full-Length Structured Coat',
    fileName: 'paris_tailored_overcoat_full.jpg',
    previewUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    description: 'Clean centered 9:16 vertical full-body silhouette with neutral architectural backdrop.',
  },
  {
    id: 'sample-photo-2',
    photoNumber: 2,
    title: 'Fabric Texture & Lapel Macro',
    fileName: 'wool_lapel_texture_close.jpg',
    previewUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=80',
    description: 'Crisp medium shot highlighting wool weave, buttons, and minimalist accessories.',
  },
  {
    id: 'sample-photo-3',
    photoNumber: 3,
    title: 'Stride in Motion (Natural Light)',
    fileName: 'street_stride_motion.jpg',
    previewUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1000&q=80',
    description: 'Dynamic walking posture capturing coat drape and garment movement.',
  },
  {
    id: 'sample-photo-4',
    photoNumber: 4,
    title: 'Profile with Street Background',
    fileName: 'urban_profile_ambient.jpg',
    previewUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80',
    description: 'Side profile with busier background elements and slight shadow on the lapel.',
  },
  {
    id: 'sample-photo-5',
    photoNumber: 5,
    title: 'Mid-Turn Awkward Framing',
    fileName: 'test_take_misaligned.jpg',
    previewUrl: 'https://images.unsplash.com/photo-1485968579580-b6d095142e6e?auto=format&fit=crop&w=1000&q=80',
    description: 'Awkward body turn angle with cut-off foot framing and heavy background distraction.',
  },
];
