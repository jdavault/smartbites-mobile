// app/(auth)/open/reset.tsx
import { useEffect, useMemo } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';

const APP_URL = 'https://smartbites.food';

export default function ResetBridge() {
  const router = useRouter();
  const { token: rawToken, type: rawType } = useLocalSearchParams<{
    token?: string;
    type?: string;
  }>();

  const token = useMemo(() => (rawToken ?? '').toString(), [rawToken]);
  const type = useMemo(() => (rawType ?? 'recovery').toString(), [rawType]);

  useEffect(() => {
    // If there's no token, just go to the public reset screen
    if (!token) {
      router.replace({ pathname: '/(auth)/reset-password' });
      return;
    }

    // Build targets
    const schemeUrl = `smartbites://reset-password?token=${encodeURIComponent(
      token
    )}&type=${encodeURIComponent(type)}`;

    // ✅ Typesafe internal SPA fallback (no string concat)
    const spaFallback: Href = {
      pathname: '/(auth)/reset-password',
      params: { token, type },
    };

    // External web URL (ok to be a string)
    const webFallback = `${APP_URL}/reset-password?token=${encodeURIComponent(
      token
    )}&type=${encodeURIComponent(type)}`;

    if (Platform.OS === 'web') {
      // Try to open the app, then fall back to the public reset page
      try {
        window.location.href = schemeUrl;
        setTimeout(() => router.replace(spaFallback), 1200);
      } catch {
        router.replace(spaFallback);
      }
    } else {
      // If this route loads in native, just continue to reset screen
      router.replace(spaFallback);
    }
  }, [router, token, type]);

  return (
    <main
      style={{
        padding: 24,
        fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto',
      }}
    >
      <h1>Opening SmartBites…</h1>
      <p>
        If the app doesn’t open automatically, you’ll be routed to the reset
        page.
      </p>
      <noscript>
        JavaScript is required; please use the website link in your email.
      </noscript>
    </main>
  );
}
