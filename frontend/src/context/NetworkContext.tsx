/**
 * NetworkContext.tsx
 *
 * React-side network awareness. Provides `isOnline` to any screen via
 * useNetwork(), driven by the shared networkStatus singleton.
 */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { networkStatus } from '../utils/networkStatus';

interface NetworkContextValue {
  isOnline: boolean;
}

const NetworkContext = createContext<NetworkContextValue>({ isOnline: true });

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline);

  useEffect(() => {
    networkStatus.start();
    const unsubscribe = networkStatus.subscribe(setIsOnline);
    return unsubscribe;
  }, []);

  return (
    <NetworkContext.Provider value={{ isOnline }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = (): NetworkContextValue => useContext(NetworkContext);
