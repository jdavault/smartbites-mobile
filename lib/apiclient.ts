import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';
import { supabase } from '@/lib/supabase';

export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web - Use Supabase Edge Function proxy to avoid CORS
    const response = await fetch(`${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/proxy-image?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.EXPO_PUBLIC_SUPABASE_KEY}`,
      },
    });
    
    if (!response.ok) {
      throw new Error(`Failed to fetch image via proxy: ${response.statusText}`);
    }
    
    return await response.blob();
  } else {
    try {
      const safeName = 'image_' + Date.now() + '.png';
      const path = `${RNBlobUtil.fs.dirs.CacheDir}/${safeName}`;
      console.log('[✅ fetchImageBlob1() - File saved at:', path);

      const res = await RNBlobUtil.config({
        fileCache: true,
        path,
      }).fetch('GET', url, {
        Accept: 'image/png',
      });

      console.log('[✅ fetchImageBlob2() - File saved at:', res.path());
      return res.path();
    } catch (err: any) {
      console.error('[❌ fetchImageBlob Android] Error:', err.message);
      throw err;
    }
  }
}