/**
 * networkStatus.ts
 *
 * Module-level network state singleton backed by NetInfo.
 * Lets non-React code (api.service, offlineQueue) read connectivity
 * synchronously and react to changes without a React context.
 */
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

type Listener = (online: boolean) => void;

class NetworkStatus {
  /** Last known connectivity. Starts true so we never block before the first NetInfo event. */
  private online = true;
  private listeners = new Set<Listener>();
  private started = false;

  start(): void {
    if (this.started) return;
    this.started = true;
    NetInfo.addEventListener((state: NetInfoState) => {
      // isInternetReachable can be null while probing — treat null as reachable
      const next = state.isConnected !== false && state.isInternetReachable !== false;
      if (next !== this.online) {
        this.online = next;
        console.log(next ? '🌐 Network restored' : '📵 Network lost');
        this.listeners.forEach(l => {
          try { l(next); } catch {}
        });
      }
    });
  }

  get isOnline(): boolean {
    return this.online;
  }

  /** Subscribe to connectivity changes. Returns an unsubscribe function. */
  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /** Force a fresh check (e.g. before a critical request). */
  async refresh(): Promise<boolean> {
    try {
      const state = await NetInfo.fetch();
      this.online = state.isConnected !== false && state.isInternetReachable !== false;
    } catch {}
    return this.online;
  }
}

export const networkStatus = new NetworkStatus();
