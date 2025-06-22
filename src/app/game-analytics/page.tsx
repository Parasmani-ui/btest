'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';

export default function GameAnalyticsPage() {
  useEffect(() => {
    // Redirect to 404 since game analytics is not implemented
    notFound();
  }, []);

  return null;
} 