import { z } from 'zod';
import { upsertBrevoContact } from '../brevo.js';
import {
  ASSOCIATIONS,
  CBA_STAGES,
  REJECTED_COUNT_VALUES,
  CATEGORY_OPTIONS,
  RESUBMIT_TIMELINES,
  HELP_NEEDED_OPTIONS,
  oneOf,
  boolRequired,
  normalizeCbaBody,
} from './shared/cbaCommon.js';

export const cbaRejectionSchema = z.object({
  FIRSTNAME: z.string().trim().min(1, 'First name is required').max(120),
  EMAIL: z.string().trim().email('Valid email is required'),
  PHONE: z.string().trim().min(7, 'Phone number is required').max(40),
  ASSOCIATION: oneOf(ASSOCIATIONS, 'association'),
  CBA_STAGE: oneOf(CBA_STAGES, 'stage'),
  REJECTED_COUNT: oneOf(REJECTED_COUNT_VALUES, 'rejected count'),
  REJECTED_CATEGORIES: z
    .array(oneOf(CATEGORY_OPTIONS, 'category'))
    .min(1, 'Select at least one competency category'),
  RESUBMIT_TIMELINE: oneOf(RESUBMIT_TIMELINES, 'timeline'),
  HELP_NEEDED: oneOf(HELP_NEEDED_OPTIONS, 'help option'),
  agree_privacy: boolRequired,
  agree_terms: boolRequired,
});

/** Brevo list "CBA Rejection" */
const LIST_ID = 5;

export async function handleCbaRejection(rawBody) {
  const body = normalizeCbaBody(rawBody);
  const parsed = cbaRejectionSchema.safeParse(body);
  if (!parsed.success) {
    const e = new Error('Validation failed');
    e.name = 'ZodError';
    e.zodError = parsed.error;
    throw e;
  }

  const d = parsed.data;
  const attributes = {
    FIRSTNAME: d.FIRSTNAME,
    PHONE: d.PHONE.trim(),
    ASSOCIATION: d.ASSOCIATION,
    CBA_STAGE: d.CBA_STAGE,
    REJECTED_COUNT: d.REJECTED_COUNT,
    REJECTED_CATEGORIES: d.REJECTED_CATEGORIES.join('; '),
    RESUBMIT_TIMELINE: d.RESUBMIT_TIMELINE,
    HELP_NEEDED: d.HELP_NEEDED,
  };

  return upsertBrevoContact({
    email: d.EMAIL,
    attributes,
    listIds: [LIST_ID],
  });
}

export const cbaRejectionMeta = {
  key: 'CBA_Rejection',
  listId: LIST_ID,
  title: 'Get Help Fixing Your Rejected CBA',
  description:
    'Tell us what happened with your competency assessment. We’ll review your situation and show you the best next step to strengthen your resubmission.',
  path: '/forms/cba-rejection.html',
  badge: 'CBA Rejection',
};
