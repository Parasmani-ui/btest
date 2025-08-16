'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useState } from 'react';

export const useUserDataRefresh = () => {
  const { refreshUserData } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isRefreshing) return; // Prevent multiple simultaneous refreshes
    
    setIsRefreshing(true);
    try {
      await refreshUserData();
    } catch (error) {
      console.error('Error refreshing user data:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshUserData, isRefreshing]);

  return {
    refresh,
    isRefreshing
  };
};
