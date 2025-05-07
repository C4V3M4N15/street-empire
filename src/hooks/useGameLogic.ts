
"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem, Weapon, Armor } from '@/types/game';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { simulateCombat, type CombatOutcome } from '@/services/combat';
import { getShopWeapons, getShopArmor } from '@/services/shopItems'; // Import shop items service
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // For generating unique log entry IDs

const NYC_LOCATIONS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const PLAYER_BASE_DAMAGE = 1; // Damage with fists
const PLAYER_BASE_PROTECTION = 0; // Base protection without armor

const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'Player1',
  health: 100,
  cash: 1000,
  inventory: {},
  reputation: 0,
  daysPassed: 0,
  currentLocation: NYC_LOCATIONS[0], // Start in Manhattan
  rank: 'Rookie',
  maxInventoryCapacity: 10, // Default carrying capacity
  equippedWeapon: null, // Starts with fists (null weapon)
  equippedArmor: null, // Starts with no armor
};


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
    availableWeapons: [], // Initialize available weapons
    availableArmor: [], // Initialize available armor
  });

  const { toast } = useToast();

  const addLogEntry = useCallback((type: LogEventType, message: string) => {
    setGameState(prev => ({
      ...prev,
      eventLog: [{ id: uuidv4(), timestamp: new Date().toISOString(), type, message }, ...prev.eventLog].slice(0, 50) // Keep last 50 entries
    }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setGameState(prev => ({ ...prev, isLoadingMarket: true }));
    try {
      const [prices, headlines, weapons, armor] = await Promise.all([
        getMarketPrices(INITIAL_PLAYER_STATS.currentLocation),
        getLocalHeadlines(INITIAL_PLAYER_STATS.currentLocation),
        getShopWeapons(), // Fetch shop weapons
        getShopArmor(), // Fetch shop armor
      ]);
      
      const adjustedPrices = applyHeadlineImpacts(prices, headlines);
      setGameState(prev => ({
        ...prev,
        marketPrices: adjustedPrices,
        localHeadlines: headlines,
        availableWeapons: weapons, 
        availableArmor: armor,
        isLoadingMarket: false,
      }));
      addLogEntry('info', `Game started in ${INITIAL_PLAYER_STATS.currentLocation}. Market and shop data loaded.`);
    } catch (error) {
      console.error("Failed to fetch initial game data:", error);
      toast({ title: "Error", description: "Could not load game data.", variant: "destructive" });
      addLogEntry('info', 'Error loading initial game data.');
      setGameState(prev => ({ ...prev, isLoadingMarket: false }));
    }
  }, [toast, addLogEntry]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const applyHeadlineImpacts = (prices: DrugPrice[], headlines: LocalHeadline[]): DrugPrice[] => {
    if (!headlines.length) return prices;
    
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

      const currentTotalUnits = Object.values(currentStats.inventory).reduce((sum, item) => sum + item.quantity, 0);
      if (currentTotalUnits + quantity > currentStats.maxInventoryCapacity) {
        toast({ title: "Not Enough Space", description: `You can only carry ${currentStats.maxInventoryCapacity - currentTotalUnits} more units. Current capacity: ${currentTotalUnits}/${currentStats.maxInventoryCapacity}.`, variant: "destructive" });
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

  const buyWeapon = useCallback((weaponToBuy: Weapon) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      if (currentStats.cash < weaponToBuy.price) {
        toast({ title: "Not Enough Cash", description: `You need $${weaponToBuy.price.toLocaleString()} to buy the ${weaponToBuy.name}.`, variant: "destructive" });
        return prev;
      }
      
      if (currentStats.equippedWeapon?.name === weaponToBuy.name) {
        toast({ title: "Already Equipped", description: `You already have the ${weaponToBuy.name} equipped.`, variant: "default" });
        return prev;
      }

      const newCash = currentStats.cash - weaponToBuy.price;
      const successMsg = `Purchased and equipped ${weaponToBuy.name} for $${weaponToBuy.price.toLocaleString()}.`;
      toast({ title: "Weapon Acquired!", description: successMsg });
      addLogEntry('shop_weapon_purchase', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          equippedWeapon: weaponToBuy,
        }
      };
    });
  }, [toast, addLogEntry]);

  const buyArmor = useCallback((armorToBuy: Armor) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      if (currentStats.cash < armorToBuy.price) {
        toast({ title: "Not Enough Cash", description: `You need $${armorToBuy.price.toLocaleString()} to buy the ${armorToBuy.name}.`, variant: "destructive" });
        return prev;
      }

      if (currentStats.equippedArmor?.name === armorToBuy.name) {
        toast({ title: "Already Equipped", description: `You already have the ${armorToBuy.name} equipped.`, variant: "default" });
        return prev;
      }

      const newCash = currentStats.cash - armorToBuy.price;
      const successMsg = `Purchased and equipped ${armorToBuy.name} for $${armorToBuy.price.toLocaleString()}. Protection: +${armorToBuy.protectionBonus}.`;
      toast({ title: "Armor Acquired!", description: successMsg });
      addLogEntry('shop_armor_purchase', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          equippedArmor: armorToBuy,
        }
      };
    });
  }, [toast, addLogEntry]);

  const travelToLocation = useCallback((targetLocation: string) => {
    if (gameState.playerStats.currentLocation === targetLocation) {
        toast({ title: "Already There", description: `You are already in ${targetLocation}.`, variant: "default" });
        return;
    }
    setGameState(prev => {
        const travelMessage = `Traveled from ${prev.playerStats.currentLocation} to ${targetLocation}.`;
        toast({ title: "Travel Successful", description: travelMessage });
        addLogEntry('travel', travelMessage);
        return {
            ...prev,
            playerStats: {
                ...prev.playerStats,
                currentLocation: targetLocation,
            },
            // Market data for the new location will be fetched on "Next Day"
        };
    });
  }, [toast, addLogEntry, gameState.playerStats.currentLocation]);

  const fetchHeadlinesForLocation = useCallback(async (location: string): Promise<LocalHeadline[]> => {
    try {
      const headlines = await getLocalHeadlines(location);
      return headlines;
    } catch (error) {
      console.error(`Failed to fetch headlines for ${location}:`, error);
      toast({ title: "Headline Error", description: `Could not load headlines for ${location}.`, variant: "destructive" });
      return [];
    }
  }, [toast]);


  const handleNextDay = useCallback(async () => {
    if (gameState.isGameOver) return;

    setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null }));

    let currentStats = { ...gameState.playerStats };
    currentStats.daysPassed += 1;
    addLogEntry('info', `Day ${currentStats.daysPassed} begins in ${currentStats.currentLocation}.`);
    
    // Market Update for the current location
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
    if (Math.random() < 0.3) { // 30% chance of combat
      const opponentTypes = ["police", "gang", "fiend"] as const;
      const opponentType = opponentTypes[Math.floor(Math.random() * opponentTypes.length)];
      const encounterMsg = `You've run into ${opponentType === 'police' ? 'the police' : opponentType === 'gang' ? 'a rival gang' : 'a desperate fiend'} in ${currentStats.currentLocation}!`;
      toast({ title: "Encounter!", description: encounterMsg, duration: 4000 });
      addLogEntry('info', encounterMsg);
      
      try {
        // Pass player base damage and weapon damage for combat simulation
        const playerTotalDamage = PLAYER_BASE_DAMAGE + (currentStats.equippedWeapon?.damageBonus || 0);
        // Note: Player's protection from armor is implicitly handled if `simulateCombat` uses playerStats, or it can be passed explicitly.
        const combatOutcome: CombatOutcome = await simulateCombat(opponentType, currentStats); 
        
        // Apply damage reduction from armor if combat service doesn't handle it
        let actualHealthLost = combatOutcome.healthLost;
        if (currentStats.equippedArmor) {
            actualHealthLost = Math.max(0, combatOutcome.healthLost - currentStats.equippedArmor.protectionBonus);
        }
        
        currentStats.health -= actualHealthLost;
        currentStats.cash += combatOutcome.cashChange;
        currentStats.reputation += combatOutcome.reputationChange;

        currentStats.health = Math.max(0, currentStats.health);
        currentStats.cash = Math.max(0, currentStats.cash);

        toast({
          title: combatOutcome.playerWins ? "Victory!" : "Defeat!",
          description: combatOutcome.narration,
          variant: combatOutcome.playerWins ? "default" : "destructive",
          duration: 6000
        });
        
        addLogEntry(combatOutcome.playerWins ? 'combat_win' : 'combat_loss', combatOutcome.narration);
        if (actualHealthLost > 0) {
          addLogEntry('health_update', `Lost ${actualHealthLost} health. ${currentStats.equippedArmor ? `(Reduced by ${currentStats.equippedArmor.protectionBonus} from armor)` : ''}`);
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
        playerStats: { ...currentStats, health: 0 }, 
        isGameOver: true,
        isLoadingNextDay: false,
        marketPrices: newMarketPrices, 
        localHeadlines: newLocalHeadlines,
      }));
      toast({ title: "Game Over", description: gameOverMsg, variant: "destructive" });
      addLogEntry('game_over', gameOverMsg);
      return; 
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
      availableWeapons: [], 
      availableArmor: [], // Reset armor
    });
    addLogEntry('info', 'Game reset.');
    fetchInitialData(); 
  }, [fetchInitialData, addLogEntry]);

  return {
    ...gameState, 
    buyDrug,
    sellDrug,
    buyWeapon,
    buyArmor, // Expose buyArmor
    handleNextDay,
    resetGame,
    travelToLocation,
    fetchHeadlinesForLocation,
  };
}
