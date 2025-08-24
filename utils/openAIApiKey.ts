import { supabase } from '@/lib/supabase';

let cachedApiKey: string | null = null;

export async function getOpenAIKey(): Promise<string> {
  if (cachedApiKey) return cachedApiKey;

  const supabaseUrl =
    process.env.EXPO_PUBLIC_SUPABASE_URL ||
    // fallback if you prefer (may be "protected" in TS types, so env is cleaner)
    '';

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
