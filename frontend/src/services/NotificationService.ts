import { Platform, Linking } from 'react-native';
import RNFS from 'react-native-fs';
import notifee, { AndroidImportance, AndroidVisibility, AndroidColor } from '@notifee/react-native';

const DOWNLOAD_CHANNEL_ID = 'ritgate_downloads';
let downloadChannelCreated = false;

async function ensureDownloadChannel() {
  if (downloadChannelCreated) return;
  await notifee.createChannel({
    id: DOWNLOAD_CHANNEL_ID,
    name: 'Downloads',
    importance: AndroidImportance.LOW, // LOW so it doesn't make sound on progress updates
    visibility: AndroidVisibility.PUBLIC,
    vibration: false,
  });
  downloadChannelCreated = true;
}

/**
 * NotificationService — handles file download with progress bar notification.
 * Shows a real Android download-style notification with progress bar.
 * Tapping the completed notification opens the file.
 */
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

  /** Download a file with a progress bar notification. Tapping opens the file. */
  async downloadFile(url: string, filename: string, mimeType?: string): Promise<{ success: boolean; filePath?: string; message?: string }> {
    await ensureDownloadChannel();

    const notifId = `dl-${Date.now()}`;
    const dir = Platform.OS === 'android' ? RNFS.DownloadDirectoryPath : RNFS.DocumentDirectoryPath;
    const destPath = `${dir}/${filename}`;

    // Show indeterminate progress notification
    await notifee.displayNotification({
      id: notifId,
      title: 'Downloading…',
      body: filename,
      android: {
        channelId: DOWNLOAD_CHANNEL_ID,
        smallIcon: 'notification_icon',
        ongoing: true,          // can't be dismissed while downloading
        onlyAlertOnce: true,
        progress: { max: 100, current: 0, indeterminate: true },
        pressAction: { id: 'default' },
      },
    });

    try {
      let lastProgress = 0;

      const result = await RNFS.downloadFile({
        fromUrl: url,
        toFile: destPath,
        background: true,
        discretionary: false,
        progress: async (res) => {
          const pct = Math.floor((res.bytesWritten / res.contentLength) * 100);
          if (pct !== lastProgress && pct % 5 === 0) { // update every 5%
            lastProgress = pct;
            await notifee.displayNotification({
              id: notifId,
              title: `Downloading… ${pct}%`,
              body: filename,
              android: {
                channelId: DOWNLOAD_CHANNEL_ID,
                smallIcon: 'notification_icon',
                ongoing: true,
                onlyAlertOnce: true,
                progress: { max: 100, current: pct, indeterminate: false },
                pressAction: { id: 'default' },
              },
            });
          }
        },
        progressDivider: 1,
      }).promise;

      if (result.statusCode === 200) {
        // Trigger media scan so file appears in Files app
        if (Platform.OS === 'android') {
          try { await RNFS.scanFile(destPath); } catch {}
        }

        // Replace progress notification with a tappable "complete" notification
        // that opens the file when tapped
        const fileMime = mimeType || getMimeType(filename);
        await notifee.displayNotification({
          id: notifId,
          title: 'Download Complete',
          body: `${filename} — tap to open`,
          data: { filePath: destPath, mimeType: fileMime, type: 'download' },
          android: {
            channelId: DOWNLOAD_CHANNEL_ID,
            smallIcon: 'notification_icon',
            importance: AndroidImportance.HIGH,
            ongoing: false,
            onlyAlertOnce: false,
            pressAction: { id: 'open-file', launchActivity: 'default' },
            actions: [
              {
                title: 'Open',
                pressAction: { id: 'open-file', launchActivity: 'default' },
              },
            ],
          },
        });

        console.log(`✅ Download complete: ${filename}`);
        return { success: true, filePath: destPath };
      } else {
        await notifee.cancelNotification(notifId);
        return { success: false, message: `HTTP ${result.statusCode}` };
      }
    } catch (e: any) {
      await notifee.cancelNotification(notifId);
      return { success: false, message: e.message };
    }
  }

  // Legacy methods kept for compatibility
  notifyDownloadStarted(_filename: string) {}
  async notifyDownloadSuccess(_filename: string, _filePath?: string) {}
}

function getMimeType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'application/pdf';
  if (ext === 'xlsx') return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  if (ext === 'csv') return 'text/csv';
  return 'application/octet-stream';
}

export const notificationService = new NotificationService();
