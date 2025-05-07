
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem } from '@/types/game';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { simulateCombat, type CombatOutcome } from '@/services/combat';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // For generating unique log entry IDs

const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'Player1',
  health: 100,
  cash: 1000,
  inventory: {},
  reputation: 0,
  daysPassed: 0,
  currentLocation: 'New York', 
  rank: 'Rookie',
};

const CITIES = ["New York", "Los Angeles", "Miami", "Chicago", "Houston"];

export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>({
    playerStats: INITIAL_PLAYER_STATS,
    marketPrices: [],
    localHeadlines: [],
    eventLog: [],
    isLoadingNextDay: false,
    isLoadingMarket: true,
    isGameOver: false,
    gameMessage: null,
  });

  const { toast } = useToast();

  const addLogEntry = useCallback((type: LogEventType, message: string) => {
    setGameState(prev => ({
      ...prev,
      eventLog: [{ id: uuidv4(), timestamp: new Date().toISOString(), type, message }, ...prev.eventLog].slice(0, 50) // Keep last 50 entries
    }));
  }, []);

  const fetchInitialMarketData = useCallback(async () => {
    setGameState(prev => ({ ...prev, isLoadingMarket: true }));
    try {
      const prices = await getMarketPrices(INITIAL_PLAYER_STATS.currentLocation);
      const headlines = await getLocalHeadlines(INITIAL_PLAYER_STATS.currentLocation);
      const adjustedPrices = applyHeadlineImpacts(prices, headlines);
      setGameState(prev => ({
        ...prev,
        marketPrices: adjustedPrices,
        localHeadlines: headlines,
        isLoadingMarket: false,
      }));
      addLogEntry('info', `Game started in ${INITIAL_PLAYER_STATS.currentLocation}.`);
    } catch (error) {
      console.error("Failed to fetch initial market data:", error);
      toast({ title: "Error", description: "Could not load market data.", variant: "destructive" });
      addLogEntry('info', 'Error loading initial market data.');
      setGameState(prev => ({ ...prev, isLoadingMarket: false }));
    }
  }, [toast, addLogEntry]);

  useEffect(() => {
    fetchInitialMarketData();
  }, [fetchInitialMarketData]);

  const applyHeadlineImpacts = (prices: DrugPrice[], headlines: LocalHeadline[]): DrugPrice[] => {
    if (!headlines.length) return prices;
    
    // Simplified: apply each headline's impact additively to all drugs
    // A more complex model could have drug-specific or category-specific impacts
    return prices.map(drugPrice => {
      let newPrice = drugPrice.price;
      headlines.forEach(headline => {
        newPrice *= (1 + headline.priceImpact);
      });
      return {
        ...drugPrice,
        price: Math.max(1, Math.round(newPrice)), 
      };
    });
  };

  const buyDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const cost = quantity * price;

      if (quantity <= 0) {
        toast({ title: "Invalid Quantity", description: "Please enter a positive amount to buy.", variant: "destructive" });
        return prev;
      }
      if (currentStats.cash < cost) {
        toast({ title: "Not Enough Cash", description: `You need $${cost.toLocaleString()} but only have $${currentStats.cash.toLocaleString()}.`, variant: "destructive" });
        return prev;
      }

      const newInventory = { ...currentStats.inventory };
      const currentItem: InventoryItem = newInventory[drugName] || { quantity: 0, totalCost: 0 };
      
      newInventory[drugName] = {
        quantity: currentItem.quantity + quantity,
        totalCost: currentItem.totalCost + cost,
      };

      const newCash = currentStats.cash - cost;
      const newReputation = currentStats.reputation + Math.floor(quantity / 10) + 1; 

      const successMsg = `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.`;
      toast({ title: "Purchase Successful", description: successMsg, variant: "default"});
      addLogEntry('buy', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          inventory: newInventory,
          reputation: newReputation,
        },
      };
    });
  }, [toast, addLogEntry]);

  const sellDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const currentItem = currentStats.inventory[drugName];
      
      if (!currentItem || currentItem.quantity < quantity) {
        toast({ title: "Not Enough Stock", description: `You only have ${currentItem?.quantity || 0} ${drugName} to sell.`, variant: "destructive" });
        return prev;
      }
      if (quantity <= 0) {
        toast({ title: "Invalid Quantity", description: "Please enter a positive amount to sell.", variant: "destructive" });
        return prev;
      }

      const earnings = quantity * price;
      const newInventory = { ...currentStats.inventory };
      
      const avgCostPerUnit = currentItem.totalCost / currentItem.quantity;
      const costOfGoodsSold = avgCostPerUnit * quantity;

      const newQuantity = currentItem.quantity - quantity;
      const newTotalCost = currentItem.totalCost - costOfGoodsSold;

      if (newQuantity > 0) {
        newInventory[drugName] = {
          quantity: newQuantity,
          totalCost: Math.max(0, newTotalCost), 
        };
      } else {
        delete newInventory[drugName];
      }

      const newCash = currentStats.cash + earnings;
      const newReputation = currentStats.reputation + Math.floor(quantity / 5) + 1; 

      const successMsg = `Sold ${quantity} ${drugName} for $${earnings.toLocaleString()}.`;
      toast({ title: "Sale Successful", description: successMsg, variant: "default" });
      addLogEntry('sell', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          inventory: newInventory,
          reputation: newReputation,
        },
      };
    });
  }, [toast, addLogEntry]);


  const handleNextDay = useCallback(async () => {
    if (gameState.isGameOver) return;

    setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null }));

    let currentStats = { ...gameState.playerStats };
    currentStats.daysPassed += 1;
    addLogEntry('info', `Day ${currentStats.daysPassed} begins.`);
    
    // Travel
    if (currentStats.daysPassed % 7 === 0) {
        const currentLocationIndex = CITIES.indexOf(currentStats.currentLocation);
        currentStats.currentLocation = CITIES[(currentLocationIndex + 1) % CITIES.length];
        const travelMsg = `You moved to ${currentStats.currentLocation}.`;
        toast({ title: "Travel", description: travelMsg });
        addLogEntry('travel', travelMsg);
    }

    // Market Update
    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(currentStats.currentLocation);
      newLocalHeadlines = await getLocalHeadlines(currentStats.currentLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
    } catch (error) {
      console.error("Failed to fetch market data for next day:", error);
      const marketErrorMsg = "Could not update market data.";
      toast({ title: "Market Error", description: marketErrorMsg, variant: "destructive" });
      addLogEntry('info', marketErrorMsg);
    }
    
    // Random Event: Combat
    if (Math.random() < 0.35) { // Increased probability for testing
      const opponentTypes = ["police", "gang", "fiend"] as const;
      const opponentType = opponentTypes[Math.floor(Math.random() * opponentTypes.length)];
      const encounterMsg = `You've run into ${opponentType === 'police' ? 'the police' : opponentType === 'gang' ? 'a rival gang' : 'a desperate fiend'}!`;
      toast({ title: "Encounter!", description: encounterMsg, duration: 4000 });
      addLogEntry('info', encounterMsg);
      
      try {
        const combatOutcome: CombatOutcome = await simulateCombat(opponentType, currentStats);
        
        currentStats.health -= combatOutcome.healthLost;
        currentStats.cash += combatOutcome.cashChange;
        currentStats.reputation += combatOutcome.reputationChange;

        // Ensure stats don't go below zero where applicable
        currentStats.health = Math.max(0, currentStats.health);
        currentStats.cash = Math.max(0, currentStats.cash);
        // Reputation can be negative

        toast({
          title: combatOutcome.playerWins ? "Victory!" : "Defeat!",
          description: combatOutcome.narration,
          variant: combatOutcome.playerWins ? "default" : "destructive",
          duration: 6000
        });
        
        addLogEntry(combatOutcome.playerWins ? 'combat_win' : 'combat_loss', combatOutcome.narration);
        if (combatOutcome.healthLost > 0) {
          addLogEntry('health_update', `Lost ${combatOutcome.healthLost} health.`);
        }
        if (combatOutcome.cashChange !== 0) {
          addLogEntry('info', `${combatOutcome.cashChange > 0 ? 'Gained' : 'Lost'} $${Math.abs(combatOutcome.cashChange).toLocaleString()}.`);
        }
        if (combatOutcome.reputationChange !== 0) {
          addLogEntry('info', `Reputation changed by ${combatOutcome.reputationChange}.`);
        }

      } catch (error) {
         console.error("Failed to simulate combat:", error);
         const combatErrorMsg = "Error during combat simulation.";
         toast({ title: "Combat Error", description: combatErrorMsg, variant: "destructive" });
         addLogEntry('info', combatErrorMsg);
      }
    }

    // Check for Game Over due to health
    if (currentStats.health <= 0) {
      const gameOverMsg = "Your health reached 0. Game Over.";
      setGameState(prev => ({
        ...prev,
        playerStats: { ...currentStats, health: 0 }, // Final stats update
        isGameOver: true,
        isLoadingNextDay: false,
        marketPrices: newMarketPrices, // Update market prices even on game over
        localHeadlines: newLocalHeadlines,
      }));
      toast({ title: "Game Over", description: gameOverMsg, variant: "destructive" });
      addLogEntry('game_over', gameOverMsg);
      return; // End a_sync processing for this day
    }
    
    // Rank Update
    const oldRank = currentStats.rank;
    if (currentStats.cash > 50000 && currentStats.reputation > 200 && currentStats.rank !== 'Kingpin') currentStats.rank = 'Kingpin';
    else if (currentStats.cash > 25000 && currentStats.reputation > 100 && !['Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Baron';
    else if (currentStats.cash > 10000 && currentStats.reputation > 50 && !['Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Distributor';
    else if (currentStats.cash > 5000 && currentStats.reputation > 25 && !['Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Supplier';
    else if (currentStats.cash > 2000 && currentStats.reputation > 10 && !['Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Dealer';
    else if (currentStats.cash > 1000 && currentStats.reputation > 5 && !['Peddler', 'Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Peddler';
    
    if (currentStats.rank !== oldRank) {
      const rankUpMsg = `You've been promoted to ${currentStats.rank}!`;
      toast({title: "Rank Up!", description: rankUpMsg});
      addLogEntry('rank_up', rankUpMsg);
    }

    setGameState(prev => ({
      ...prev,
      playerStats: currentStats,
      marketPrices: newMarketPrices,
      localHeadlines: newLocalHeadlines,
      isLoadingNextDay: false,
    }));

  }, [gameState.playerStats, gameState.isGameOver, toast, addLogEntry]);

  const resetGame = useCallback(() => {
    setGameState({
      playerStats: INITIAL_PLAYER_STATS,
      marketPrices: [],
      localHeadlines: [],
      eventLog: [],
      isLoadingNextDay: false,
      isLoadingMarket: true, 
      isGameOver: false,
      gameMessage: null,
    });
    fetchInitialMarketData(); 
  }, [fetchInitialMarketData]);

  return {
    ...gameState,
    buyDrug,
    sellDrug,
    handleNextDay,
    resetGame,
  };
}
