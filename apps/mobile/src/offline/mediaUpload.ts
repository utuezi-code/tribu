import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import { mediaApi } from "../api/media.api";
import type { Media, MediaType } from "../types/models";

const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.7;

async function compressPhoto(uri: string): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_DIMENSION } }],
    { compress: JPEG_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );
  return result.uri;
}

/**
 * Ouvre le sélecteur de médias, compresse les photos avant upload (exigence
 * DoD "compression à l'upload obligatoire"), puis uploade et enregistre le
 * média sur l'événement. La compression vidéo réelle (transcodage) est hors
 * scope V1 — voir DECISIONS.md.
 */
export async function pickAndUploadMedia(eventId: string): Promise<Media | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.All,
    quality: 1,
  });
  const asset = picked.canceled ? undefined : picked.assets[0];
  if (!asset) return null;

  const type: MediaType = asset.type === "video" ? "VIDEO" : "PHOTO";
  const localUri = type === "PHOTO" ? await compressPhoto(asset.uri) : asset.uri;
  const extension = (localUri.split(".").pop() ?? "jpg").toLowerCase();

  const { uploadUrl, storageUrl } = await mediaApi.requestUploadUrl(eventId, extension);

  const fileResponse = await fetch(localUri);
  const blob = await fileResponse.blob();
  await fetch(uploadUrl, {
    method: "PUT",
    body: blob,
    headers: { "Content-Type": type === "PHOTO" ? "image/jpeg" : "video/mp4" },
  });

  return mediaApi.register(eventId, { storageUrl, type });
}
