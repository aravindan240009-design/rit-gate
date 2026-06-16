/**
 * Launch-time app version gate.
 *
 * Fetches the backend's required/latest versionCode and compares it to this APK's
 * native versionCode. If the app is below the minimum, the caller hard-blocks with
 * ForceUpdateScreen. Below latest → a soft (dismissible) "update available" prompt.
 *
 * Fail-open: any network/parse error returns "ok" so a cold-starting or unreachable
 * backend never bricks the app on launch.
 */
import DeviceInfo from 'react-native-device-info';
import { API_CONFIG } from '../config/api.config';

export interface VersionGate {
  blocked: boolean;       // hard block — must update to continue
  updateAvailable: boolean; // soft — newer version exists, dismissible
  updateUrl: string;
  message: string;
}

const DEFAULT_URL = 'market://details?id=com.mygate.app';

const currentVersionCode = (): number => {
  const n = Number(DeviceInfo.getBuildNumber());
  return Number.isFinite(n) ? n : 0;
};

export const checkVersion = async (): Promise<VersionGate> => {
  const ok: VersionGate = { blocked: false, updateAvailable: false, updateUrl: DEFAULT_URL, message: '' };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(`${API_CONFIG.BASE_URL}/app/version`, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) return ok;
    const data = await res.json();

    const min = Number(data.minVersionCode) || 0;
    const latest = Number(data.latestVersionCode) || 0;
    const current = currentVersionCode();
    const updateUrl = data.updateUrl || DEFAULT_URL;
    const message = data.message || 'A new version is available.';

    if (current > 0 && current < min) {
      return { blocked: true, updateAvailable: true, updateUrl, message };
    }
    if (current > 0 && current < latest) {
      return { blocked: false, updateAvailable: true, updateUrl, message };
    }
    return { ...ok, updateUrl };
  } catch {
    // Fail-open — never block launch because the check itself failed.
    return ok;
  }
};

export default { checkVersion };
