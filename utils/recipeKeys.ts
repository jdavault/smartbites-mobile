import { slugify, fnv1a32, normText, normList, textSignature } from './stringUtils';

export function buildSearchKey(opts: {
  searchQuery: string;
  userAllergens?: string[];
  userDietaryPrefs?: string[];
  title: string;
  headNote?: string;
  description?: string;
}): string {
  const baseParts = [
    `q:${normText(opts.searchQuery)}`,
    `ua:${normList(opts.userAllergens)}`,
    `ud:${normList(opts.userDietaryPrefs)}`,
    `t:${normText(opts.title)}`,
    opts.headNote ? `hn:${normText(opts.headNote)}` : '',
  ].filter(Boolean);

  const dSig = textSignature(opts.description);
  if (dSig) baseParts.push(`d:${dSig}`);

  const canonical = baseParts.join(' | ');
  const readable = slugify(canonical).slice(0, 120);
  const suffix = fnv1a32(canonical).slice(0, 8);

  return `${readable}-${suffix}`;
}