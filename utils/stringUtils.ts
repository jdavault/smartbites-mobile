/** Basic ascii-only slugify with diacritic stripping. */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

/** FNV-1a 32-bit hash (fast, deterministic). */
export function fnv1a32(str: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
  }
  return ('00000000' + h.toString(16)).slice(-8);
}

/** Normalize free text. */
export function normText(s?: string): string {
  return (s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Normalize and sort a list of strings. */
export function normList(items?: string[]): string {
  const set = new Set<string>(
    (items ?? []).map((x) => x.trim().toLowerCase()).filter(Boolean)
  );
  return Array.from(set).sort().join(',');
}

/** Compact signature for long text (optional use). */
export function textSignature(s?: string, maxTokens = 40): string | '' {
  const clean = normText(s).replace(/[^\w\s]/g, '');
  if (!clean) return '';
  const tokens = clean.split(/\s+/).slice(0, maxTokens).sort().join(' ');
  return fnv1a32(tokens).slice(0, 6);
}