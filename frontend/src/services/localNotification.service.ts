/**
 * localNotification.service.ts
 *
 * Wraps @notifee/react-native to show real Android OS notifications.
 * Called by NotificationContext whenever new unread notifications arrive.
 */
import notifee, {
  AndroidImportance,
  AndroidVisibility,
  AndroidColor,
  EventType,
} from '@notifee/react-native';

const CHANNEL_ID = 'ritgate_main';
const CHANNEL_NAME = 'RIT Gate Notifications';

let channelCreated = false;

/** Create the notification channels once (Android 8+). */
export async function ensureChannel() {
  if (channelCreated) return;

  // Main visible channel — used by notifee to display real notifications
  try { await notifee.deleteChannel(CHANNEL_ID); } catch {}
  await notifee.createChannel({
    id: CHANNEL_ID,
    name: CHANNEL_NAME,
    importance: AndroidImportance.HIGH,
    visibility: AndroidVisibility.PUBLIC,
    sound: 'default',
    vibration: true,
    vibrationPattern: [300, 500],
    lights: true,
    lightColor: AndroidColor.RED,
    bypassDnd: false,
  });

  // Silent delivery channel — FCM notification block references this so the
  // system renders nothing visible; notifee background handler shows the real one.
  try { await notifee.deleteChannel('ritgate_silent'); } catch {}
  await notifee.createChannel({
    id: 'ritgate_silent',
    name: 'RIT Gate Silent Delivery',
    importance: AndroidImportance.NONE,   // no heads-up, no sound, no vibration
    visibility: AndroidVisibility.SECRET,  // hidden on lock screen
    sound: undefined,
    vibration: false,
    bypassDnd: false,
  });

  channelCreated = true;
}

/** Request POST_NOTIFICATIONS permission (Android 13+). */
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    const settings = await notifee.requestPermission();
    return settings.authorizationStatus >= 1; // AUTHORIZED or PROVISIONAL
  } catch {
    return false;
  }
}

/** Display a single OS notification. */
export async function showLocalNotification(
  id: string,
  title: string,
  body: string,
  data?: Record<string, string>
): Promise<void> {
  try {
    await ensureChannel();
    await notifee.displayNotification({
      id,
      title,
      body,
      data,
      android: {
        channelId: CHANNEL_ID,
        importance: AndroidImportance.HIGH,
        // Make notification heads-up and wake lock screen (device/OEM policy permitting)
        lightUpScreen: true,
        // Small icon (white monochrome vectordesign) shown in status bar and notification
        smallIcon: 'notification_icon',
        pressAction: { id: 'default' },
        showTimestamp: true,
        vibrationPattern: [300, 500],
        visibility: AndroidVisibility.PUBLIC,
      },
    });
  } catch (e) {
    console.warn('localNotification: failed to show notification', e);
  }
}

/** Cancel a specific notification by id. */
export async function cancelNotification(id: string): Promise<void> {
  try {
    await notifee.cancelNotification(id);
  } catch {}
}

/** Cancel all displayed notifications. */
export async function cancelAllNotifications(): Promise<void> {
  try {
    await notifee.cancelAllNotifications();
  } catch {}
}

/**
 * Register a handler for notification tap events.
 * Returns an unsubscribe function.
 */
export function onNotificationTap(
  handler: (data: Record<string, string>) => void
): () => void {
  const unsub = notifee.onForegroundEvent(({ type, detail }) => {
    if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
      const data = (detail.notification?.data || {}) as Record<string, string>;

      // Download notification — open the file
      if (data.type === 'download' && data.filePath) {
        openFile(data.filePath, data.mimeType || 'application/pdf');
        return;
      }

      // App notification — navigate (or just refresh if no specific route)
      handler(data);
    }
  });
  return unsub;
}

/** Open a file using Android's file viewer intent */
async function openFile(filePath: string, mimeType: string): Promise<void> {
  try {
    const { Linking } = require('react-native');
    // On Android, file:// URIs are blocked since Android 7 (FileUriExposedException).
    // Use the content:// URI from MediaStore after scanning, or open Downloads folder.
    if (require('react-native').Platform.OS === 'android') {
      try {
        // Try opening the Downloads folder directly — most reliable cross-device approach
        await Linking.openURL('content://com.android.externalstorage.documents/root/primary:Download');
      } catch {
        // Fallback: open the Downloads app
        try {
          await Linking.openURL('content://downloads/public_downloads');
        } catch {
          await Linking.openURL('https://play.google.com/store/apps/details?id=com.google.android.documentsui');
        }
      }
    } else {
      await Linking.openURL(`file://${filePath}`);
    }
  } catch (e) {
    console.warn('Could not open file:', e);
  }
}

/**
 * Handle notification that opened the app from background/quit state.
 */
export async function getInitialNotificationData(): Promise<Record<string, string> | null> {
  try {
    const initial = await notifee.getInitialNotification();
    if (initial?.notification?.data) {
      return initial.notification.data as Record<string, string>;
    }
  } catch {}
  return null;
}
