// Low-level OpenAI API utilities
// Simple implementation that works everywhere via edge function

import { supabase } from '@/lib/supabase';

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};
const DEFAULT_MODEL = 'gpt-4o-mini-2024-07-18';
const DEFAULT_TIMEOUT_MS = 60_000;
// OpenAI organization and project IDs
const OPENAI_ORG_ID = 'org-pigNWK6KQYXhW9KadKfDpVGu';
const OPENAI_PROJECT = 'proj_WQLJGYZRj2GPZSmGchawQ5Bu';

// Cache for the API key to avoid multiple requests
let cachedApiKey: string | null = null;

/**
 * Get OpenAI API key from edge function
 */
export async function getOpenAIKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  if (!supabaseUrl) throw new Error('EXPO_PUBLIC_SUPABASE_URL is required');

  const edgeUrl = `${supabaseUrl}/functions/v1/getOpenAIKey`;

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const resp = await fetch(edgeUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(session?.access_token && {
        Authorization: `Bearer ${session.access_token}`,
      }),
    },
    body: JSON.stringify({}),
  });

  if (!resp.ok) {
    let msg = `Failed to get API key: ${resp.status}`;
    try {
      const j = await resp.json();
      if (j?.error) msg = j.error;
    } catch {}
    throw new Error(msg);
  }

  const data = await resp.json();
  cachedApiKey = data.apiKey;
  if (!cachedApiKey) throw new Error('No API key returned from edge function');

  return cachedApiKey;
}

/**
 * Clear cached API key (useful for testing)
 */
export function clearCachedApiKey(): void {
  cachedApiKey = null;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch with retry logic for 429, 5xx, and 408 errors
 */
async function fetchWithRetry(
  url: string,
  init: RequestInit,
  tries = 5
): Promise<Response> {
  let lastErr: unknown;

  for (let attempt = 1; attempt <= tries; attempt++) {
    let res: Response | null = null;
    try {
      res = await fetch(url, init);
    } catch (err) {
      lastErr = err;
    }

    if (res && res.ok) return res;

    // Decide whether to retry
    const status = res?.status ?? 0;
    const isAbortError =
      lastErr instanceof DOMException && lastErr.name === 'AbortError';
    const shouldRetry =
      status === 429 ||
      (status >= 500 && status < 600) ||
      status === 408 ||
      isAbortError;

    // Non-retryable OR out of attempts
    if (!shouldRetry || attempt === tries) {
      if (res) {
        const text = await res.text().catch(() => '');
        throw new Error(
          `OpenAI API error ${status}: ${text || res.statusText}`
        );
      }
      throw lastErr instanceof Error ? lastErr : new Error('Network error');
    }

    // Backoff (use Retry-After when present)
    const retryAfter = res?.headers.get('retry-after');
    let retryMs: number;

    if (retryAfter) {
      retryMs = Number(retryAfter) * 1000;
    } else {
      if (attempt <= 2) {
        retryMs = 1000 * attempt; // 1s, 2s
      } else {
        retryMs = (1200 + Math.random() * 400) * Math.pow(2, attempt - 3);
      }
    }
    console.warn(
      `⚠️ Retry ${attempt}/${tries} after ${retryMs}ms (status ${status}${
        isAbortError ? ', AbortError' : ''
      })`
    );
    await sleep(retryMs);
  }

  throw new Error('Retries exhausted');
}

/**
 * Get OpenAI headers with API key and org/project
 */
export async function getOpenAIHeaders(): Promise<Record<string, string>> {
  const apiKey = await getOpenAIKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  };
  if (OPENAI_ORG_ID) headers['OpenAI-Organization'] = OPENAI_ORG_ID;
  if (OPENAI_PROJECT) headers['OpenAI-Project'] = OPENAI_PROJECT;
  return headers;
}

/**
 * Call OpenAI chat completions API
 */
export async function callOpenAI(
  messages: ChatMessage[],
  options: any = {},
  { timeoutMs = DEFAULT_TIMEOUT_MS }: { timeoutMs?: number } = {}
): Promise<any> {
  const headers = await getOpenAIHeaders();

  const body = {
    model: DEFAULT_MODEL,
    temperature: 0.3,
    max_tokens: 2000,
    messages,
    ...options,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetchWithRetry(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
        signal: controller.signal,
      },
      4 // attempts
    );
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Generate image using DALL-E
 */
export async function generateImage(opts: {
  prompt: string;
  size?: '512x512' | '1024x1024' | '2048x2048';
  quality?: 'standard' | 'hd';
  responseFormat?: 'url' | 'b64_json';
}): Promise<{ url?: string; b64_json?: string }> {
  const {
    prompt,
    size = '1024x1024',
    quality = 'standard',
    responseFormat = 'url',
  } = opts;

  const headers = await getOpenAIHeaders();

  const res = await fetchWithRetry(
    'https://api.openai.com/v1/images/generations',
    {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        size,
        quality,
        response_format: responseFormat,
      }),
    },
    3 // attempts for image generation
  );

  if (!res.ok) {
    throw new Error(`OpenAI image generation error: ${res.status}`);
  }

  const json = await res.json();
  const data = json?.data?.[0];

  if (!data) {
    throw new Error('OpenAI returned no image data');
  }

  return {
    url: data.url,
    b64_json: data.b64_json,
  };
}