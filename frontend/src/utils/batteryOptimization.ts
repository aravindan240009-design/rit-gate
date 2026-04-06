/**
 * Requests battery optimization exemption on Android.
 * This allows FCM push notifications to arrive even when the app is killed.
 * On OnePlus/OPPO/Xiaomi devices this is required for background notifications.
 */
import { Platform, NativeModules, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const ASKED_KEY = '@battery_opt_asked';

export async function requestBatteryOptimizationExemption(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    // Only ask once
    const asked = await AsyncStorage.getItem(ASKED_KEY);
    if (asked) return;

    await AsyncStorage.setItem(ASKED_KEY, '1');

    // Open battery optimization settings directly
    // ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS opens the system dialog
    await Linking.sendIntent('android.settings.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS', [
      { key: 'android.provider.extra.APP_PACKAGE', value: 'com.mygate.app' },
    ]);
  } catch {
    // Fallback: open battery settings page
    try {
      await Linking.openSettings();
    } catch {
      // ignore
    }
  }
}
