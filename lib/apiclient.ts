// fetchImageUploadable.ts
import { Platform } from 'react-native';
import axios from 'axios';
import RNBlobUtil from 'react-native-blob-util';

export type UploadableImage =
  | Blob
  | { uri: string; name: string; type: string };

export async function fetchImageUploadable(
  url: string,
  fileName?: string, // optional, we'll generate if not provided
  mime: string = 'image/png'
): Promise<UploadableImage> {
  if (Platform.OS === 'web') {
    // Web: return a real Blob
    const res = await axios.get(url, { responseType: 'blob' });
    // Ensure content-type (some servers omit it)
    const type = res.data.type || mime;
    return res.data.slice(0, res.data.size, type);
  }

  // React Native: download to cache and return a File-like object { uri, name, type }
  const safeName = fileName || `image_${Date.now()}.png`;

  const resp = await RNBlobUtil.config({
    fileCache: true,
    appendExt: mime.split('/')[1] || 'png',
  }).fetch('GET', url, { Accept: mime });

  // RNBlobUtil gives a filesystem path; most uploaders require the file:// prefix
  const rawPath = resp.path();
  const uri = rawPath.startsWith('file://') ? rawPath : `file://${rawPath}`;

  return { uri, name: safeName, type: mime };
}
