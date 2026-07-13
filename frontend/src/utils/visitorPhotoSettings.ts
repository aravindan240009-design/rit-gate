import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_PREFIX = '@ritgate_visitor_photo_capture_';

/** Per-security-guard toggle: whether to open the camera after a visitor entry scan. */
export async function getVisitorPhotoCaptureEnabled(securityId: string): Promise<boolean> {
  try {
    const v = await AsyncStorage.getItem(KEY_PREFIX + securityId);
    // Default ON — the guard can turn it off from the scanner screen.
    return v === null ? true : v === '1';
  } catch {
    return true;
  }
}

export async function setVisitorPhotoCaptureEnabled(securityId: string, enabled: boolean): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY_PREFIX + securityId, enabled ? '1' : '0');
  } catch {}
}
