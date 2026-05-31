import { createHmac, randomUUID } from 'node:crypto';

const CDN_API_KEY = process.env.CDN_API_KEY ?? '';
const CDN_URL = process.env.CDN_URL ?? '';
const DEFAULT_EXPIRY = Number(process.env.CDN_TOKEN_EXPIRY_SECONDS ?? '3600');

export interface SignedToken {
  token: string;
  expiresAt: number;
  signedUrl: string;
}

export function signBunnyUrl(videoPath: string, userIp?: string, expiresInSeconds?: number): SignedToken {
  const expiresAt = Math.floor(Date.now() / 1000) + (expiresInSeconds ?? DEFAULT_EXPIRY);
  const tokenId = randomUUID().slice(0, 8);

  const urlPath = videoPath.startsWith('/') ? videoPath : `/${videoPath}`;
  const hashString = `${CDN_API_KEY}${urlPath}${expiresAt}${userIp ?? ''}`;
  const token = createHmac('sha256', CDN_API_KEY).update(hashString, 'utf8').digest('hex');

  const queryParams = new URLSearchParams({
    token,
    expires: expiresAt.toString(),
    ...(userIp ? { ip: userIp } : {}),
    ...(tokenId ? { id: tokenId } : {}),
  });

  const baseUrl = CDN_URL.replace(/\/+$/, '');
  const signedUrl = `${baseUrl}${urlPath}?${queryParams.toString()}`;

  return { token, expiresAt, signedUrl };
}
