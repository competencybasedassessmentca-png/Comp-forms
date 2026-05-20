import { z } from 'zod';
import { upsertBrevoContact } from '../brevo.js';

/** Brevo list "CBA Free Example" */
const LIST_ID = 13;

const simpleLeadSchema = z.object({
  FIRSTNAME: z.string().trim().min(1, 'First name is required').max(120),
  LASTNAME: z.string().trim().min(1, 'Last name is required').max(120),
  EMAIL: z.string().trim().email('Valid email is required'),
  PHONE: z.string().trim().min(7, 'Phone number is required').max(40),
  agree_privacy: z.preprocess(
    (v) => v === true || v === 'true' || v === 'on' || v === 1 || v === '1',
    z.boolean().refine((b) => b === true, { message: 'Required' }),
  ),
  agree_terms: z.preprocess(
    (v) => v === true || v === 'true' || v === 'on' || v === 1 || v === '1',
    z.boolean().refine((b) => b === true, { message: 'Required' }),
  ),
});

export async function handleCbaFreeExample(rawBody) {
  const parsed = simpleLeadSchema.safeParse(rawBody);
  if (!parsed.success) {
    const e = new Error('Validation failed');
    e.name = 'ZodError';
    e.zodError = parsed.error;
    throw e;
  }

  const d = parsed.data;
  return upsertBrevoContact({
    email: d.EMAIL,
    attributes: {
      FIRSTNAME: d.FIRSTNAME,
      LASTNAME: d.LASTNAME,
      PHONE: d.PHONE.trim(),
    },
    listIds: [LIST_ID],
  });
}

export const cbaFreeExampleMeta = {
  key: 'CBA_Free_Example',
  listId: LIST_ID,
  title: 'Free CBA Example',
  description:
    'Request a free P.Eng. CBA example. Enter your details and we’ll send your example or follow up with next steps.',
  path: '/forms/cba-free-example.html',
  badge: 'Free Example',
};
