'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { 
  UserIcon, 
  ClockIcon, 
  LogOutIcon, 
  HomeIcon,
  TrophyIcon,
  CalendarIcon,
  PlayIcon
} from 'lucide-react';

interface GameHeaderProps {
  gameTitle?: string;
  showTimestamp?: boolean;
  startTiming?: boolean;
  gameEnded?: boolean;
  resetKey?: string | number;
  sessionStartTime?: Date | null;
}

export default function GameHeader({ 
  gameTitle = "Investigation Game", 
  showTimestamp = true,
  startTiming = false,
  gameEnded = false,
  resetKey = 0,
  sessionStartTime = null
}: GameHeaderProps) {
  const { userData, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [elapsedTime, setElapsedTime] = useState('00:00');
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const finalElapsedTime = useRef<string>('00:00');
  const previousResetKey = useRef(resetKey);

  // Set mounted to true after component mounts (prevents hydration errors)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Reset timer when resetKey changes (indicates new game)
  useEffect(() => {
    if (resetKey !== previousResetKey.current) {
      // Reset elapsed time state
      finalElapsedTime.current = '00:00';
      setElapsedTime('00:00');
      previousResetKey.current = resetKey;
    }
  }, [resetKey]);

  // Timer for current time and elapsed time
  useEffect(() => {
    // Clear any existing timer
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Set up new timer
    intervalRef.current = setInterval(() => {
      const now = new Date();
      setCurrentTime(now);
      
      // Calculate elapsed time only if session has started and we have a start time
      if (sessionStartTime && startTiming && !gameEnded) {
        const elapsed = Math.floor((now.getTime() - sessionStartTime.getTime()) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeString = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setElapsedTime(timeString);
        finalElapsedTime.current = timeString;
      } else if (gameEnded && finalElapsedTime.current !== '00:00') {
        // Keep the final elapsed time frozen when game ends
        setElapsedTime(finalElapsedTime.current);
      } else if (!startTiming && !gameEnded) {
        setElapsedTime('00:00');
      }
    }, 1000);

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [startTiming, gameEnded, resetKey, sessionStartTime]);

  const handleSignOut = useCallback(async () => {
    if (confirm('Are you sure you want to sign out?')) {
      try {
        await logout();
      } catch (error) {
        console.error('Error during sign out:', error);
      }
    }
  }, [logout]);

  const formatTime = useCallback((date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }, []);

  const formatDate = useCallback((date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-gray-900 border-b border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left side - Game title and current time */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <TrophyIcon className="w-6 h-6 text-blue-400" />
              <h1 className="text-lg font-semibold text-white">{gameTitle}</h1>
            </div>
            
            {showTimestamp && mounted && (
              <div className="hidden sm:flex items-center space-x-4">
                <div className="flex items-center space-x-1 text-sm text-gray-300">
                  <CalendarIcon className="w-4 h-4" />
                  <span>{formatDate(currentTime)}</span>
                </div>
                <div className="flex items-center space-x-1 text-sm text-gray-300">
                  <ClockIcon className="w-4 h-4" />
                  <span>{formatTime(currentTime)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Timer hidden from users */}
          <div className="hidden md:block"></div>

          {/* Right side - User info and actions */}
          <div className="flex items-center space-x-4">
            {userData ? (
              <>
                <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-300">
                  <UserIcon className="w-4 h-4" />
                  <span className="max-w-32 truncate">{userData.displayName}</span>
                  <span className="px-2 py-1 bg-green-600 bg-opacity-20 text-green-400 rounded text-xs">
                    Online
                  </span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                  >
                    <HomeIcon className="w-4 h-4 mr-1" />
                    Dashboard
                  </Link>
                  
                  <button
                    onClick={handleSignOut}
                    className="inline-flex items-center px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                  >
                    <LogOutIcon className="w-4 h-4 mr-1" />
                    Sign Out
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 bg-red-600 bg-opacity-20 text-red-400 rounded text-xs">
                  Offline
                </span>
                <Link
                  href="/login"
                  className="inline-flex items-center px-3 py-1 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Timer hidden from mobile users */}
      </div>
    </header>
  );
} 