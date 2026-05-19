import { z } from 'zod';
import { upsertBrevoContact } from '../brevo.js';

/** Brevo list "CBA Free Assessment Leads" */
const LIST_ID = 9;

export const cbaFreeAssessmentSchema = z.object({
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

export async function handleCbaFreeAssessment(rawBody) {
  const parsed = cbaFreeAssessmentSchema.safeParse(rawBody);
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

export const cbaFreeAssessmentMeta = {
  key: 'CBA_Free_Assessment',
  listId: LIST_ID,
  title: 'Free CBA Assessment',
  description: 'Get a free assessment of your CBA readiness. Share your contact details and we’ll follow up.',
  path: '/forms/cba-free-assessment.html',
  badge: 'Free Assessment',
};
