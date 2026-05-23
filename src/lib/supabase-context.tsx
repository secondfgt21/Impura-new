import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface SupabaseHealthState {
  isDbAvailable: boolean;
  isChecking: boolean;
  rtStatus: boolean;
  productsCount: number;
  ordersCount: number;
  lastError: string | null;
  checkHealth: () => Promise<boolean>;
}

const SupabaseHealthContext = createContext<SupabaseHealthState | undefined>(undefined);

export const SupabaseHealthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isDbAvailable, setIsDbAvailable] = useState<boolean>(true);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [rtStatus, setRtStatus] = useState<boolean>(true);
  const [productsCount, setProductsCount] = useState<number>(0);
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  const checkHealth = useCallback(async (): Promise<boolean> => {
    setIsChecking(true);
    try {
      const res = await fetch('/api/health', { cache: 'no-store' });
      if (!res.ok) {
        throw new Error(`API health returned status: ${res.status}`);
      }
      const data = await res.json();
      
      const available = data.database === 'connected';
      setIsDbAvailable(available);
      setRtStatus(!!data.realtime);
      setProductsCount(Number(data.products) || 0);
      setLastError(data.error || (available ? null : 'Failed to query database'));
      setIsChecking(false);
      return available;
    } catch (err: any) {
      console.error('[SUPABASE HEALTH CHECK] Failed to fetch health status:', err);
      setIsDbAvailable(false);
      setRtStatus(false);
      setLastError(err?.message || String(err));
      setIsChecking(false);
      return false;
    }
  }, []);

  useEffect(() => {
    // Perform initial health check
    checkHealth();
    
    // Auto re-check every 30 seconds
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [checkHealth]);

  return (
    <SupabaseHealthContext.Provider
      value={{
        isDbAvailable,
        isChecking,
        rtStatus,
        productsCount,
        ordersCount,
        lastError,
        checkHealth
      }}
    >
      {children}
    </SupabaseHealthContext.Provider>
  );
};

export const useSupabaseHealth = () => {
  const context = useContext(SupabaseHealthContext);
  if (!context) {
    throw new Error('useSupabaseHealth must be used within a SupabaseHealthProvider');
  }
  return context;
};
