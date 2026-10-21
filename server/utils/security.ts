import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import type { UserRole } from '../../src/shared/types.ts';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || crypto.createHash('sha256').update('keerthi_access_secret_key_v1').digest('hex');
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || crypto.createHash('sha256').update('keerthi_refresh_secret_key_v1').digest('hex');
const ENCRYPTION_KEY_BUF = crypto
  .createHash('sha256')
  .update(process.env.TOKEN_ENCRYPTION_KEY || 'keerthi_oauth_token_encryption_key_v1')
  .digest();

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  name: string;
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '2h' });
}

export function signRefreshToken(payload: JwtPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, ACCESS_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function verifyRefreshToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, REFRESH_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

export function encryptSensitiveToken(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY_BUF, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

export function decryptSensitiveToken(cipherText: string): string {
  const parts = cipherText.split(':');
  if (parts.length !== 3) throw new Error('Invalid encrypted token format');
  const [ivHex, authTagHex, encryptedHex] = parts;
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    ENCRYPTION_KEY_BUF,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encryptedHex, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
}

export function generateSingleUseResetToken(): { rawToken: string; tokenHash: string; expiresAt: string } {
  const rawToken = crypto.randomBytes(24).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString(); // 30 minutes
  return { rawToken, tokenHash, expiresAt };
}

export function hashResetToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}
