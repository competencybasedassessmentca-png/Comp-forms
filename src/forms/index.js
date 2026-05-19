import { handleCbaRejection, cbaRejectionMeta } from './cbaRejection.js';
import { handleCbaConsulting, cbaConsultingMeta } from './cbaConsulting.js';
import { handleCbaFreeAssessment, cbaFreeAssessmentMeta } from './cbaFreeAssessment.js';
import { handleCbaFreeExample, cbaFreeExampleMeta } from './cbaFreeExample.js';

/** @type {Map<string, { handle: Function, meta: object }>} */
const registry = new Map([
  ['CBA_Rejection', { handle: handleCbaRejection, meta: cbaRejectionMeta }],
  ['CBA_Consulting', { handle: handleCbaConsulting, meta: cbaConsultingMeta }],
  ['CBA_Free_Assessment', { handle: handleCbaFreeAssessment, meta: cbaFreeAssessmentMeta }],
  ['CBA_Free_Example', { handle: handleCbaFreeExample, meta: cbaFreeExampleMeta }],
]);

export function resolveForm(formKey) {
  if (!formKey || typeof formKey !== 'string') return null;
  return registry.get(formKey) ?? null;
}

export function listFormKeys() {
  return [...registry.keys()];
}

export function listFormsCatalog() {
  return [...registry.values()]
    .map(({ meta }) => meta)
    .filter((meta) => meta.path && meta.title)
    .map(({ key, title, description, path, badge }) => ({
      key,
      title,
      description,
      path,
      badge: badge || key,
    }));
}
