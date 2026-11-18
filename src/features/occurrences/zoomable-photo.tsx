import { Image, type ImageSource } from 'expo-image';
import { StyleSheet } from 'react-native';
import {
  GestureDetector,
  GestureHandlerRootView,
  useCompetingGestures,
  usePanGesture,
  usePinchGesture,
  useSimultaneousGestures,
  useTapGesture,
} from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import {
  fitContain,
  MIN_ZOOM,
  panBy,
  toggleZoom,
  zoomAt,
  type PhotoTransform,
  type Size,
} from './photo-zoom';

const EMPTY_SIZE: Size = { width: 0, height: 0 };

type ZoomablePhotoProps = {
  source: ImageSource;
  onError: () => void;
};

/**
 * Pinch to zoom, drag to move and double tap to toggle (Flutter:
 * InteractiveViewer). Shared values and gesture callbacks run on the UI thread,
 * so the photo follows the fingers without re-rendering React on each frame.
 */
export function ZoomablePhoto({ source, onError }: ZoomablePhotoProps) {
  const zoom = useSharedValue(MIN_ZOOM);
  const x = useSharedValue(0);
  const y = useSharedValue(0);
  const viewport = useSharedValue(EMPTY_SIZE);
  const imageSize = useSharedValue(EMPTY_SIZE);

  function current(): PhotoTransform {
    'worklet';
    return { zoom: zoom.get(), x: x.get(), y: y.get() };
  }

  function photoSize(): Size {
    'worklet';
    return fitContain(viewport.get(), imageSize.get());
  }

  function fromCenter(pointX: number, pointY: number) {
    'worklet';
    const { width, height } = viewport.get();
    return { x: pointX - width / 2, y: pointY - height / 2 };
  }

  function apply(next: PhotoTransform) {
    'worklet';
    zoom.set(next.zoom);
    x.set(next.x);
    y.set(next.y);
  }

  const pinch = usePinchGesture({
    onUpdate: (event) => {
      const focal = fromCenter(event.focalX, event.focalY);
      const nextZoom = zoom.get() * event.scaleChange;
      apply(zoomAt(current(), nextZoom, focal, photoSize(), viewport.get()));
    },
  });

  const pan = usePanGesture({
    onUpdate: (event) => {
      const change = { x: event.changeX, y: event.changeY };
      apply(panBy(current(), change, photoSize(), viewport.get()));
    },
  });

  const doubleTap = useTapGesture({
    numberOfTaps: 2,
    // The default (200 ms) misses an unhurried double tap.
    maxDelay: 300,
    onActivate: (event) => {
      const focal = fromCenter(event.x, event.y);
      const next = toggleZoom(current(), focal, photoSize(), viewport.get());
      zoom.set(withTiming(next.zoom));
      x.set(withTiming(next.x));
      y.set(withTiming(next.y));
    },
  });

  const moveAndZoom = useSimultaneousGestures(pinch, pan);
  const gesture = useCompetingGestures(doubleTap, moveAndZoom);

  const photoStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.get() }, { translateY: y.get() }, { scale: zoom.get() }],
  }));

  return (
    <GestureHandlerRootView style={styles.fill}>
      <GestureDetector gesture={gesture}>
        {/* Not transformed: finger positions must not move along with the photo. */}
        <Animated.View
          style={styles.fill}
          onLayout={(event) => {
            const { width, height } = event.nativeEvent.layout;
            viewport.set({ width, height });
          }}
        >
          <Animated.View style={[styles.fill, photoStyle]}>
            <Image
              source={source}
              cachePolicy="memory"
              contentFit="contain"
              accessibilityLabel="Foto da ocorrência"
              onLoad={(event) => {
                const { width, height } = event.source;
                imageSize.set({ width, height });
              }}
              onError={onError}
              style={styles.fill}
            />
          </Animated.View>
        </Animated.View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
  },
});
