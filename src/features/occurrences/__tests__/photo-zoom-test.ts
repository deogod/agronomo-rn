import {
  DOUBLE_TAP_ZOOM,
  fitContain,
  MAX_ZOOM,
  MIN_ZOOM,
  panBy,
  toggleZoom,
  zoomAt,
  type PhotoTransform,
} from '../photo-zoom';

const viewport = { width: 400, height: 800 };
const photo = { width: 400, height: 300 };
const center = { x: 0, y: 0 };
const initial: PhotoTransform = { zoom: 1, x: 0, y: 0 };

describe('fitContain', () => {
  it('fits a landscape photo to the screen width', () => {
    expect(fitContain(viewport, { width: 2000, height: 1500 })).toEqual(photo);
  });

  it('fits a tall photo to the screen height', () => {
    expect(fitContain(viewport, { width: 1000, height: 4000 })).toEqual({
      width: 200,
      height: 800,
    });
  });

  it('uses the whole screen until the image size is known', () => {
    expect(fitContain(viewport, { width: 0, height: 0 })).toEqual(viewport);
  });
});

describe('zoomAt', () => {
  it('stays between the minimum and the maximum zoom', () => {
    expect(zoomAt(initial, 0.2, center, photo, viewport).zoom).toBe(MIN_ZOOM);
    expect(zoomAt(initial, 20, center, photo, viewport).zoom).toBe(MAX_ZOOM);
  });

  it('keeps the point under the fingers in place', () => {
    const zoomed = zoomAt(initial, 2, { x: 100, y: 0 }, photo, viewport);
    expect(zoomed).toEqual({ zoom: 2, x: -100, y: 0 });
  });

  it('does not leave empty space beside the photo', () => {
    const zoomed = zoomAt(initial, 2, { x: 400, y: 0 }, photo, viewport);
    expect(zoomed.x).toBe(-200);
  });

  it('centers the photo again when zooming all the way out', () => {
    const zoomed = { zoom: 3, x: 300, y: 50 };
    expect(zoomAt(zoomed, 1, { x: 50, y: 50 }, photo, viewport)).toEqual(initial);
  });
});

describe('panBy', () => {
  it('does not move a photo that fits the screen', () => {
    expect(panBy(initial, { x: 80, y: 80 }, photo, viewport)).toEqual(initial);
  });

  it('moves a zoomed photo up to its edge', () => {
    const zoomed = { zoom: 2, x: 0, y: 0 };
    expect(panBy(zoomed, { x: 50, y: 0 }, photo, viewport).x).toBe(50);
    expect(panBy(zoomed, { x: 900, y: 0 }, photo, viewport).x).toBe(200);
  });

  it('only moves vertically when the zoomed photo is taller than the screen', () => {
    const zoomed = { zoom: 4, x: 0, y: 0 };
    expect(panBy(zoomed, { x: 0, y: 900 }, photo, viewport).y).toBe(200);
  });
});

describe('toggleZoom', () => {
  it('zooms in at the tapped point', () => {
    const zoomed = toggleZoom(initial, { x: 40, y: 0 }, photo, viewport);
    expect(zoomed.zoom).toBe(DOUBLE_TAP_ZOOM);
    expect(zoomed.x).toBe(-60);
  });

  it('goes back to the whole photo when already zoomed', () => {
    expect(toggleZoom({ zoom: 2, x: 90, y: 0 }, center, photo, viewport)).toEqual(initial);
  });
});
