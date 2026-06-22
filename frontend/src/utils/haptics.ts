/**
 * Lightweight haptic feedback using React Native's built-in Vibration API.
 * No native dependency — works in the existing build.
 *
 * Patterns are tuned to feel like the standard light/success/error taps:
 *  - light:   a single short tick for taps / selections
 *  - success: two quick pulses (e.g. pass approved, QR scanned OK)
 *  - error:   one longer buzz (e.g. invalid OTP, scan rejected)
 */
import { Vibration, Platform } from 'react-native';

// Android honours vibration patterns; iOS Vibration is a fixed ~400ms buzz,
// so we keep iOS to a single short call to avoid an overlong vibration.
const isAndroid = Platform.OS === 'android';

export const hapticLight = (): void => {
  try {
    Vibration.vibrate(isAndroid ? 12 : 1);
  } catch {}
};

export const hapticSuccess = (): void => {
  try {
    Vibration.vibrate(isAndroid ? [0, 20, 60, 20] : 1);
  } catch {}
};

export const hapticError = (): void => {
  try {
    Vibration.vibrate(isAndroid ? [0, 40, 50, 40] : 1);
  } catch {}
};

export default { hapticLight, hapticSuccess, hapticError };
