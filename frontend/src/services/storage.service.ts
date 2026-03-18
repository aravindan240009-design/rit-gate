import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../config/api.config';
import { User, UserRole } from '../types';

class StorageService {
  // Helper function to normalize boolean values
  private normalizeBoolean(value: any): boolean {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
    }
    if (typeof value === 'number') return value === 1;
    return false;
  }

  // Helper function to normalize user data (fix boolean fields)
  private normalizeUserData(user: any): any {
    if (!user) return user;
    
    // Create a copy to avoid mutating original
    const normalized = { ...user };
    
    // Normalize common boolean fields
    if ('isActive' in normalized) {
      normalized.isActive = this.normalizeBoolean(normalized.isActive);
    }
    if ('is_active' in normalized) {
      normalized.is_active = this.normalizeBoolean(normalized.is_active);
    }
    if ('enabled' in normalized) {
      normalized.enabled = this.normalizeBoolean(normalized.enabled);
    }
    
    return normalized;
  }

  // Save user data
  async saveUser(user: User, role: UserRole): Promise<void> {
    try {
      // Normalize before saving
      const normalizedUser = this.normalizeUserData(user);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(normalizedUser));
      await AsyncStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
      console.log('✅ User data saved to storage');
    } catch (error) {
      console.error('❌ Failed to save user data:', error);
      throw error;
    }
  }

  // Get user data
  async getUser(): Promise<{ user: User | null; role: UserRole | null }> {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      const userRole = await AsyncStorage.getItem(STORAGE_KEYS.USER_ROLE);

      if (userData && userRole) {
        const parsedUser = JSON.parse(userData);
        // Normalize the user data when retrieving from storage
        const normalizedUser = this.normalizeUserData(parsedUser);
        return {
          user: normalizedUser,
          role: userRole as UserRole,
        };
      }

      return { user: null, role: null };
    } catch (error) {
      console.error('❌ Failed to get user data:', error);
      return { user: null, role: null };
    }
  }

  // Clear user data (logout)
  async clearUser(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_DATA);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_ROLE);
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      console.log('✅ User data cleared from storage');
    } catch (error) {
      console.error('❌ Failed to clear user data:', error);
      throw error;
    }
  }

  // Save auth token
  async saveAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (error) {
      console.error('❌ Failed to save auth token:', error);
    }
  }

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch (error) {
      console.error('❌ Failed to get auth token:', error);
      return null;
    }
  }

  // Save backend URL
  async saveBackendUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BACKEND_URL, url);
    } catch (error) {
      console.error('❌ Failed to save backend URL:', error);
    }
  }

  // Get backend URL
  async getBackendUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.BACKEND_URL);
    } catch (error) {
      console.error('❌ Failed to get backend URL:', error);
      return null;
    }
  }
}

export const storageService = new StorageService();
