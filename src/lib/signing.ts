import crypto from 'crypto';

function getSigningSecret(): string {
  return process.env.MEDIA_SIGNING_SECRET || process.env.JWT_SECRET || 'dev_media_secret';
}

export function createSignature(payload: string): string {
  const h = crypto.createHmac('sha256', getSigningSecret());
  h.update(payload);
  return h.digest('hex');
}

export function signPath(path: string, exp: number): { exp: number; sig: string } {
  const payload = `${path}:${exp}`;
  const sig = createSignature(payload);
  return { exp, sig };
}

export function verifySignature(path: string, exp: number, sig: string): boolean {
  if (Date.now() > exp) return false;
  const expected = createSignature(`${path}:${exp}`);
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(sig));
}


