import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase/config';

// Ограничения загрузки аватара — держим Storage-лимиты под контролем:
// - сырой файл не больше 8 МБ (просто чтобы не пытаться грузить в canvas
//   что-то абсурдное — телефонное фото 20+ Мп весит меньше)
// - после сжатия итоговый JPEG обычно 30–150 КБ независимо от исходника
const MAX_RAW_FILE_BYTES = 8 * 1024 * 1024;
const MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.82;

export class AvatarUploadError extends Error {}

// Сжимает изображение на клиенте (макс. сторона 512px, JPEG ~0.82) перед
// загрузкой — не зависит от того, что выбрал пользователь: хоть RAW с
// зеркалки, хоть 48-мегапиксельный снимок с телефона, в Storage уйдёт
// маленький файл.
async function compressImage(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new AvatarUploadError(
      'Не удалось обработать изображение. Попробуйте JPEG или PNG.',
    );
  }

  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new AvatarUploadError('Браузер не поддерживает обработку изображений');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new AvatarUploadError('Не удалось сжать изображение'))),
      'image/jpeg',
      JPEG_QUALITY,
    );
  });
}

// Сжимает и загружает аватар пользователя, возвращает публичный download URL.
// Путь фиксированный (avatars/{uid}/avatar.jpg) — новая загрузка перезаписывает
// старую, в Storage не копятся файлы от прошлых аватаров.
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new AvatarUploadError('Выберите файл изображения');
  }
  if (file.size > MAX_RAW_FILE_BYTES) {
    throw new AvatarUploadError('Файл слишком большой (максимум 8 МБ)');
  }

  const compressed = await compressImage(file);
  const avatarRef = ref(storage, `avatars/${userId}/avatar.jpg`);
  await uploadBytes(avatarRef, compressed, { contentType: 'image/jpeg' });
  return getDownloadURL(avatarRef);
}
