/**
 * Meta's deauthorize and data-deletion callbacks send a `signed_request`:
 * "<signature>.<payload>", both base64url, signed with our app secret
 * (HMAC-SHA256). We only trust the payload when the signature matches.
 */

import { createHmac, timingSafeEqual } from 'crypto';

export interface MetaSignedRequestPayload {
  algorithm: string;
  issued_at?: number;
  /** App-scoped Facebook user ID */
  user_id: string;
}

function base64UrlDecode(value: string): Buffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(base64 + '='.repeat((4 - (base64.length % 4)) % 4), 'base64');
}

export function parseMetaSignedRequest(
  signedRequest: string | null | undefined,
  appSecret: string | undefined = process.env.META_APP_SECRET,
): MetaSignedRequestPayload | null {
  if (!signedRequest || !appSecret) return null;
  const [encodedSignature, encodedPayload] = signedRequest.split('.', 2);
  if (!encodedSignature || !encodedPayload) return null;

  const expected = createHmac('sha256', appSecret).update(encodedPayload).digest();
  const actual = base64UrlDecode(encodedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString('utf8'));
    if (String(payload.algorithm).toUpperCase() !== 'HMAC-SHA256' || !payload.user_id) return null;
    return { ...payload, user_id: String(payload.user_id) };
  } catch {
    return null;
  }
}

/** Reads `signed_request` from Meta's form-encoded POST body. */
export async function readSignedRequest(request: Request): Promise<string | null> {
  try {
    const form = await request.formData();
    const value = form.get('signed_request');
    return typeof value === 'string' ? value : null;
  } catch {
    return null;
  }
}
