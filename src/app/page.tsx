
"use client";

import { PlayerStatsCard } from '@/components/game/PlayerStatsCard';
import { MarketInfoCard } from '@/components/game/MarketInfoCard';
import { GameControls } from '@/components/game/GameControls';
import { GameOverDialog } from '@/components/game/GameOverDialog';
import { EventLogCard } from '@/components/game/EventLogCard';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function StreetEmpirePage() {
  const {
    playerStats,
    marketPrices,
    localHeadlines,
    eventLog,
    isLoadingNextDay,
    isLoadingMarket,
    isGameOver,
    buyDrug,
    sellDrug,
    handleNextDay,
    resetGame,
    travelToLocation, // Add this
    fetchHeadlinesForLocation, // Add this
  } = useGameLogic();

  if (isLoadingMarket && playerStats.daysPassed === 0 && marketPrices.length === 0 && playerStats.cash === 1000) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-16 w-16 animate-spin text-accent mb-4" />
        <h1 className="text-3xl font-bold mb-2">Street Empire</h1>
        <p className="text-lg text-muted-foreground">Loading game data...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-3xl mb-6 text-center">
        <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight">
          Street Empire
        </h1>
        <p className="text-md sm:text-lg text-muted-foreground mt-1">
          Build your empire, one deal at a time.
        </p>
      </header>

      <main className="w-full max-w-3xl grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <PlayerStatsCard playerStats={playerStats} />
        </div>
        <div className="lg:col-span-2 space-y-6">
          <MarketInfoCard 
            marketPrices={marketPrices} 
            localHeadlines={localHeadlines} 
            isLoading={isLoadingNextDay || (isLoadingMarket && marketPrices.length === 0)}
            playerStats={playerStats}
            buyDrug={buyDrug}
            sellDrug={sellDrug}
            travelToLocation={travelToLocation} // Pass down
            fetchHeadlinesForLocation={fetchHeadlinesForLocation} // Pass down
          />
           <EventLogCard eventLog={eventLog} />
        </div>
      </main>
      
      <div className="w-full max-w-3xl mt-6">
         <GameControls 
          onNextDay={handleNextDay} 
          isLoading={isLoadingNextDay}
          isGameOver={isGameOver}
          onResetGame={resetGame}
        />
      </div>


      <GameOverDialog
        isOpen={isGameOver}
        onClose={resetGame}
        daysPassed={playerStats.daysPassed}
        finalCash={playerStats.cash}
        rank={playerStats.rank}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Street Empire. All rights reserved (not really).</p>
        <p>Press 'Cmd/Ctrl + B' to toggle sidebar (if one was implemented).</p>
      </footer>
    </div>
  );
}
