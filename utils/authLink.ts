// utils/authLink.ts

/**
 * Light check whether a URL looks like a Supabase auth link we should forward.
 * Uses pure string test with regex - no URL parsing that could throw on custom schemes.
 */
export const isAuthLink = (raw?: string | null): boolean => {
  if (!raw || typeof raw !== 'string') return false;
  // Pure regex test; safer than multiple .includes() calls
  return /(type=recovery|code=|access_token=|refresh_token=)/.test(raw);
};

/**
 * Parse auth params from either query (?code=...) and/or hash (#access_token=...).
 * Works for both web URLs and deep links without using new URL() which can fail on custom schemes.
 */
export const parseTokensFromUrl = (raw?: string | null) => {
  if (!raw || typeof raw !== 'string') {
    return { code: null, access_token: null, refresh_token: null };
  }

  try {
    const qIdx = raw.indexOf('?');
    const hIdx = raw.indexOf('#');
    const qs =
      qIdx >= 0 ? raw.slice(qIdx + 1, hIdx >= 0 ? hIdx : undefined) : '';
    const hs = hIdx >= 0 ? raw.slice(hIdx + 1) : '';

    const q = new URLSearchParams(qs);
    const h = new URLSearchParams(hs);

    const code = q.get('code') || h.get('code');
    const access_token = h.get('access_token') || q.get('access_token');
    const refresh_token = h.get('refresh_token') || q.get('refresh_token');

    return { code, access_token, refresh_token };
  } catch {
    return { code: null, access_token: null, refresh_token: null };
  }
};

/**
 * On web: remove auth params from the address bar so refreshes don't re-process.
 * Keeps you on the same path but strips ?query and #hash.
 */
export const stripAuthParamsFromWebLocation = () => {
  if (typeof window === 'undefined') return;
  try {
    const clean = `${window.location.origin}${window.location.pathname}`;
    window.history.replaceState({}, document.title, clean);
  } catch {
    // Silent fail - not critical
  }
};
