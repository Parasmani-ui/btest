'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFound() {
  const router = useRouter();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const goBack = () => {
    router.back();
  };

  const goToDashboard = () => {
    router.push('/dashboard');
  };

  const goToHome = () => {
    router.push('/');
  };

  if (!mounted) return null;

  return (
    <div
      className={`min-h-screen flex items-center justify-center px-4 ${
        theme === 'dark'
          ? 'bg-gray-900 text-white'
          : 'bg-gray-100 text-gray-900'
      }`}
    >
      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className={`fixed top-6 right-6 p-2 rounded-full shadow ${
          theme === 'dark' ? 'bg-gray-700' : 'bg-white'
        }`}
      >
        {theme === 'dark' ? '☀️' : '🌙'}
      </button>

      <div
        className={`max-w-lg w-full text-center p-8 rounded-lg shadow ${
          theme === 'dark' ? 'bg-gray-800' : 'bg-white'
        }`}
      >
        <h1 className="text-6xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-sm mb-6">
          The page you’re looking for doesn’t exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={goBack}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Go Back
          </button>
          <button
            onClick={goToDashboard}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
          >
            Go to Dashboard
          </button>
          <button
            onClick={goToHome}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Go Home
          </button>
        </div>

        <p className="mt-6 text-xs text-gray-400">
          This might happen on pages like Settings, Analytics, or Content areas.
        </p>
      </div>
    </div>
  );
}
