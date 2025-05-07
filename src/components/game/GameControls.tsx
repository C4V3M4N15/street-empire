
"use client";

import { Button } from '@/components/ui/button';
import { ChevronsRight, RotateCcw } from 'lucide-react';

interface GameControlsProps {
  onNextDay: () => void;
  onResetGame?: () => void; // Optional reset game handler
  isLoading: boolean;
  isGameOver?: boolean;
}

export function GameControls({ onNextDay, onResetGame, isLoading, isGameOver }: GameControlsProps) {
  return (
    <div className="py-4 flex flex-col sm:flex-row justify-center items-center gap-4">
      {isGameOver && onResetGame ? (
         <Button
          onClick={onResetGame}
          disabled={isLoading}
          className="w-full sm:w-auto text-lg py-6 px-8 bg-accent hover:bg-accent/90 text-accent-foreground"
        >
          <RotateCcw className="mr-2 h-5 w-5" /> Restart Game
        </Button>
      ) : (
        <Button
          onClick={onNextDay}
          disabled={isLoading || isGameOver}
          className="w-full sm:w-auto text-lg py-6 px-8 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {isLoading ? 'Processing...' : 'Next Day'}
          {!isLoading && <ChevronsRight className="ml-2 h-5 w-5" />}
        </Button>
      )}
    </div>
  );
}
