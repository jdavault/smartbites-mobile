import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

export async function fetchImageBlob(url: string): Promise<Blob | string> {
  if (Platform.OS === 'web') {
    // ✅ Web
    const response = await axios.get(url, { responseType: 'blob' });
    return response.data; // native Blob
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