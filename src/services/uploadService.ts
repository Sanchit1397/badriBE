import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';

import { isCloudinaryConfigured, uploadToCloudinary } from '../lib/cloudinary';
import { Media } from '../models/Media';

export async function uploadImage(params: {
  buffer: Buffer;
  mimetype: string;
  originalname: string;
  size: number;
}): Promise<{ hash: string }> {
  const { buffer, mimetype, originalname, size } = params;
  const hash = crypto.createHash('sha256').update(buffer).digest('hex');

  if (isCloudinaryConfigured()) {
    const { publicId } = await uploadToCloudinary(buffer, mimetype, {
      folder: 'badrikidukan',
      publicId: hash
    });
    await Media.updateOne(
      { hash: publicId },
      { $setOnInsert: { filename: originalname, mimeType: mimetype, size } },
      { upsert: true }
    );
    return { hash: publicId };
  }

  await Media.updateOne(
    { hash },
    { $setOnInsert: { filename: originalname, mimeType: mimetype, size } },
    { upsert: true }
  );
  const uploadRoot = path.resolve(process.cwd(), 'uploads');
  await fs.mkdir(uploadRoot, { recursive: true });
  const abs = path.join(uploadRoot, hash);
  try {
    await fs.access(abs);
  } catch {
    await fs.writeFile(abs, buffer);
  }
  return { hash };
}
