// app/open/reset.tsx
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { useRouter, useLocalSearchParams, type Href } from 'expo-router';
import { APP_URL } from '@/config/constants';

export default function ResetBridge() {
  const router = useRouter();
  const { redirect: rawRedirect } = useLocalSearchParams<{
    redirect?: string;
  }>();

  useEffect(() => {
    if (!rawRedirect) {
      // No redirect provided → just push user to reset-password screen
      router.replace({ pathname: '/(auth)/reset-password' });
      return;
    }

    const redirectUrl = decodeURIComponent(rawRedirect.toString());

    // Deep-link version of the Supabase ConfirmationURL
    // const schemeUrl = redirectUrl.replace(
    //   /^https:\/\/[^/]+\/auth\/v1\/verify/,
    //   'smartbites://reset-password'
    // );

    // app/open/reset.tsx (updated)
    const schemeUrl = redirectUrl
      .replace(
        /^https:\/\/[^/]+\/auth\/v1\/verify/,
        'smartbites://reset-password'
      )
      .replace(
        'redirect_to=https%3A%2F%2Fsmartbites.food%2Freset-password',
        'redirect_to=smartbites%3A%2F%2Freset-password'
      );
    // Internal SPA fallback route
    const spaFallback: Href = {
      pathname: '/(auth)/reset-password',
      params: { redirect: redirectUrl },
    };

    if (Platform.OS === 'web') {
      try {
        // Try to launch the native app first
        window.location.href = schemeUrl;

        // After delay, fall back into the SPA
        setTimeout(() => router.replace(spaFallback), 1500);
      } catch {
        router.replace(spaFallback);
      }
    } else {
      // Native app → go straight to reset-password route with redirect URL
      router.replace(spaFallback);
    }
  }, [router, rawRedirect]);

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
