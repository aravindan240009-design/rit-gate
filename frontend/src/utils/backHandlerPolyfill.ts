// Polyfill for deprecated BackHandler.removeEventListener
// This fixes the "BackHandler.removeEventListener is not a function" error
// in React Native 0.65+ where the API was changed

import { BackHandler } from 'react-native';

type BackHandlerEvent = 'hardwareBackPress';
type BackHandlerCallback = () => boolean | null | undefined;

// Store subscriptions globally
const subscriptions = new Map<string, { remove: () => void }>();
let subscriptionCounter = 0;

// Check if removeEventListener exists, if not, create a polyfill
if (typeof (BackHandler as any).removeEventListener !== 'function') {
  console.log('⚠️  BackHandler.removeEventListener not found, applying polyfill...');

  // Store original addEventListener
  const originalAddEventListener = BackHandler.addEventListener;

  // Override addEventListener to track subscriptions
  (BackHandler as any).addEventListener = (
    eventName: BackHandlerEvent,
    handler: BackHandlerCallback
  ) => {
    const subscription = originalAddEventListener.call(BackHandler, eventName, handler);
    
    // Create unique key for this subscription
    const key = `subscription_${subscriptionCounter++}`;
    subscriptions.set(key, subscription);
    
    // Store the key on the handler for later removal
    (handler as any).__subscriptionKey = key;
    
    return subscription;
  };

  // Create removeEventListener polyfill
  (BackHandler as any).removeEventListener = (
    eventName: BackHandlerEvent,
    handler: BackHandlerCallback
  ) => {
    const key = (handler as any).__subscriptionKey;
    
    if (key) {
      const subscription = subscriptions.get(key);
      if (subscription && typeof subscription.remove === 'function') {
        subscription.remove();
        subscriptions.delete(key);
        delete (handler as any).__subscriptionKey;
      }
    }
  };

  console.log('✅ BackHandler polyfill applied successfully');
} else {
  console.log('✅ BackHandler.removeEventListener already exists, no polyfill needed');
}

export default BackHandler;
