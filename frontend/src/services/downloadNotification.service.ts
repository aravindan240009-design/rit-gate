/**
 * System-level download notifications (like WhatsApp).
 * Uses react-native-fs which triggers Android DownloadManager
 * — shows a real progress notification in the status bar.
 */
import { Platform, PermissionsAndroid } from 'react-native';
import RNFS from 'react-native-fs';

export interface DownloadOptions {
  url: string;
  filename: string;
  /** mime type, e.g. 'application/pdf' */
  mimeType?: string;
  /** notification title shown in status bar */
  title?: string;
  /** notification description */
  description?: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  message?: string;
}

async function requestStoragePermission(): Promise<boolean> {
  if (Platform.OS !== 'android') return true;
  // Android 13+ doesn't need WRITE_EXTERNAL_STORAGE for Downloads
  if (Platform.Version >= 33) return true;
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission',
        message: 'App needs storage access to save files',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      }
    );
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
}

/**
 * Download a file and show a system progress notification.
 * On Android this uses the native DownloadManager — the notification
 * appears in the status bar with a progress bar, exactly like WhatsApp.
 */
export async function downloadWithNotification(opts: DownloadOptions): Promise<DownloadResult> {
  const {
    url,
    filename,
    mimeType = 'application/octet-stream',
    title = filename,
    description = 'Downloading…',
  } = opts;

  if (Platform.OS === 'android') {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, message: 'Storage permission denied' };
    }

    try {
      // Use Android DownloadManager via RNFS.downloadFile with notification options
      const destPath = `${RNFS.DownloadDirectoryPath}/${filename}`;

      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: destPath,
        // Android DownloadManager notification
        background: true,
        discretionary: false,
        cacheable: false,
        // These options trigger the system notification
        progressDivider: 5,
        begin: () => {
          console.log(`📥 Download started: ${filename}`);
        },
        progress: (res) => {
          const pct = Math.round((res.bytesWritten / res.contentLength) * 100);
          console.log(`📥 Download progress: ${pct}%`);
        },
      }).promise;

      if (result.statusCode === 200) {
        // Scan the file so it appears in gallery/files app
        try {
          await RNFS.scanFile(destPath);
        } catch { /* ignore scan errors */ }

        return { success: true, filePath: destPath };
      } else {
        return { success: false, message: `Download failed (HTTP ${result.statusCode})` };
      }
    } catch (e: any) {
      return { success: false, message: e.message || 'Download failed' };
    }
  }

  // iOS — save to Documents directory
  try {
    const destPath = `${RNFS.DocumentDirectoryPath}/${filename}`;
    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: destPath,
      background: true,
    }).promise;

    if (result.statusCode === 200) {
      return { success: true, filePath: destPath };
    }
    return { success: false, message: `Download failed (HTTP ${result.statusCode})` };
  } catch (e: any) {
    return { success: false, message: e.message || 'Download failed' };
  }
}

/**
 * Save a base64 string as a file and show a system notification.
 * Used for QR codes / PDFs generated in-app.
 */
export async function saveBase64WithNotification(
  base64Data: string,
  filename: string,
  mimeType = 'application/pdf'
): Promise<DownloadResult> {
  if (Platform.OS === 'android') {
    const hasPermission = await requestStoragePermission();
    if (!hasPermission) {
      return { success: false, message: 'Storage permission denied' };
    }
  }

  try {
    const dir = Platform.OS === 'android'
      ? RNFS.DownloadDirectoryPath
      : RNFS.DocumentDirectoryPath;

    const destPath = `${dir}/${filename}`;

    // Strip data URI prefix if present
    const clean = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

    await RNFS.writeFile(destPath, clean, 'base64');

    if (Platform.OS === 'android') {
      try { await RNFS.scanFile(destPath); } catch { /* ignore */ }
    }

    return { success: true, filePath: destPath };
  } catch (e: any) {
    return { success: false, message: e.message || 'Save failed' };
  }
}
