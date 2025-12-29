export const RESOLUTION_LONG_EDGE = [1024, 2048, 4096] as const;
export type ResolutionLongEdge = (typeof RESOLUTION_LONG_EDGE)[number];

export const ASPECT_RATIOS = ['1:1', '4:3', '3:4', '16:9', '9:16'] as const;
export type AspectRatio = (typeof ASPECT_RATIOS)[number];

export function parseAspectRatio(aspect: AspectRatio): number {
  const [w, h] = aspect.split(':').map((n) => Number(n));
  return w / h;
}

export function computeTargetFromLongEdge(
  longEdge: number,
  aspect: AspectRatio
): { width: number; height: number } {
  const ratio = parseAspectRatio(aspect);
  let width: number;
  let height: number;

  if (ratio >= 1) {
    width = longEdge;
    height = Math.round(longEdge / ratio);
  } else {
    height = longEdge;
    width = Math.round(longEdge * ratio);
  }

  width = Math.max(1, Math.round(width));
  height = Math.max(1, Math.round(height));
  return { width, height };
}

export function makeEvenDimensions(dim: { width: number; height: number }): {
  width: number;
  height: number;
} {
  // Some image pipelines prefer even dimensions. Keep >= 2.
  let width = Math.max(2, dim.width);
  let height = Math.max(2, dim.height);
  if (width % 2 !== 0) width -= 1;
  if (height % 2 !== 0) height -= 1;
  return { width, height };
}

export function findMatchingPreset(
  width: number,
  height: number
): { longEdge: ResolutionLongEdge; aspect: AspectRatio } | null {
  for (const longEdge of RESOLUTION_LONG_EDGE) {
    for (const aspect of ASPECT_RATIOS) {
      const t = computeTargetFromLongEdge(longEdge, aspect);
      if (t.width === width && t.height === height) return { longEdge, aspect };
    }
  }
  return null;
}



