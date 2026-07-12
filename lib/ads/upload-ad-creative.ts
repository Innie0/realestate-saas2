import { prepareListingImageFile } from '@/lib/listing-image-upload';

export async function uploadAdCreativeFile(file: File, draftId: string): Promise<string> {
  const prepared = await prepareListingImageFile(file);
  const formData = new FormData();
  formData.append('file', prepared);
  formData.append('draftId', draftId);

  const response = await fetch('/api/ads/upload-creative', {
    method: 'POST',
    body: formData,
  });

  const result = await response.json();
  if (!response.ok || !result.success || !result.url) {
    throw new Error(result.error || 'Failed to upload image');
  }

  return result.url as string;
}
