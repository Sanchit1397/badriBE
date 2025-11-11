import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

export async function hashPassword(plain: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(plain, saltRounds);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export interface AppJwtPayload {
  uid: string;
  role: 'user' | 'admin';
  email: string;
  name?: string;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Missing JWT_SECRET');
  return secret;
}

export async function signJwt(payload: AppJwtPayload): Promise<string> {
  return jwt.sign(payload, getJwtSecret(), { algorithm: 'HS256', expiresIn: '7d' });
}

export async function verifyJwt(token: string): Promise<AppJwtPayload | null> {
  try {
    return jwt.verify(token, getJwtSecret()) as AppJwtPayload;
  } catch {
    return null;
  }
}


