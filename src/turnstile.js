/**
 * Verifies Cloudflare Turnstile token.
 * @see https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(token, remoteip) {
  const secret = process.env.TURNSTILE_SECRET_KEY || process.env.TURNSTILE;
  if (!secret) {
    throw new Error('Turnstile secret is not configured (TURNSTILE_SECRET_KEY or TURNSTILE)');
  }

  if (!token || typeof token !== 'string') {
    const err = new Error('Please complete the security check');
    err.status = 400;
    throw err;
  }

  const body = new URLSearchParams({
    secret,
    response: token,
  });
  if (remoteip) body.append('remoteip', remoteip);

  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body,
  });

  const data = await res.json();
  if (!data.success) {
    const err = new Error('Security verification failed. Please try again.');
    err.status = 400;
    err.details = data['error-codes'];
    throw err;
  }

  return data;
}

export function getTurnstileSiteKey() {
  return process.env.TURNSTILE_SITE_KEY || process.env.TURNSTILE_SITE || '';
}
