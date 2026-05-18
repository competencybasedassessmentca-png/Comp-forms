import { z } from 'zod';
import { upsertBrevoContact, resolveContactId, uploadBrevoFile } from '../brevo.js';
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

const LIST_ID = 8;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXT = /\.(pdf|doc|docx)$/i;

export const cbaConsultingSchema = z.object({
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
  SITUATION: z.string().trim().min(10, 'Please describe your situation (at least 10 characters)').max(8000),
  agree_privacy: boolRequired,
  agree_terms: boolRequired,
});

function validateUploadFile(file, label) {
  if (!file || !file.buffer?.length) {
    const e = new Error(`${label} is required`);
    e.name = 'ZodError';
    e.zodError = { issues: [{ message: e.message }] };
    throw e;
  }
  if (file.size > 10 * 1024 * 1024) {
    const e = new Error(`${label} must be 10 MB or smaller`);
    e.name = 'ZodError';
    e.zodError = { issues: [{ message: e.message }] };
    throw e;
  }
  const mimeOk = file.mimetype && ALLOWED_MIME.has(file.mimetype);
  const extOk = file.originalname && ALLOWED_EXT.test(file.originalname);
  if (!mimeOk && !extOk) {
    const e = new Error(`${label} must be a PDF or Word document (.pdf, .doc, .docx)`);
    e.name = 'ZodError';
    e.zodError = { issues: [{ message: e.message }] };
    throw e;
  }
}

/**
 * @param {Record<string, unknown>} rawBody
 * @param {{ file_cv?: import('multer').File, file_cba?: import('multer').File }} files
 */
export async function handleCbaConsulting(rawBody, files = {}) {
  const body = normalizeCbaBody(rawBody);
  const parsed = cbaConsultingSchema.safeParse(body);
  if (!parsed.success) {
    const e = new Error('Validation failed');
    e.name = 'ZodError';
    e.zodError = parsed.error;
    throw e;
  }

  const cv = files.file_cv;
  const cba = files.file_cba;
  validateUploadFile(cv, 'CV');
  validateUploadFile(cba, 'CBA document');

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
    SITUATION: d.SITUATION,
  };

  const contactResult = await upsertBrevoContact({
    email: d.EMAIL,
    attributes,
    listIds: [LIST_ID],
  });

  const contactId = await resolveContactId(d.EMAIL, contactResult);

  await uploadBrevoFile({
    contactId,
    buffer: cv.buffer,
    filename: cv.originalname || 'cv.pdf',
    mimeType: cv.mimetype,
  });

  await uploadBrevoFile({
    contactId,
    buffer: cba.buffer,
    filename: cba.originalname || 'cba.pdf',
    mimeType: cba.mimetype,
  });

  return { id: contactId, filesUploaded: 2 };
}

export const cbaConsultingMeta = {
  key: 'CBA_Consulting',
  listId: LIST_ID,
  title: 'CBA Consulting',
  description:
    'Request P.Eng. CBA consulting support. Tell us your situation and upload your CV and CBA so we can review and advise you.',
  path: '/forms/cba-consulting.html',
  badge: 'CBA Consulting',
  acceptsMultipart: true,
};
