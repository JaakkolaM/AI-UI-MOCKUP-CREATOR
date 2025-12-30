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



