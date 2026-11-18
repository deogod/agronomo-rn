import { useLocalSearchParams } from 'expo-router';

import { PhotoViewer } from '@/features/occurrences/photo-viewer';

export default function PhotoScreen() {
  const { mediaId } = useLocalSearchParams<{ mediaId: string }>();
  return <PhotoViewer mediaId={Number(mediaId)} />;
}
