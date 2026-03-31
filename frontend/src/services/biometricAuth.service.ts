import AsyncStorage from '@react-native-async-storage/async-storage';
import ReactNativeBiometrics from 'react-native-biometrics';
import * as Keychain from 'react-native-keychain';

const SESSION_KEY = 'mygate_biometric_session';

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
  },

  async clearSession(): Promise<void> {
    await removeSecureValue(SESSION_KEY);
  },

  async hasSessionFlag(): Promise<boolean> {
    const value = await getSecureValue(SESSION_KEY);
    return value === '1';
  },

  async canUseBiometricOrDeviceCredential(): Promise<{ available: boolean; reason?: string }> {
    const rnBiometrics = new ReactNativeBiometrics();
    const { available: hasHardware } = await rnBiometrics.isSensorAvailable();
    if (!hasHardware) return { available: false, reason: 'Biometric hardware not available' };
    return { available: true };
  },

  async authenticate(): Promise<{
    success: boolean;
    error?: string;
  }> {
    const available = await this.canUseBiometricOrDeviceCredential();
    if (!available.available) {
      return { success: false, error: available.reason };
    }

    const rnBiometrics = new ReactNativeBiometrics();
    const result = await rnBiometrics.simplePrompt({
      promptMessage: 'Authenticate to continue',
      cancelButtonText: 'Cancel',
    });
    if (result.success) return { success: true };
    return { success: false, error: 'Authentication failed' };
  },
};

