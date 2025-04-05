import { Suspense } from 'react';
import GameContent from './client-page';

// Loading component to show while suspense is loading
function GameLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-xl">Loading case details...</p>
    </div>
  );
}

// Main component with Suspense
export default function Game() {
  return (
    <Suspense fallback={<GameLoading />}>
      <GameContent />
    </Suspense>
  );
} 