import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';
import { supabase } from '@/lib/supabase';

export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web - Use Supabase Edge Function proxy to avoid CORS
    const { data, error } = await supabase.functions.invoke('proxy-image', {
      body: { imageUrl: url }
    });
    
    if (error) {
      console.error('Error fetching image via proxy:', error);
      throw new Error(`Failed to fetch image: ${error.message}`);
    }
    
    // Convert the response to a Blob
    const response = await fetch(`data:image/png;base64,${data.imageData}`);
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