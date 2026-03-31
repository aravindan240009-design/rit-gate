import { Platform } from 'react-native';
import { API_CONFIG } from '../config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const PUSH_TOKEN_KEY = '@mygate_push_token';
export async function registerForPushNotifications(): Promise<string | null> {
  return null;
}

export async function initPushNotifications(userId: string, userType: string): Promise<void> {
  try {
    const token = await registerForPushNotifications();
    if (!token) return;

    // Skip if already registered for this user+token combo
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (stored === `${userId}:${token}`) return;

    await savePushTokenToBackend(userId, token);
    await AsyncStorage.setItem(PUSH_TOKEN_KEY, `${userId}:${token}`);
  } catch (error) {
    console.warn('⚠️ Push init failed:', error);
  }
}

export async function savePushTokenToBackend(userId: string, token: string): Promise<void> {
  try {
    const deviceType = Platform.OS === 'ios' ? 'IOS' : 'ANDROID';
    const res = await fetch(`${API_CONFIG.BASE_URL}/notifications/push-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, pushToken: token, deviceType }),
    });
    const data = await res.json();
    if (data.success) console.log('✅ Push token registered with backend');
  } catch (error) {
    console.warn('⚠️ Failed to save push token to backend:', error);
  }
}

export async function unregisterPushToken(): Promise<void> {
  try {
    const stored = await AsyncStorage.getItem(PUSH_TOKEN_KEY);
    if (!stored) return;
    const pushToken = stored.substring(stored.indexOf(':') + 1);

    await fetch(`${API_CONFIG.BASE_URL}/notifications/push-token`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pushToken }),
    });

    await AsyncStorage.removeItem(PUSH_TOKEN_KEY);
    console.log('✅ Push token unregistered');
  } catch (error) {
    console.warn('⚠️ Failed to unregister push token:', error);
  }
}

export function setupNotificationTapHandler(
  onNavigate: (route: string) => void
): () => void {
  return () => {};
}

export async function handleInitialNotification(
  onNavigate: (route: string) => void
): Promise<void> {
  return;
}
