// utils/authLink.ts

/**
 * Parse auth params from either query (?code=...) and/or hash (#access_token=...).
 * Works for:
 *  - Web URLs:  https://domain/path?code=...#access_token=...
 *  - Deep links: smartbites://reset-password?code=...#access_token=...
 * Doesn’t rely on `new URL()` (which needs a base for custom schemes).
 */
export function parseTokensFromUrl(rawUrl: string | null): {
  code: string | null;
  access_token: string | null;
  refresh_token: string | null;
  token?: string | null; // recovery-style token, if ever needed
  type?: string | null; // e.g., "recovery"
} {
  if (!rawUrl) {
    return {
      code: null,
      access_token: null,
      refresh_token: null,
      token: null,
      type: null,
    };
  }

  try {
    // Manually split because custom schemes may not parse via new URL()
    const qIndex = rawUrl.indexOf('?');
    const hIndex = rawUrl.indexOf('#');

    const queryStr =
      qIndex >= 0
        ? rawUrl.slice(qIndex + 1, hIndex >= 0 ? hIndex : undefined)
        : '';
    const hashStr = hIndex >= 0 ? rawUrl.slice(hIndex + 1) : '';

    const q = new URLSearchParams(queryStr);
    const h = new URLSearchParams(hashStr);

    // Pull from BOTH places; Supabase can put things in either.
    const code = q.get('code') || h.get('code');
    const access_token = h.get('access_token') || q.get('access_token');
    const refresh_token = h.get('refresh_token') || q.get('refresh_token');

    // Some templates (or older flows) may use token/type
    const token = q.get('token') || h.get('token');
    const type = q.get('type') || h.get('type');

    return { code, access_token, refresh_token, token, type };
  } catch {
    return {
      code: null,
      access_token: null,
      refresh_token: null,
      token: null,
      type: null,
    };
  }
}

/**
 * Light check whether a URL looks like a Supabase auth link we should forward.
 */
export function isAuthLink(url: string | null | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('type=recovery') ||
    url.includes('code=') ||
    url.includes('access_token=') ||
    url.includes('refresh_token=') ||
    url.includes('/auth/v1/verify') // common path in Supabase emails
  );
}

/**
 * On web: remove auth params from the address bar so refreshes don’t re-process.
 * Keeps you on the same path but strips ?query and #hash.
 */
export function stripAuthParamsFromWebLocation(): void {
  try {
    const clean = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, clean);
  } catch {
    // no-op
  }
}
