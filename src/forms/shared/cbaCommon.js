import { z } from 'zod';

export const ASSOCIATIONS = [
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

export const CBA_STAGES = [
  'I received rejection/comments and need to resubmit',
  'I received partial approval, but some competencies were rejected',
  'My whole CBA submission was rejected',
  'I have not submitted yet, but I’m worried about rejection',
  'I’m preparing my first CBA submission',
];

export const REJECTED_COUNT_VALUES = [
  ...Array.from({ length: 33 }, (_, i) => String(i + 1)),
  'All competencies',
];

export const CATEGORY_OPTIONS = [
  'Technical competence',
  'Communication',
  'Project and financial management',
  'Team effectiveness',
  'Professional accountability',
  'Social, economic, environmental, and sustainability',
  'Personal continuing professional development',
  'I’m not sure',
];

export const RESUBMIT_TIMELINES = [
  'As soon as possible',
  'Within 1 week',
  'Within 2-4 weeks',
  'Within 1-2 months',
  'No deadline yet',
];

export const HELP_NEEDED_OPTIONS = [
  'Review my rejection comments',
  'Review my rejected competencies',
  'Help me rewrite and improve my competencies',
  'P.Eng. review before resubmission',
  'Full support until I resubmit',
  'I’m not sure yet',
];

export function oneOf(values, label) {
  return z.string().refine((v) => values.includes(v), { message: `Invalid ${label}` });
}

export const boolRequired = z.preprocess(
  (v) => v === true || v === 'true' || v === 'on' || v === 1 || v === '1',
  z.boolean().refine((b) => b === true, { message: 'Required' }),
);

export function normalizeCheckboxArray(value) {
  if (value === undefined || value === null) return [];
  if (Array.isArray(value)) return value.filter(Boolean).map(String);
  return [String(value)];
}

export function normalizeCbaBody(body) {
  const next = { ...body };
  next.REJECTED_CATEGORIES = normalizeCheckboxArray(body.REJECTED_CATEGORIES);
  if (next.PHONE === undefined || next.PHONE === null) next.PHONE = '';
  return next;
}
