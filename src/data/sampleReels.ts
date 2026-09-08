export interface SampleReelShoot {
  id: string;
  reelNumber: number;
  title: string;
  fileName: string;
  durationSeconds: number;
  fileSizeMb: number;
  styleDescription: string;
  videoUrl: string;
  thumbnailUrl: string;
}

export const FASHION_SHOOT_SAMPLES: SampleReelShoot[] = [
  {
    id: 'sample-reel-1',
    reelNumber: 1,
    title: 'Take 1: Snap Transition & Fast Walk',
    fileName: 'paris_blazer_take1_snap_transition.mp4',
    durationSeconds: 8.4,
    fileSizeMb: 6.8,
    styleDescription: 'Opens immediately on motion with sharp footstep pace and 0.4s snap outfit reveal.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-in-a-fashionable-autumn-outfit-walking-down-the-street-40915-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-reel-2',
    reelNumber: 2,
    title: 'Take 2: Texture Close-Up Opener',
    fileName: 'paris_blazer_take2_texture_first.mp4',
    durationSeconds: 9.1,
    fileSizeMb: 7.4,
    styleDescription: 'Extreme close-up on wool drape and lapel pin before pulling back to 3/4 silhouette.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-fashion-model-in-an-autumn-coat-poses-on-the-street-40916-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-reel-3',
    reelNumber: 3,
    title: 'Take 3: Static Posing & Slow Turn',
    fileName: 'paris_blazer_take3_static_pose.mp4',
    durationSeconds: 13.6,
    fileSizeMb: 11.2,
    styleDescription: 'Subject pauses for 2 seconds before executing slow 360-degree rotation.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-stylish-model-posing-in-an-urban-setting-40914-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80',
  },
  {
    id: 'sample-reel-4',
    reelNumber: 4,
    title: 'Take 4: Street Stride with Clean Silhouette',
    fileName: 'paris_blazer_take4_stride_drape.mp4',
    durationSeconds: 8.0,
    fileSizeMb: 6.2,
    styleDescription: 'Continuous motion toward camera, optimal natural lighting, ends right on pose lock.',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-model-posing-in-a-trendy-outfit-on-the-street-40917-large.mp4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=600&q=80',
  },
];
