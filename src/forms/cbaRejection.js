import { z } from 'zod';
import { upsertBrevoContact } from '../brevo.js';

const ASSOCIATIONS = [
  'PEO',
  'APEGS',
  'EGBC',
  'APEGA',
  'Engineers Nova Scotia',
  'Engineers Geoscientists Manitoba',
  'Engineers PEI',
  'Engineers Yukon',
  'NAPEG',
  'OIQ',
  'Other',
];

const CBA_STAGES = [
  'I received rejection/comments and need to resubmit',
  'I received partial approval, but some competencies were rejected',
  'My whole CBA submission was rejected',
  'I have not submitted yet, but I’m worried about rejection',
  'I’m preparing my first CBA submission',
];

const REJECTED_COUNT_VALUES = [
  ...Array.from({ length: 33 }, (_, i) => String(i + 1)),
  'All competencies',
];

const CATEGORY_OPTIONS = [
  'Technical competence',
  'Communication',
  'Project and financial management',
  'Team effectiveness',
  'Professional accountability',
  'Social, economic, environmental, and sustainability',
  'Personal continuing professional development',
  'I’m not sure',
];

const RESUBMIT_TIMELINES = [
  'As soon as possible',
  'Within 1 week',
  'Within 2-4 weeks',
  'Within 1-2 months',
  'No deadline yet',
];

const HELP_NEEDED_OPTIONS = [
  'Review my rejection comments',
  'Review my rejected competencies',
  'Help me rewrite and improve my competencies',
  'P.Eng. review before resubmission',
  'Full support until I resubmit',
  'I’m not sure yet',
];

function oneOf(values, label) {
  return z.string().refine((v) => values.includes(v), { message: `Invalid ${label}` });
}

const boolRequired = z.preprocess(
  (v) => v === true || v === 'true' || v === 'on' || v === 1 || v === '1',
  z.boolean().refine((b) => b === true, { message: 'Required' }),
);

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

function normalizeCheckboxArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
}

function normalizeBody(body) {
  const next = { ...body };
  next.REJECTED_CATEGORIES = normalizeCheckboxArray(body.REJECTED_CATEGORIES);
  if (next.PHONE === undefined || next.PHONE === null) next.PHONE = '';
  return next;
}

export async function handleCbaRejection(rawBody) {
  const body = normalizeBody(rawBody);
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
};
