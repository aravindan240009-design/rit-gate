import { Alert, Vibration, Platform } from 'react-native';

class NotificationService {
  private listeners: Array<(notification: any) => void> = [];

  subscribe(callback: (notification: any) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  notify(notification: any) {
    this.listeners.forEach(listener => listener(notification));
  }

  async requestPermissions() {
    // For now, we use standard Alert which doesn't need permissions, 
    // but this is a placeholder for native notification permissions.
    return true;
  }

  async scheduleNotification(title: string, body: string, data?: any) {
    // Since we are in a restricted environment without a native notification library,
    // we use Alert.alert with Vibration to simulate a device notification experience.
    // In a real environment, this would call Notifee or Expo Notifications.
    
    console.log('Device Notification scheduled:', title, body, data);
    
    if (Platform.OS !== 'web') {
      Vibration.vibrate([0, 100, 50, 100]); // "Ding-ding" pattern
    }

    Alert.alert(
      title,
      body,
      [{ text: 'OK', style: 'default' }],
      { cancelable: true }
    );

    // Also notify internal listeners for UI updates
    this.notify({ title, message: body, timestamp: new Date().toISOString(), ...data });
  }

  notifyDownloadStarted(filename: string) {
    this.scheduleNotification(
      'Download Started',
      `Your report "${filename}" is being generated and will be saved shortly.`
    );
  }

  notifyDownloadSuccess(filename: string) {
    this.scheduleNotification(
      'Download Complete',
      `The report "${filename}" has been successfully saved to your Downloads folder.`
    );
  }
}

export const notificationService = new NotificationService();
