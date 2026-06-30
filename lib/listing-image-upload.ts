/** Max long edge for listing photos — sharp on retina, below most Zillow originals. */
export const LISTING_IMAGE_MAX_DIMENSION = 2400;

/** JPEG quality when re-encoding is required. */
export const LISTING_IMAGE_JPEG_QUALITY = 0.92;

/** WebP quality when the browser supports canvas WebP export. */
export const LISTING_IMAGE_WEBP_QUALITY = 0.88;

/** Upload limit enforced client-side and on /api/upload. */
export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

function canvasSupportsWebp(): boolean {
  if (typeof document === 'undefined') return false;
  const canvas = document.createElement('canvas');
  return canvas.toDataURL('image/webp').startsWith('data:image/webp');
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to read image'));
    };
    img.src = url;
  });
}

function encodeCanvas(canvas: HTMLCanvasElement, preferWebp: boolean): { blob: Blob; mime: string } | null {
  const tryTypes: { mime: string; quality: number }[] = preferWebp
    ? [
        { mime: 'image/webp', quality: LISTING_IMAGE_WEBP_QUALITY },
        { mime: 'image/jpeg', quality: LISTING_IMAGE_JPEG_QUALITY },
      ]
    : [{ mime: 'image/jpeg', quality: LISTING_IMAGE_JPEG_QUALITY }];

  for (const { mime, quality } of tryTypes) {
    const dataUrl = canvas.toDataURL(mime, quality);
    if (!dataUrl.startsWith(`data:${mime}`)) continue;
    const base64 = dataUrl.split(',')[1];
    if (!base64) continue;
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return { blob: new Blob([bytes], { type: mime }), mime };
  }
  return null;
}

/**
 * Prepare a listing image for upload: keep originals when already within limits,
 * otherwise resize (max 2400px) and re-encode at high quality.
 */
export async function prepareListingImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const img = await loadImageFromFile(file);
  const longEdge = Math.max(img.width, img.height);
  const withinSize = file.size <= LISTING_IMAGE_MAX_BYTES;
  const withinDimensions = longEdge <= LISTING_IMAGE_MAX_DIMENSION;

  if (withinSize && withinDimensions) {
    return file;
  }

  let width = img.width;
  let height = img.height;
  if (longEdge > LISTING_IMAGE_MAX_DIMENSION) {
    const scale = LISTING_IMAGE_MAX_DIMENSION / longEdge;
    width = Math.round(width * scale);
    height = Math.round(height * scale);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image');
  ctx.drawImage(img, 0, 0, width, height);

  const preferWebp = canvasSupportsWebp();
  let encoded = encodeCanvas(canvas, preferWebp);

  if (!encoded) {
    throw new Error('Could not encode image');
  }

  let blob = encoded.blob;
  let ext = encoded.mime === 'image/webp' ? 'webp' : 'jpg';

  if (blob.size > LISTING_IMAGE_MAX_BYTES) {
    const fallbackCanvas = canvas;
    for (const quality of [0.85, 0.78, 0.7]) {
      const dataUrl = fallbackCanvas.toDataURL('image/jpeg', quality);
      const base64 = dataUrl.split(',')[1];
      if (!base64) continue;
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      blob = new Blob([bytes], { type: 'image/jpeg' });
      ext = 'jpg';
      if (blob.size <= LISTING_IMAGE_MAX_BYTES) break;
    }
  }

  if (blob.size > LISTING_IMAGE_MAX_BYTES) {
    throw new Error(
      `Image is too large after processing (${(blob.size / 1024 / 1024).toFixed(1)}MB). Try a smaller photo.`
    );
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.${ext}`, { type: blob.type });
}

export async function uploadListingImageToStorage(
  file: File,
  projectId: string
): Promise<string> {
  const prepared = await prepareListingImageFile(file);
  const formData = new FormData();
  formData.append('file', prepared);
  formData.append('projectId', projectId);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok || !result.success || !result.url) {
    throw new Error(result.error || 'Failed to upload image');
  }

  return result.url as string;
}
