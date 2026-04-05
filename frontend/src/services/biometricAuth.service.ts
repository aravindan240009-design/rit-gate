import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const SESSION_KEY = 'mygate_biometric_session';
const PIN_AUTH_SERVICE = 'mygate_pin_auth';

async function setSecureValue(key: string, value: string): Promise<void> {
  try {
    await Keychain.setGenericPassword(key, value, { service: key });
  } catch {
    await AsyncStorage.setItem(key, value);
  }
}

async function getSecureValue(key: string): Promise<string | null> {
  try {
    const secure = await Keychain.getGenericPassword({ service: key });
    if (secure && typeof secure.password === 'string') return secure.password;
  } catch {
  }
  return AsyncStorage.getItem(key);
}

async function removeSecureValue(key: string): Promise<void> {
  try {
    await Keychain.resetGenericPassword({ service: key });
  } catch {
  }
  await AsyncStorage.removeItem(key);
}

export const biometricAuthService = {
  async markSessionActive(): Promise<void> {
    await setSecureValue(SESSION_KEY, '1');
    // Pre-store a PIN-protected value so the PIN prompt can retrieve it later
    try {
      await Keychain.setGenericPassword('pin_auth', 'verified', {
        service: PIN_AUTH_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
        accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
      });
    } catch {
      // Ignore — device may not support it
    }
  },

  async clearSession(): Promise<void> {
    await removeSecureValue(SESSION_KEY);
    try { await Keychain.resetGenericPassword({ service: PIN_AUTH_SERVICE }); } catch {}
  },

  async hasSessionFlag(): Promise<boolean> {
    const value = await getSecureValue(SESSION_KEY);
    return value === '1';
  },

  /** Biometric only (fingerprint/face) */
  async authenticateBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      const rnBiometrics = new ReactNativeBiometrics({ allowDeviceCredentials: false });
      const result = await rnBiometrics.simplePrompt({
        promptMessage: 'Use fingerprint to authenticate',
        cancelButtonText: 'Cancel',
        allowDeviceCredentials: false,
      });
      if (result.success) return { success: true };
      return { success: false, error: 'Biometric authentication failed' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Biometric authentication failed' };
    }
  },

  /**
   * Device credential only (PIN / pattern / password) — no biometric.
   * Uses Keychain with ACCESS_CONTROL.DEVICE_PASSCODE which forces the
   * system PIN/pattern/password dialog, bypassing fingerprint entirely.
   */
  async authenticateDeviceCredential(): Promise<{ success: boolean; error?: string }> {
    try {
      // Ensure the PIN-protected entry exists — write it if missing
      const existing = await Keychain.getGenericPassword({ service: PIN_AUTH_SERVICE }).catch(() => null);
      if (!existing) {
        await Keychain.setGenericPassword('pin_auth', 'verified', {
          service: PIN_AUTH_SERVICE,
          accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
          accessible: Keychain.ACCESSIBLE.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
        });
      }

      const result = await Keychain.getGenericPassword({
        service: PIN_AUTH_SERVICE,
        accessControl: Keychain.ACCESS_CONTROL.DEVICE_PASSCODE,
        authenticationPrompt: {
          title: 'Verify your identity',
          description: 'Enter your PIN, pattern or password',
          cancel: 'Cancel',
        },
      });
      if (result && (result as any).password === 'verified') {
        return { success: true };
      }
      return { success: false, error: 'Authentication failed' };
    } catch (e: any) {
      return { success: false, error: e?.message || 'Authentication failed' };
    }
  },

  /** Legacy */
  async authenticate(): Promise<{ success: boolean; error?: string }> {
    return this.authenticateDeviceCredential();
  },
};

