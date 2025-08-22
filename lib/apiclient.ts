import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web - Use axios to download blob directly from OpenAI presigned URL
    try {
      const response = await axios.get(url, { 
        responseType: 'blob',
        timeout: 15000,
        headers: {
          'Accept': 'image/*',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
      });
      return response.data;
    } catch (error) {
      console.error('❌ Web axios fetch failed:', error);
      throw new Error('Unable to fetch image');
    }
  } else {
    // ✅ Native - Use RNBlobUtil to download to local path
    try {
      const res = await RNBlobUtil.config({
        fileCache: true,
      }).fetch('GET', url, {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      });

      console.log('✅ Native file saved at:', res.path());
      return res.path();
    } catch (err: any) {
      console.error('❌ Native fetch failed:', err.message);
      throw err;
    }
  }
}