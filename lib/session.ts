/**
 * Lightweight signed-cookie session — we own auth entirely (LINE login happens
 * in our own routes) and use Supabase only as a database via the service role.
 *
 * Token format: base64url(JSON payload) + "." + base64url(HMAC-SHA256).
 * Uses Web Crypto so it runs in both the Edge middleware and Node routes.
 */

export const SESSION_COOKIE = 'ds_session';
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export interface SessionPayload {
  pid: string; // profile id
  exp: number; // unix seconds
}

const encoder = new TextEncoder();

function bytesToB64url(bytes: Uint8Array): string {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlToBytes(input: string): Uint8Array {
  let s = input.replace(/-/g, '+').replace(/_/g, '/');
  const pad = s.length % 4 ? 4 - (s.length % 4) : 0;
  s += '='.repeat(pad);
  const bin = atob(s);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function secret(): string {
  const s =
    process.env.SESSION_SECRET?.trim() ||
    process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!s) throw new Error('SESSION_SECRET / SUPABASE_SERVICE_ROLE_KEY not set');
  return s;
}

async function hmacKey(): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function createSessionToken(pid: string): Promise<string> {
  const payload: SessionPayload = {
    pid,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };
  const body = bytesToB64url(encoder.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(
    await crypto.subtle.sign('HMAC', await hmacKey(), encoder.encode(body)),
  );
  return `${body}.${bytesToB64url(sig)}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionPayload | null> {
  if (!token) return null;
  const [body, sig] = token.split('.');
  if (!body || !sig) return null;

  try {
    const ok = await crypto.subtle.verify(
      'HMAC',
      await hmacKey(),
      b64urlToBytes(sig) as unknown as BufferSource,
      encoder.encode(body),
    );
    if (!ok) return null;

    const payload = JSON.parse(
      new TextDecoder().decode(b64urlToBytes(body)),
    ) as SessionPayload;

    if (!payload.pid) return null;
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
