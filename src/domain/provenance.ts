/** Identifies how a value entered the domain; it is not a confidence score. */
export type Provenance =
  | 'user_confirmed'
  | 'observed'
  | 'ai_inferred'
  | 'external'
  | 'default_imputed'
  | 'unknown';
