import { handleCbaRejection, cbaRejectionMeta } from './cbaRejection.js';
import { handleCbaConsulting, cbaConsultingMeta } from './cbaConsulting.js';

/** @type {Map<string, { handle: Function, meta: object }>} */
const registry = new Map([
  ['CBA_Rejection', { handle: handleCbaRejection, meta: cbaRejectionMeta }],
  ['CBA_Consulting', { handle: handleCbaConsulting, meta: cbaConsultingMeta }],
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
