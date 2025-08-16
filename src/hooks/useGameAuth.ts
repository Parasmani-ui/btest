'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export const useGameAuth = () => {
  const { user, loading } = useAuth();
  const [showSignInPopup, setShowSignInPopup] = useState(false);

  const checkAuthAndProceed = useCallback((gameAction: () => void, gameName?: string) => {
    if (loading) {
      return; // Wait for auth state to load
    }

    if (!user) {
      setShowSignInPopup(true);
      return;
    }

    // User is authenticated, proceed with game action
    gameAction();
  }, [user, loading]);

  const closeSignInPopup = useCallback(() => {
    setShowSignInPopup(false);
  }, []);

  const onSignInSuccess = useCallback(() => {
    setShowSignInPopup(false);
    // The user is now authenticated, but we don't automatically start the game
    // They'll need to click the button again
  }, []);

  return {
    isAuthenticated: !!user,
    authLoading: loading,
    showSignInPopup,
    checkAuthAndProceed,
    closeSignInPopup,
    onSignInSuccess,
  };
};
