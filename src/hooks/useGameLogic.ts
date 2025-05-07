
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem } from '@/types/game';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { simulateCombat } from '@/services/combat';
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
    
    const totalImpactFactor = headlines.reduce((sum, h) => sum + h.priceImpact, 0);
    
    return prices.map(drugPrice => ({
      ...drugPrice,
      price: Math.max(1, Math.round(drugPrice.price * (1 + totalImpactFactor))), 
    }));
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
          totalCost: Math.max(0, newTotalCost), // Prevent negative totalCost due to floating point issues
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

    const newDaysPassed = gameState.playerStats.daysPassed + 1;
    addLogEntry('info', `Day ${newDaysPassed} begins.`);
    let newHealth = gameState.playerStats.health;
    let newCash = gameState.playerStats.cash;
    let newReputation = gameState.playerStats.reputation;
    let newLocation = gameState.playerStats.currentLocation;

    if (newDaysPassed % 7 === 0) {
        const currentLocationIndex = CITIES.indexOf(newLocation);
        newLocation = CITIES[(currentLocationIndex + 1) % CITIES.length];
        const travelMsg = `You moved to ${newLocation}.`;
        toast({ title: "Travel", description: travelMsg });
        addLogEntry('travel', travelMsg);
    }

    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(newLocation);
      newLocalHeadlines = await getLocalHeadlines(newLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
    } catch (error) {
      console.error("Failed to fetch market data for next day:", error);
      const marketErrorMsg = "Could not update market data.";
      toast({ title: "Market Error", description: marketErrorMsg, variant: "destructive" });
      addLogEntry('info', marketErrorMsg);
    }
    
    if (Math.random() < 0.25) {
      const opponentTypes = ["police", "gang", "fiend"];
      const opponentType = opponentTypes[Math.floor(Math.random() * opponentTypes.length)];
      const encounterMsg = `You've run into ${opponentType}!`;
      toast({ title: "Encounter!", description: encounterMsg});
      addLogEntry('info', encounterMsg);
      
      try {
        const combatResult = await simulateCombat(opponentType, gameState.playerStats);
        const healthLost = combatResult.healthLost;
        newHealth -= healthLost;
        addLogEntry('health_update', `Lost ${healthLost} health in combat.`);
        
        if (combatResult.playerWins) {
          const combatWinMsg = `You survived the encounter with ${opponentType}, lost ${healthLost} health.`;
          toast({ title: "Combat Over", description: combatWinMsg });
          addLogEntry('combat_win', combatWinMsg);
          if(opponentType === "gang") newReputation += 5;
        } else {
          const cashLossPercentage = Math.random() * 0.3 + 0.2; // Lose 20-50% of cash
          const cashLoss = Math.min(newCash, Math.floor(newCash * cashLossPercentage)); 
          newCash -= cashLoss;
          const combatLossMsg = `Lost to ${opponentType}! Lost ${healthLost} health and $${cashLoss.toLocaleString()}.`;
          toast({ 
            title: "Combat Lost!", 
            description: combatLossMsg,
            variant: "destructive"
          });
          addLogEntry('combat_loss', combatLossMsg);
        }
      } catch (error) {
         console.error("Failed to simulate combat:", error);
         const combatErrorMsg = "Error during combat simulation.";
         toast({ title: "Combat Error", description: combatErrorMsg, variant: "destructive" });
         addLogEntry('info', combatErrorMsg);
      }
    }

    const oldRank = gameState.playerStats.rank;
    let newRank = gameState.playerStats.rank;
    if (newCash > 50000 && newReputation > 200 && newRank !== 'Baron' && newRank !== 'Kingpin') newRank = 'Baron';
    else if (newCash > 20000 && newReputation > 100 && newRank !== 'Distributor' && newRank !== 'Baron' && newRank !== 'Kingpin') newRank = 'Distributor';
    else if (newCash > 10000 && newReputation > 50 && newRank !== 'Supplier' && newRank !== 'Distributor' && newRank !== 'Baron' && newRank !== 'Kingpin') newRank = 'Supplier';
    else if (newCash > 5000 && newReputation > 20 && newRank !== 'Dealer' && newRank !== 'Supplier' && newRank !== 'Distributor' && newRank !== 'Baron' && newRank !== 'Kingpin') newRank = 'Dealer';
    else if (newCash > 2000 && newReputation > 5 && newRank !== 'Peddler' && newRank !== 'Dealer' && newRank !== 'Supplier' && newRank !== 'Distributor' && newRank !== 'Baron' && newRank !== 'Kingpin') newRank = 'Peddler';
    
    if (newRank !== oldRank) {
      const rankUpMsg = `You've been promoted to ${newRank}!`;
      toast({title: "Rank Up!", description: rankUpMsg});
      addLogEntry('rank_up', rankUpMsg);
    }


    if (newHealth <= 0) {
      const gameOverMsg = "Your health reached 0. Game Over.";
      setGameState(prev => ({
        ...prev,
        playerStats: { ...prev.playerStats, health: 0, cash: newCash, reputation: newReputation, rank: newRank, currentLocation: newLocation, daysPassed: newDaysPassed }, // Update other stats before game over
        isGameOver: true,
        isLoadingNextDay: false,
      }));
      toast({ title: "Game Over", description: gameOverMsg, variant: "destructive" });
      addLogEntry('game_over', gameOverMsg);
      return;
    }

    setGameState(prev => ({
      ...prev,
      playerStats: {
        ...prev.playerStats,
        daysPassed: newDaysPassed,
        health: newHealth,
        cash: newCash,
        reputation: newReputation,
        rank: newRank,
        currentLocation: newLocation,
      },
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
