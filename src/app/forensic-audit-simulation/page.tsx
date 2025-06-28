import { Suspense } from 'react';
import ClientPage from './client-page';

export default function ForensicAuditSimulationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPage />
    </Suspense>
  );
} 