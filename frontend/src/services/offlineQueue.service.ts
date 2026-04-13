/**
 * offlineQueue.service.ts
 *
 * Offline action queue with exponential backoff retry.
 * Queues API calls that fail due to network issues and retries them
 * automatically when connectivity is restored.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState, AppStateStatus } from 'react-native';
import { API_CONFIG } from '../config/api.config';

const QUEUE_KEY = '@ritgate_offline_queue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 2000;

export interface QueuedAction {
  id: string;
  type: string;
  url: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  body?: object;
  retries: number;
  createdAt: number;
  lastAttempt?: number;
}

class OfflineQueueService {
  private processing = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private appStateSubscription: any = null;

  async enqueue(action: Omit<QueuedAction, 'id' | 'retries' | 'createdAt'>): Promise<void> {
    const item: QueuedAction = {
      ...action,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      retries: 0,
      createdAt: Date.now(),
    };
    const queue = await this.load();
    queue.push(item);
    await this.save(queue);
    console.log(`📥 [OfflineQueue] Enqueued: ${item.type}`);
    this.processQueue();
  }

  start(): void {
    this.appStateSubscription = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') this.processQueue();
    });
    this.processQueue();
  }

  stop(): void {
    this.appStateSubscription?.remove();
    if (this.retryTimer) clearTimeout(this.retryTimer);
  }

  private async isOnline(): Promise<boolean> {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 3000);
      const res = await fetch(`${API_CONFIG.BASE_URL.replace('/api', '')}/api/health`, {
        method: 'GET', signal: ctrl.signal,
      });
      clearTimeout(t);
      return res.ok;
    } catch {
      return false;
    }
  }

  private async processQueue(): Promise<void> {
    if (this.processing) return;
    const queue = await this.load();
    if (queue.length === 0) return;
    if (!(await this.isOnline())) return;

    this.processing = true;
    const remaining: QueuedAction[] = [];

    for (const item of queue) {
      const success = await this.attempt(item);
      if (!success) {
        item.retries += 1;
        item.lastAttempt = Date.now();
        if (item.retries < MAX_RETRIES) {
          remaining.push(item);
          const delay = BASE_DELAY_MS * Math.pow(2, item.retries);
          this.retryTimer = setTimeout(() => this.processQueue(), delay);
        } else {
          console.warn(`❌ [OfflineQueue] Dropped: ${item.type}`);
        }
      } else {
        console.log(`✅ [OfflineQueue] Processed: ${item.type}`);
      }
    }

    await this.save(remaining);
    this.processing = false;
  }

  private async attempt(item: QueuedAction): Promise<boolean> {
    try {
      const res = await fetch(item.url, {
        method: item.method,
        headers: { 'Content-Type': 'application/json' },
        body: item.body ? JSON.stringify(item.body) : undefined,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  private async load(): Promise<QueuedAction[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  private async save(queue: QueuedAction[]): Promise<void> {
    try { await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue)); } catch {}
  }

  async getPendingCount(): Promise<number> {
    return (await this.load()).length;
  }
}

export const offlineQueue = new OfflineQueueService();
