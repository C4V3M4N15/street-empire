
"use client";

import { useEffect } from 'react'; // Added useEffect
import { PlayerStatsCard } from '@/components/game/PlayerStatsCard';
import { MarketInfoCard } from '@/components/game/MarketInfoCard';
import { GameControls } from '@/components/game/GameControls';
import { GameOverDialog } from '@/components/game/GameOverDialog';
import { UnifiedLogPanel } from '@/components/game/UnifiedLogPanel';
import { BattleScreen } from '@/components/game/BattleScreen';
import { useGameLogic } from '@/hooks/useGameLogic';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext'; // Added
import { useRouter } from 'next/navigation'; // Added
import Link from 'next/link'; // Added
import { auth } from '@/lib/firebase/firebase'; // Import auth for signout

export default function StreetEmpirePage() {
  const { user, loading: authLoading } = useAuth(); // Added
  const router = useRouter(); // Added

  const {
    playerStats,
    marketPrices,
    localHeadlines,
    activeBoroughEvents,
    availableWeapons,
    availableArmor,
    availableHealingItems,
    availableCapacityUpgrades,
    eventLog,
    isLoadingNextDay,
    isLoadingMarket,
    isGameOver,
    buyDrug,
    sellDrug,
    buyWeapon,
    buyAmmoForEquippedWeapon,
    buyArmor,
    buyHealingItem,
    buyCapacityUpgrade,
    handleNextDay,
    resetGame,
    travelToLocation,
    fetchHeadlinesForLocation,
    isBattleActive,
    currentEnemy,
    battleLog,
    battleMessage,
    handlePlayerBattleAction,
    endBattleScreen,
  } = useGameLogic(user); // Pass user to useGameLogic if it needs it for initialization

  // Effect to redirect if not authenticated and not loading
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [user, authLoading, router]);


  if (authLoading || (isLoadingMarket && playerStats.daysPassed === 0 && marketPrices.length === 0 && playerStats.cash === 1000 && !user)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-16 w-16 animate-spin text-accent mb-4" />
        <h1 className="text-3xl font-bold mb-2">Street Empire</h1>
        <p className="text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }
  
  // If auth is done loading and there's still no user, show login prompt (should be handled by redirect mostly)
  if (!authLoading && !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
         <h1 className="text-3xl font-bold mb-2">Street Empire</h1>
        <p className="text-lg text-muted-foreground mb-4">Please log in to play.</p>
        <Button asChild>
            <Link href="/login">Go to Login</Link>
        </Button>
      </div>
    );
  }


  if (isBattleActive && currentEnemy) {
    return (
      <BattleScreen
        playerStats={playerStats}
        enemyStats={currentEnemy}
        battleLog={battleLog}
        battleMessage={battleMessage}
        onPlayerAction={handlePlayerBattleAction}
        onEndBattle={endBattleScreen}
        isLoading={isLoadingNextDay}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center p-4 sm:p-6 md:p-8">
      <header className="w-full max-w-3xl mb-6 text-center">
        <div className="flex justify-between items-center w-full">
          <h1 className="text-4xl sm:text-5xl font-bold text-primary-foreground tracking-tight">
            Street Empire
          </h1>
          {user && (
            <Button variant="outline" size="sm" onClick={async () => {
              await auth.signOut(); // Use auth.signOut()
              router.push('/login');
            }}>
              Logout
            </Button>
          )}
        </div>
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
            isLoading={isLoadingNextDay || (isLoadingMarket && marketPrices.length === 0 && availableWeapons.length === 0 && availableArmor.length === 0 && availableHealingItems.length === 0 && availableCapacityUpgrades.length === 0)}
            playerStats={playerStats}
            activeBoroughEvents={activeBoroughEvents}
            availableWeapons={availableWeapons}
            availableArmor={availableArmor}
            availableHealingItems={availableHealingItems}
            availableCapacityUpgrades={availableCapacityUpgrades}
            buyDrug={buyDrug}
            sellDrug={sellDrug}
            buyWeapon={buyWeapon}
            buyAmmoForEquippedWeapon={buyAmmoForEquippedWeapon}
            buyArmor={buyArmor}
            buyHealingItem={buyHealingItem}
            buyCapacityUpgrade={buyCapacityUpgrade}
            travelToLocation={travelToLocation}
            fetchHeadlinesForLocation={fetchHeadlinesForLocation}
          />
           <UnifiedLogPanel eventLog={eventLog} />
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
        isOpen={isGameOver && !isBattleActive}
        onClose={resetGame}
        daysPassed={playerStats.daysPassed}
        finalCash={playerStats.cash}
        rank={playerStats.rank}
      />

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Street Empire. All rights reserved (not really).</p>
      </footer>
    </div>
  );
}

