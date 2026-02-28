import { v2 as cloudinary } from 'cloudinary';
import { errors } from './errors';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

export function isCloudinaryConfigured(): boolean {
  return !!(cloudName && apiKey && apiSecret);
}

export function initCloudinary(): void {
  if (!isCloudinaryConfigured()) return;
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret
  });
}

export function getCloudinaryUrl(publicId: string, options?: { width?: number; height?: number; crop?: string }): string {
  if (!cloudName) throw errors.internal('Cloudinary not configured');
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const transforms =
    options?.width || options?.height
      ? `w_${options.width ?? 'auto'},h_${options.height ?? 'auto'},c_${options?.crop ?? 'limit'}/`
      : '';
  return `${base}/${transforms}${publicId}`;
}

export async function uploadToCloudinary(
  buffer: Buffer,
  mimetype: string,
  options?: { folder?: string; publicId?: string }
): Promise<{ publicId: string; secureUrl: string }> {
  const dataUri = `data:${mimetype};base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    resource_type: 'image',
    folder: options?.folder || 'badrikidukan',
    public_id: options?.publicId,
    overwrite: !!options?.publicId
  });
  return { publicId: result.public_id, secureUrl: result.secure_url };
}
