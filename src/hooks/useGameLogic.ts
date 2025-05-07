
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, PlayerRank, GameState } from '@/types/game';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { simulateCombat, type CombatResult } from '@/services/combat';
import { useToast } from '@/hooks/use-toast';

const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'Player1',
  health: 100,
  cash: 1000,
  inventory: {}, // Initialize empty inventory
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
    isLoadingNextDay: false,
    isLoadingMarket: true,
    isGameOver: false,
    gameMessage: null,
  });

  const { toast } = useToast();

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
    } catch (error) {
      console.error("Failed to fetch initial market data:", error);
      toast({ title: "Error", description: "Could not load market data.", variant: "destructive" });
      setGameState(prev => ({ ...prev, isLoadingMarket: false }));
    }
  }, [toast]);

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
      newInventory[drugName] = (newInventory[drugName] || 0) + quantity;

      const newCash = currentStats.cash - cost;
      const newReputation = currentStats.reputation + Math.floor(quantity / 10) + 1; 

      toast({ title: "Purchase Successful", description: `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.` , variant: "default"});

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
  }, [toast]);

  const sellDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const currentDrugQuantity = currentStats.inventory[drugName] || 0;
      const earnings = quantity * price;

      if (quantity <= 0) {
        toast({ title: "Invalid Quantity", description: "Please enter a positive amount to sell.", variant: "destructive" });
        return prev;
      }
      if (currentDrugQuantity < quantity) {
        toast({ title: "Not Enough Stock", description: `You only have ${currentDrugQuantity.toLocaleString()} ${drugName} to sell.`, variant: "destructive" });
        return prev;
      }

      const newInventory = { ...currentStats.inventory };
      newInventory[drugName] = currentDrugQuantity - quantity;
      if (newInventory[drugName] === 0) {
        delete newInventory[drugName]; 
      }

      const newCash = currentStats.cash + earnings;
      const newReputation = currentStats.reputation + Math.floor(quantity / 5) + 1; 

      toast({ title: "Sale Successful", description: `Sold ${quantity} ${drugName} for $${earnings.toLocaleString()}.`, variant: "default" });

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
  }, [toast]);


  const handleNextDay = useCallback(async () => {
    if (gameState.isGameOver) return;

    setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null }));

    const newDaysPassed = gameState.playerStats.daysPassed + 1;
    let newHealth = gameState.playerStats.health;
    let newCash = gameState.playerStats.cash;
    let newReputation = gameState.playerStats.reputation;
    let newLocation = gameState.playerStats.currentLocation;

    if (newDaysPassed % 7 === 0) {
        const currentLocationIndex = CITIES.indexOf(newLocation);
        newLocation = CITIES[(currentLocationIndex + 1) % CITIES.length];
        toast({ title: "Travel", description: `You moved to ${newLocation}.` });
    }

    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(newLocation);
      newLocalHeadlines = await getLocalHeadlines(newLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
    } catch (error) {
      console.error("Failed to fetch market data for next day:", error);
      toast({ title: "Market Error", description: "Could not update market data.", variant: "destructive" });
    }
    
    if (Math.random() < 0.25) {
      const opponentTypes = ["police", "gang", "fiend"];
      const opponentType = opponentTypes[Math.floor(Math.random() * opponentTypes.length)];
      toast({ title: "Encounter!", description: `You've run into ${opponentType}!`});
      
      try {
        const combatResult = await simulateCombat(opponentType, gameState.playerStats);
        newHealth -= combatResult.healthLost;
        
        if (combatResult.playerWins) {
          toast({ title: "Combat Over", description: `You survived the encounter with ${opponentType}, but lost ${combatResult.healthLost} health.` });
          if(opponentType === "gang") newReputation += 5;
        } else {
          const cashLoss = Math.min(newCash, Math.floor(newCash * 0.5)); 
          newCash -= cashLoss;
          toast({ 
            title: "Combat Lost!", 
            description: `You lost against ${opponentType}! You lost ${combatResult.healthLost} health and $${cashLoss.toLocaleString()}.`,
            variant: "destructive"
          });
        }
      } catch (error) {
         console.error("Failed to simulate combat:", error);
         toast({ title: "Combat Error", description: "Error during combat simulation.", variant: "destructive" });
      }
    }

    let newRank = gameState.playerStats.rank;
    if (newCash > 50000 && newRank === 'Distributor') newRank = 'Baron';
    else if (newCash > 20000 && newRank === 'Supplier') newRank = 'Distributor';
    else if (newCash > 10000 && newRank === 'Dealer') newRank = 'Supplier';
    else if (newCash > 5000 && newRank === 'Peddler') newRank = 'Dealer';
    else if (newCash > 2000 && newRank === 'Rookie') newRank = 'Peddler';


    if (newHealth <= 0) {
      setGameState(prev => ({
        ...prev,
        playerStats: { ...prev.playerStats, health: 0 },
        isGameOver: true,
        isLoadingNextDay: false,
      }));
      toast({ title: "Game Over", description: "Your health reached 0.", variant: "destructive" });
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

  }, [gameState.playerStats, gameState.isGameOver, toast]);

  const resetGame = useCallback(() => {
    setGameState({
      playerStats: INITIAL_PLAYER_STATS,
      marketPrices: [],
      localHeadlines: [],
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

