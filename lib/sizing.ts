export interface DevicePreset {
  name: string;
  width: number;
  height: number;
  description: string;
}

export const DEVICE_PRESETS: DevicePreset[] = [
  // Mobile presets
  { name: 'Mobile (iPhone SE)', width: 375, height: 667, description: 'iPhone SE, common Android' },
  { name: 'Mobile (iPhone 12)', width: 390, height: 844, description: 'iPhone 12/13/14' },
  { name: 'Mobile (iPhone 14 Pro Max)', width: 430, height: 932, description: 'iPhone 14 Pro Max' },
  { name: 'Mobile (Samsung Galaxy S22)', width: 384, height: 854, description: 'Samsung Galaxy S22' },

  // Tablet presets
  { name: 'Tablet (iPad)', width: 768, height: 1024, description: 'iPad (portrait)' },
  { name: 'Tablet (iPad Pro)', width: 1024, height: 1366, description: 'iPad Pro (portrait)' },
  { name: 'Tablet (Android)', width: 800, height: 1280, description: 'Common Android tablet' },

  // Web presets
  { name: 'Web (Laptop)', width: 1366, height: 768, description: 'Common laptop resolution' },
  { name: 'Web (Desktop)', width: 1920, height: 1080, description: 'Full HD desktop' },
  { name: 'Web (Large Desktop)', width: 2560, height: 1440, description: 'QHD desktop' },
];

export function findMatchingPreset(
  width: number,
  height: number
): DevicePreset | null {
  return DEVICE_PRESETS.find(preset =>
    preset.width === width && preset.height === height
  ) || null;
}

// Aspect ratios for image generation
export const ASPECT_RATIOS = [
  '1:1',
  '16:9',
  '9:16',
  '4:3',
  '3:4',
  '21:9',
  '9:21',
  '3:2',
  '2:3',
  '5:4',
  '4:5',
] as const;

// Compute target dimensions from long edge and aspect ratio
export function computeTargetFromLongEdge(
  longEdge: number,
  aspectRatio: string
): { width: number; height: number } {
  const [widthRatio, heightRatio] = aspectRatio.split(':').map(Number);
  const aspect = widthRatio / heightRatio;

  if (widthRatio >= heightRatio) {
    // Landscape or square - width is the long edge
    const width = longEdge;
    const height = Math.round(longEdge / aspect);
    return { width, height };
  } else {
    // Portrait - height is the long edge
    const height = longEdge;
    const width = Math.round(longEdge * aspect);
    return { width, height };
  }
}

// Ensure dimensions are even numbers (for better compatibility with some image processing)
export function makeEvenDimensions(
  dimensions: { width: number; height: number }
): { width: number; height: number } {
  return {
    width: dimensions.width % 2 === 0 ? dimensions.width : dimensions.width + 1,
    height: dimensions.height % 2 === 0 ? dimensions.height : dimensions.height + 1,
  };
}



