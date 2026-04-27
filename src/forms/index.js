import { handleCbaRejection, cbaRejectionMeta } from './cbaRejection.js';

/** @type {Map<string, { handle: (body: Record<string, unknown>) => Promise<unknown>, meta: { key: string, listId?: number } }>} */
const registry = new Map([
  ['CBA_Rejection', { handle: handleCbaRejection, meta: cbaRejectionMeta }],
]);

export function resolveForm(formKey) {
  if (!formKey || typeof formKey !== 'string') return null;
  return registry.get(formKey) ?? null;
}

export function listFormKeys() {
  return [...registry.keys()];
}
