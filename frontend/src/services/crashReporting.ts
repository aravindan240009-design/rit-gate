/**
 * Crash reporting via Firebase Crashlytics.
 *
 * Firebase is already integrated for FCM, so this reuses the same setup. Every call
 * is guarded so the app never breaks if the native module is unavailable (e.g. in a
 * dev/Expo client where Crashlytics isn't linked).
 */
import crashlytics from '@react-native-firebase/crashlytics';

const safe = <T,>(fn: () => T): T | undefined => {
  try {
    return fn();
  } catch (e) {
    if (__DEV__) console.warn('crashReporting noop:', e);
    return undefined;
  }
};

/** Report a non-fatal error with optional context (e.g. component stack). */
export const recordError = (error: unknown, context?: string) => {
  safe(() => {
    if (context) crashlytics().log(context);
    const err = error instanceof Error ? error : new Error(String(error));
    crashlytics().recordError(err);
  });
};

/** Breadcrumb log attached to the next crash report. */
export const log = (message: string) => {
  safe(() => crashlytics().log(message));
};

/** Attribute subsequent crashes to a user (e.g. "STUDENT:12345"). */
export const setUserId = (id: string) => {
  safe(() => crashlytics().setUserId(id));
};

export default { recordError, log, setUserId };
