/**
 * Holds the JWT issued by the backend on login. Every API request attaches it as
 * `Authorization: Bearer <token>`. Persisted in AsyncStorage so the session survives
 * app restarts, with an in-memory cache for synchronous access inside makeRequest.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@mygate_auth_token';

let cachedToken: string | null = null;

/** Load the persisted token into the in-memory cache (call once at app start). */
export const loadToken = async (): Promise<string | null> => {
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    cachedToken = null;
  }
  return cachedToken;
};

/** Synchronous read for request headers. */
export const getToken = (): string | null => cachedToken;

export const setToken = async (token: string | null): Promise<void> => {
  cachedToken = token || null;
  try {
    if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch {
    // best-effort; cache still holds the value for this session
  }
};

export const clearToken = async (): Promise<void> => setToken(null);

export default { loadToken, getToken, setToken, clearToken };
