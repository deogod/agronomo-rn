/**
 * Geometry of the photo viewer. Every function is a worklet: gestures call them
 * on the UI thread, once per frame, without crossing to the JS thread.
 * Points are measured from the center of the screen, the origin of a transform.
 */
export type Size = { width: number; height: number };
export type Point = { x: number; y: number };
export type PhotoTransform = Point & { zoom: number };

export const MIN_ZOOM = 1;
export const MAX_ZOOM = 4;
export const DOUBLE_TAP_ZOOM = 2.5;

/** The size a photo takes on screen with contentFit="contain". */
export function fitContain(viewport: Size, image: Size): Size {
  'worklet';
  if (image.width <= 0 || image.height <= 0) return viewport;
  const ratio = Math.min(viewport.width / image.width, viewport.height / image.height);
  return { width: image.width * ratio, height: image.height * ratio };
}

function limit(value: number, max: number): number {
  'worklet';
  // Adding 0 turns -0 into 0.
  return Math.min(max, Math.max(-max, value)) + 0;
}

/** Keeps the photo on screen: it only moves in the part that overflows. */
function keepOnScreen(transform: PhotoTransform, photo: Size, viewport: Size): PhotoTransform {
  'worklet';
  const maxX = Math.max(0, (photo.width * transform.zoom - viewport.width) / 2);
  const maxY = Math.max(0, (photo.height * transform.zoom - viewport.height) / 2);
  return {
    zoom: transform.zoom,
    x: limit(transform.x, maxX),
    y: limit(transform.y, maxY),
  };
}

/** Zooms keeping the point under the fingers in the same place. */
export function zoomAt(
  current: PhotoTransform,
  zoom: number,
  focal: Point,
  photo: Size,
  viewport: Size,
): PhotoTransform {
  'worklet';
  const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
  const ratio = nextZoom / current.zoom;
  return keepOnScreen(
    {
      zoom: nextZoom,
      x: focal.x - (focal.x - current.x) * ratio,
      y: focal.y - (focal.y - current.y) * ratio,
    },
    photo,
    viewport,
  );
}

export function panBy(
  current: PhotoTransform,
  change: Point,
  photo: Size,
  viewport: Size,
): PhotoTransform {
  'worklet';
  return keepOnScreen(
    { zoom: current.zoom, x: current.x + change.x, y: current.y + change.y },
    photo,
    viewport,
  );
}

/** Double tap: zooms in at the tapped point, or back out when already zoomed. */
export function toggleZoom(
  current: PhotoTransform,
  focal: Point,
  photo: Size,
  viewport: Size,
): PhotoTransform {
  'worklet';
  if (current.zoom > MIN_ZOOM) return { zoom: MIN_ZOOM, x: 0, y: 0 };
  return zoomAt(current, DOUBLE_TAP_ZOOM, focal, photo, viewport);
}
