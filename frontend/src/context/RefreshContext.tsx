/**
 * RefreshContext
 *
 * Provides a global refresh trigger that dashboards subscribe to.
 * When a notification is tapped, App.tsx calls `triggerRefresh()` which
 * increments the counter — any dashboard watching `refreshCount` will
 * re-fetch its data automatically.
 */
import React, { createContext, useContext, useState, useRef, ReactNode } from 'react';

interface RefreshContextType {
  refreshCount: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextType>({
  refreshCount: 0,
  triggerRefresh: () => {},
});

export const RefreshProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [refreshCount, setRefreshCount] = useState(0);
  const triggerRefresh = () => setRefreshCount(c => c + 1);
  return (
    <RefreshContext.Provider value={{ refreshCount, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
};

export const useRefresh = () => useContext(RefreshContext);
