/** Longest side sent to the API (the Flutter compressor also targets 1920). */
export const PHOTO_MAX_SIDE = 1920;

/**
 * Resize that fits the photo inside maxSide, or null when it already fits.
 * Only the longest side is given: the manipulator keeps the aspect ratio.
 */
export function photoResize(
  width: number,
  height: number,
  maxSide = PHOTO_MAX_SIDE,
): { width: number } | { height: number } | null {
  if (Math.max(width, height) <= maxSide) return null;
  return width >= height ? { width: maxSide } : { height: maxSide };
}
