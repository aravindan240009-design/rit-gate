import { Platform } from 'react-native';
import { downloadWithNotification, saveBase64WithNotification } from './downloadNotification.service';

class NotificationService {
  private listeners: Array<(notification: any) => void> = [];

  subscribe(callback: (notification: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  notify(notification: any) {
    this.listeners.forEach(listener => listener(notification));
  }

  async requestPermissions() {
    return true;
  }

  /**
   * Download a file from a URL — shows a real Android system notification
   * with progress bar (like WhatsApp downloads).
   */
  async downloadFile(url: string, filename: string, mimeType?: string) {
    console.log(`📥 Starting download: ${filename}`);
    const result = await downloadWithNotification({ url, filename, mimeType, title: filename, description: 'Downloading…' });
    if (result.success) {
      console.log(`✅ Download complete: ${result.filePath}`);
    } else {
      console.warn(`❌ Download failed: ${result.message}`);
    }
    return result;
  }

  /**
   * Save a base64 string as a file to the Downloads folder.
   */
  async saveBase64File(base64Data: string, filename: string, mimeType?: string) {
    return saveBase64WithNotification(base64Data, filename, mimeType);
  }

  // Legacy helpers kept for backward compatibility
  notifyDownloadStarted(filename: string) {
    console.log(`📥 Download started: ${filename}`);
  }

  notifyDownloadSuccess(filename: string) {
    console.log(`✅ Download complete: ${filename}`);
  }
}

export const notificationService = new NotificationService();
