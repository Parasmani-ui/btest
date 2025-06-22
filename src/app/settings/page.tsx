'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';

export default function SettingsPage() {
  useEffect(() => {
    // Redirect to 404 since settings is not implemented
    notFound();
  }, []);

  return null;
} 