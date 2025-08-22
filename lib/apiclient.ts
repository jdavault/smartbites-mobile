import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';
export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web - Use axios to download blob directly
    // Try direct fetch first, fallback to axios if CORS issues
    try {
      const response = await fetch(url, {
        mode: 'cors',
        headers: {
          'Accept': 'image/*',
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.blob();
    } catch (error) {
      // Fallback to axios with responseType blob
      try {
        const response = await axios.get(url, { 
          responseType: 'blob',
          timeout: 10000,
        });
        return response.data;
      } catch (axiosError) {
        console.warn('Both fetch and axios failed, image will use fallback URL');
        throw new Error('Unable to fetch image');
      }
    }

      console.log('[✅ fetchImageBlob2() - File saved at:', res.path());
      return res.path();
    } catch (err: any) {
      console.error('[❌ fetchImageBlob Android] Error:', err.message);
      throw err;
    }
  }
}