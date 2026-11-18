/**
 * Picks a photo and prepares it for upload (Flutter: CameraGate, FilePicker
 * and FlutterImageCompress). The system camera replaces the Flutter app's
 * custom camera screen: it already handles focus, zoom and confirmation.
 */
import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { photoResize } from './photo-size';

export type PhotoSource = 'camera' | 'gallery';

/** A failure with a message the screen can show as is. */
export class PhotoError extends Error {}

/** The chosen photo, or null when the user cancelled. */
export async function pickPhoto(source: PhotoSource): Promise<ImagePicker.ImagePickerAsset | null> {
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 1 };

  if (source === 'gallery') {
    // The system gallery runs outside the app, so it needs no permission.
    const result = await ImagePicker.launchImageLibraryAsync(options);
    return result.canceled ? null : (result.assets[0] ?? null);
  }

  const { granted } = await ImagePicker.requestCameraPermissionsAsync();
  if (!granted) throw new PhotoError('Permita o acesso à câmera nos ajustes do aparelho.');

  try {
    const result = await ImagePicker.launchCameraAsync(options);
    return result.canceled ? null : (result.assets[0] ?? null);
  } catch (error) {
    // Devices without a usable camera reject here.
    throw new PhotoError('Não foi possível abrir a câmera neste aparelho.', { cause: error });
  }
}

/**
 * Shrinks the photo and converts it to JPEG. Converting also covers HEIC from
 * iPhones. The work runs on the native side, so the JS thread stays free.
 *
 * Returns an expo-file-system File because the global fetch in this SDK is
 * expo/fetch: its FormData reads file parts through bytes() and does not
 * support React Native's classic { uri, name, type } object.
 */
export async function preparePhoto(asset: ImagePicker.ImagePickerAsset): Promise<File> {
  const context = ImageManipulator.manipulate(asset.uri);
  try {
    const resize = photoResize(asset.width, asset.height);
    if (resize) context.resize(resize);

    const image = await context.renderAsync();
    try {
      const saved = await image.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });
      return new File(saved.uri);
    } finally {
      image.release();
    }
  } finally {
    // Native memory is not freed by the JS garbage collector in time.
    context.release();
  }
}
