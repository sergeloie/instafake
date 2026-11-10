export async function resizeImage(file: File, maxSide: number, quality = 0.85): Promise<Blob> {
  if (file.type === 'image/gif' || file.type === 'image/svg+xml') return file;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  if (scale === 1 && file.size < 1_500_000) {
    bitmap.close();
    return file;
  }
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) {
    bitmap.close();
    return file;
  }
  context.imageSmoothingQuality = 'high';
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
  return blob ?? file;
}

const PHOTO_FILES = Array.from({ length: 12 }, (_, index) => `photo-${index + 1}.jpg`);

export function samplePhotoUrl(sample: number): string {
  const index = (((sample - 1) % PHOTO_FILES.length) + PHOTO_FILES.length) % PHOTO_FILES.length;
  return `${import.meta.env.BASE_URL}samples/${PHOTO_FILES[index]}`;
}

export function sampleAvatarUrl(index: number): string {
  const file = (index % 3) + 1;
  return `${import.meta.env.BASE_URL}samples/avatar-${String(file).padStart(2, '0')}.jpg`;
}

export function commenterAvatarUrl(index: number): string {
  const file = (index % 16) + 1;
  return `${import.meta.env.BASE_URL}samples/commenter-${String(file).padStart(2, '0')}.jpg`;
}

export async function loadSampleBlob(url: string): Promise<Blob> {
  const response = await fetch(url);
  if (!response.ok) throw new Error('Не удалось прочитать демонстрационное изображение');
  return response.blob();
}
