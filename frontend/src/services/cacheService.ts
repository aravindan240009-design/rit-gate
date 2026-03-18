import AsyncStorage from '@react-native-async-storage/async-storage';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresIn: number;
}

class CacheService {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  // Memory cache (instant access)
  setMemory<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
    this.memoryCache.set(key, {
      data,
      timestamp: Date.now(),
      expiresIn: ttl,
    });
  }

  getMemory<T>(key: string): T | null {
    const entry = this.memoryCache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.expiresIn;
    if (isExpired) {
      this.memoryCache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  // Persistent cache (AsyncStorage)
  async setPersistent<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): Promise<void> {
    try {
      const entry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
        expiresIn: ttl,
      };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
      // Also set in memory for instant access
      this.setMemory(key, data, ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  async getPersistent<T>(key: string): Promise<T | null> {
    try {
      // Check memory first (instant)
      const memoryData = this.getMemory<T>(key);
      if (memoryData) return memoryData;

      // Check persistent storage
      const cached = await AsyncStorage.getItem(key);
      if (!cached) return null;

      const entry: CacheEntry<T> = JSON.parse(cached);
      const isExpired = Date.now() - entry.timestamp > entry.expiresIn;

      if (isExpired) {
        await AsyncStorage.removeItem(key);
        return null;
      }

      // Store in memory for next access
      this.setMemory(key, entry.data, entry.expiresIn);
      return entry.data;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Clear specific cache
  async clear(key: string): Promise<void> {
    this.memoryCache.delete(key);
    await AsyncStorage.removeItem(key);
  }

  // Clear all cache
  async clearAll(): Promise<void> {
    this.memoryCache.clear();
    await AsyncStorage.clear();
  }

  // Invalidate cache by pattern
  async invalidatePattern(pattern: string): Promise<void> {
    // Clear memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear persistent cache
    const keys = await (AsyncStorage as any).getAllKeys();
    const matchingKeys = keys.filter((key: string) => key.includes(pattern));
    await AsyncStorage.multiRemove(matchingKeys as string[]);
  }
}

export const cacheService = new CacheService();
