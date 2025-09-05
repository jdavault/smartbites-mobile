import { slugify, fnv1a32, normText, normList, textSignature } from './stringUtils';

export function buildSearchKey(opts: {
  allergens?: string[];
  dietaryPrefs?: string[];
  title: string;
  headNote?: string;
}): string {
  const baseParts = [
    `a:${normList(opts.allergens)}`,
    `d:${normList(opts.dietaryPrefs)}`,
    `t:${normText(opts.title)}`,
    opts.headNote ? `hn:${normText(opts.headNote)}` : '',
  ].filter(Boolean);

  const canonical = baseParts.join(' | ');
  const readable = slugify(canonical).slice(0, 120);
  const suffix = fnv1a32(canonical).slice(0, 8);

  return `${readable}-${suffix}`;
}