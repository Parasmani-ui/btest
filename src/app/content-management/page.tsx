'use client';

import { useEffect } from 'react';
import { notFound } from 'next/navigation';

export default function ContentManagementPage() {
  useEffect(() => {
    // Redirect to 404 since content management is not implemented
    notFound();
  }, []);

  return null;
} 