/**
 * Listing photos are always re-encoded to 1200px-wide JPEG at 70% quality — the
 * original pipeline's look (smoother, sRGB colors), which agents preferred.
 */
export const LISTING_IMAGE_MAX_WIDTH = 1200;

/** JPEG quality for every listing photo. */
export const LISTING_IMAGE_JPEG_QUALITY = 0.7;

/** Upload limit enforced on /api/upload. */
export const LISTING_IMAGE_MAX_BYTES = 10 * 1024 * 1024;

/** Vercel rejects request bodies over 4.5MB. */
export const LISTING_IMAGE_UPLOAD_TARGET_BYTES = 4 * 1024 * 1024;

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

function canvasToJpegBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
      'image/jpeg',
      quality
    );
  });
}

/** Resize to at most 1200px wide and re-encode as 70% JPEG. */
export async function prepareListingImageFile(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) {
    throw new Error('File must be an image');
  }

  const img = await loadImageFromFile(file).catch(() => {
    throw new Error(
      "This photo format can't be read in your browser (often iPhone HEIC). Export it as JPEG and try again."
    );
  });

  let width = img.width;
  let height = img.height;
  if (width > LISTING_IMAGE_MAX_WIDTH) {
    height = Math.round((height * LISTING_IMAGE_MAX_WIDTH) / width);
    width = LISTING_IMAGE_MAX_WIDTH;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not process image');
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await canvasToJpegBlob(canvas, LISTING_IMAGE_JPEG_QUALITY);
  if (blob.size > LISTING_IMAGE_UPLOAD_TARGET_BYTES) {
    throw new Error('Photo is too large to upload. Try a smaller photo.');
  }

  const baseName = file.name.replace(/\.[^.]+$/, '') || 'photo';
  return new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' });
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

  // Platform errors (e.g. 413 Payload Too Large) return HTML, not JSON
  const result = await response.json().catch(() => null);
  if (!response.ok || !result?.success || !result?.url) {
    if (response.status === 413) {
      throw new Error('Photo is too large to upload. Try a smaller photo.');
    }
    throw new Error(result?.error || `Failed to upload image (${response.status})`);
  }

  return result.url as string;
}
