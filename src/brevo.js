/**
 * Creates or updates a Brevo contact via POST /v3/contacts
 * @param {{ email: string, attributes: Record<string, string | number | boolean>, listIds: number[] }} payload
 */
export async function upsertBrevoContact(payload) {
  const key = process.env.BREVO_API_KEY;
  if (!key) {
    throw new Error('BREVO_API_KEY is not configured');
  }

  const body = {
    email: payload.email,
    attributes: payload.attributes,
    listIds: payload.listIds,
    emailBlacklisted: false,
    smsBlacklisted: false,
    updateEnabled: true,
  };

  const res = await fetch('https://api.brevo.com/v3/contacts', {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'api-key': key,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || `Brevo API error (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}

/**
 * @param {string} email
 * @param {{ id?: number }} createResponse
 */
export async function resolveContactId(email, createResponse) {
  if (createResponse?.id) return createResponse.id;

  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not configured');

  const res = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
    headers: { accept: 'application/json', 'api-key': key },
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = {};
  }

  if (res.ok && data.id) return data.id;

  const err = new Error('Could not resolve Brevo contact for file upload');
  err.status = res.status || 502;
  err.details = data;
  throw err;
}

/**
 * @param {{ contactId: number, buffer: Buffer, filename: string, mimeType?: string }} payload
 */
export async function uploadBrevoFile(payload) {
  const key = process.env.BREVO_API_KEY;
  if (!key) throw new Error('BREVO_API_KEY is not configured');

  const body = new FormData();
  const blob = new Blob([payload.buffer], {
    type: payload.mimeType || 'application/octet-stream',
  });
  body.append('file', blob, payload.filename);
  body.append('contactId', String(payload.contactId));

  const res = await fetch('https://api.brevo.com/v3/crm/files', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': key },
    body,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data.message || data.error || `Brevo file upload failed (${res.status})`);
    err.status = res.status;
    err.details = data;
    throw err;
  }

  return data;
}
