"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem, Weapon, Armor, HealingItem } from '@/types/game';
import type { GameEvent } from '@/types/events';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { simulateCombat, type CombatOutcome } from '@/services/combat';
import { getShopWeapons, getShopArmor, getShopHealingItems } from '@/services/shopItems';
import { getTodaysEvents, drugCategories as eventDrugCategories } from '@/services/eventService'; // Import event service
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; // For generating unique log entry IDs

export const NYC_LOCATIONS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const PLAYER_BASE_DAMAGE = 1; 
const PLAYER_BASE_PROTECTION = 0; 
const MAX_PLAYER_HEALTH = 100;

const INITIAL_PLAYER_STATS: PlayerStats = {
  name: 'Player1',
  health: MAX_PLAYER_HEALTH,
  cash: 1000,
  inventory: {},
  reputation: 0,
  daysPassed: 0,
  currentLocation: NYC_LOCATIONS[0], 
  rank: 'Rookie',
  maxInventoryCapacity: 10, 
  equippedWeapon: null, 
  equippedArmor: null, 
};

// Helper function to apply event-based price modifiers
const applyEventPriceModifiers = (prices: DrugPrice[], event: GameEvent | null): DrugPrice[] => {
  if (!event || !event.effects) return prices;

  return prices.map(dp => {
    let newPrice = dp.price;

    // Apply drug-specific modifiers from event
    event.effects.drugPriceModifiers?.forEach(mod => {
      if (mod.drugName === dp.drug) {
        newPrice *= mod.factor;
      }
    });

    // Apply category-specific modifiers from event
    event.effects.categoryPriceModifiers?.forEach(catMod => {
      // Ensure eventDrugCategories.all is populated if used by an event
      const categoryDrugs = catMod.category === eventDrugCategories.all 
        ? eventDrugCategories.all 
        : (eventDrugCategories[catMod.category as keyof typeof eventDrugCategories] || []);
      
      if (categoryDrugs.includes(dp.drug)) {
        newPrice *= catMod.factor;
      }
    });
    return { ...dp, price: Math.max(1, Math.round(newPrice)) };
  });
};


export function useGameLogic() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialHeatLevels: Record<string, number> = {};
    NYC_LOCATIONS.forEach(loc => initialHeatLevels[loc] = 0);
    return {
      playerStats: INITIAL_PLAYER_STATS,
      marketPrices: [],
      localHeadlines: [],
      eventLog: [],
      isLoadingNextDay: false,
      isLoadingMarket: true,
      isGameOver: false,
      gameMessage: null,
      availableWeapons: [],
      availableArmor: [],
      availableHealingItems: [],
      activeBoroughEvents: {}, // Initialize empty
      boroughHeatLevels: initialHeatLevels, // Initialize with 0 for all boroughs
    };
  });

  const { toast } = useToast();

  const addLogEntry = useCallback((type: LogEventType, message: string) => {
    setGameState(prev => ({
      ...prev,
      eventLog: [{ id: uuidv4(), timestamp: new Date().toISOString(), type, message }, ...prev.eventLog].slice(0, 50) 
    }));
  }, []);

  const fetchInitialData = useCallback(async () => {
    setGameState(prev => ({ ...prev, isLoadingMarket: true }));
    try {
      const [prices, headlines, weapons, armor, healingItems, dailyEvents] = await Promise.all([
        getMarketPrices(INITIAL_PLAYER_STATS.currentLocation),
        getLocalHeadlines(INITIAL_PLAYER_STATS.currentLocation),
        getShopWeapons(),
        getShopArmor(),
        getShopHealingItems(),
        getTodaysEvents(), // Fetch initial day's events
      ]);
      
      let adjustedPrices = applyHeadlineImpacts(prices, headlines);
      const eventInPlayerLocation = dailyEvents[INITIAL_PLAYER_STATS.currentLocation];
      adjustedPrices = applyEventPriceModifiers(adjustedPrices, eventInPlayerLocation);
      
      const newHeatLevels = { ...gameState.boroughHeatLevels };
      for (const borough in dailyEvents) {
        const event = dailyEvents[borough];
        if (event?.effects.heatChange) {
          newHeatLevels[borough] = Math.max(0, (newHeatLevels[borough] || 0) + event.effects.heatChange);
        }
         if (event) {
          addLogEntry('event_trigger', `Event in ${borough}: ${event.name} - ${event.description}`);
        }
      }

      setGameState(prev => ({
        ...prev,
        marketPrices: adjustedPrices,
        localHeadlines: headlines,
        availableWeapons: weapons,
        availableArmor: armor,
        availableHealingItems: healingItems,
        activeBoroughEvents: dailyEvents,
        boroughHeatLevels: newHeatLevels,
        isLoadingMarket: false,
      }));
      addLogEntry('info', `Game started in ${INITIAL_PLAYER_STATS.currentLocation}. Market, shop, and events loaded.`);
    } catch (error) {
      console.error("Failed to fetch initial game data:", error);
      toast({ title: "Error", description: "Could not load game data.", variant: "destructive" });
      addLogEntry('info', 'Error loading initial game data.');
      setGameState(prev => ({ ...prev, isLoadingMarket: false }));
    }
  }, [toast, addLogEntry, gameState.boroughHeatLevels]); // Added gameState.boroughHeatLevels to dependencies

  useEffect(() => {
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // fetchInitialData is memoized, direct call in useEffect is fine.

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
      
      const successMsg = `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.`;
      toast({ title: "Purchase Successful", description: successMsg, variant: "default"});
      addLogEntry('buy', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          inventory: newInventory,
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
      
      const successMsg = `Sold ${quantity} ${drugName} for $${earnings.toLocaleString()}.`;
      toast({ title: "Sale Successful", description: successMsg, variant: "default" });
      addLogEntry('sell', successMsg);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          inventory: newInventory,
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

  const buyHealingItem = useCallback((itemToBuy: HealingItem) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      if (currentStats.cash < itemToBuy.price) {
        toast({ title: "Not Enough Cash", description: `You need $${itemToBuy.price.toLocaleString()} for ${itemToBuy.name}.`, variant: "destructive" });
        return prev;
      }

      if (currentStats.health >= MAX_PLAYER_HEALTH) {
        toast({ title: "Full Health", description: "You are already at full health.", variant: "default" });
        return prev;
      }

      let healthToRestore = 0;
      if (itemToBuy.isFullHeal) {
        healthToRestore = MAX_PLAYER_HEALTH - currentStats.health;
      } else if (itemToBuy.isPercentageHeal && itemToBuy.healAmount) {
        healthToRestore = Math.round(MAX_PLAYER_HEALTH * (itemToBuy.healAmount / 100));
      } else if (itemToBuy.healAmount) { 
         healthToRestore = itemToBuy.healAmount;
      }
      
      const newHealth = Math.min(MAX_PLAYER_HEALTH, currentStats.health + healthToRestore);
      const healedAmount = newHealth - currentStats.health;

      if (healedAmount <= 0) {
         toast({ title: "No Effect", description: `${itemToBuy.name} would provide no significant healing at your current health.`, variant: "default" });
         return prev;
      }

      const newCash = currentStats.cash - itemToBuy.price;
      const successMsg = `Used ${itemToBuy.name} for $${itemToBuy.price.toLocaleString()}. Healed ${healedAmount} HP.`;
      toast({ title: "Healing Applied!", description: successMsg });
      addLogEntry('shop_healing_purchase', successMsg);
      addLogEntry('health_update', `Health increased by ${healedAmount} to ${newHealth}.`);

      return {
        ...prev,
        playerStats: {
          ...currentStats,
          cash: newCash,
          health: newHealth,
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
        
        // IMPORTANT: Re-fetch market prices and headlines for the new location
        // This assumes getMarketPrices and getLocalHeadlines can be called immediately
        // For a smoother UX, consider an isLoading state for travel if fetches are slow.
        (async () => {
          setGameState(innerPrev => ({...innerPrev, isLoadingMarket: true}));
          try {
            let newPrices = await getMarketPrices(targetLocation);
            const newHeadlines = await getLocalHeadlines(targetLocation);
            
            newPrices = applyHeadlineImpacts(newPrices, newHeadlines);
            const eventInNewLocation = prev.activeBoroughEvents[targetLocation]; // Use current day's event for new location
            newPrices = applyEventPriceModifiers(newPrices, eventInNewLocation);

            setGameState(innerPrev => ({
              ...innerPrev,
              marketPrices: newPrices,
              localHeadlines: newHeadlines,
              isLoadingMarket: false,
            }));
             addLogEntry('info', `Market data updated for ${targetLocation}.`);
          } catch (error) {
            console.error("Error fetching market data after travel:", error);
            toast({ title: "Market Error", description: `Could not load market data for ${targetLocation}.`, variant: "destructive" });
            setGameState(innerPrev => ({...innerPrev, isLoadingMarket: false}));
          }
        })();

        return {
            ...prev,
            playerStats: {
                ...prev.playerStats,
                currentLocation: targetLocation,
            },
        };
    });
  }, [toast, addLogEntry, gameState.playerStats.currentLocation, gameState.activeBoroughEvents]);

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
    
    // Fetch new daily events for all boroughs
    const newDailyEvents = await getTodaysEvents();
    const newHeatLevels = { ...gameState.boroughHeatLevels };

    for (const borough in newDailyEvents) {
      const event = newDailyEvents[borough];
      if (event?.effects.heatChange) {
        newHeatLevels[borough] = Math.max(0, (newHeatLevels[borough] || 0) + event.effects.heatChange);
      }
      if (event) { // Log all active events for the day
        addLogEntry('event_trigger', `Today in ${borough}: ${event.name} - ${event.description}`);
      }
    }
    addLogEntry('info', `Day ${currentStats.daysPassed} begins in ${currentStats.currentLocation}. Heat: ${newHeatLevels[currentStats.currentLocation]}.`);


    // Apply player impact if an event in the current location has one
    const eventInCurrentLocation = newDailyEvents[currentStats.currentLocation];
    if (eventInCurrentLocation?.effects.playerImpact) {
      const impact = eventInCurrentLocation.effects.playerImpact;
      toast({ title: "Event!", description: `${eventInCurrentLocation.name}: ${impact.message}`, duration: 5000});
      addLogEntry('event_player_impact', `${eventInCurrentLocation.name}: ${impact.message}`);

      if (impact.healthChange) {
        currentStats.health = Math.max(0, Math.min(MAX_PLAYER_HEALTH, currentStats.health + impact.healthChange));
        addLogEntry('health_update', `Health ${impact.healthChange > 0 ? 'increased' : 'decreased'} by ${Math.abs(impact.healthChange)} due to event. Now ${currentStats.health}.`);
      }
      if (impact.cashChange) {
        currentStats.cash = Math.max(0, currentStats.cash + impact.cashChange);
        addLogEntry('info', `Cash ${impact.cashChange > 0 ? 'increased' : 'decreased'} by $${Math.abs(impact.cashChange).toLocaleString()} due to event.`);
      }
      if (impact.reputationChange) { // If reputation system is used more broadly
        currentStats.reputation += impact.reputationChange;
        addLogEntry('info', `Reputation changed by ${impact.reputationChange} due to event.`);
      }
      if (currentStats.health <= 0) {
        // Game over from event direct damage
        setGameState(prev => ({ ...prev, playerStats: currentStats, isGameOver: true, isLoadingNextDay: false, activeBoroughEvents: newDailyEvents, boroughHeatLevels: newHeatLevels }));
        toast({ title: "Game Over", description: "The event was too much for you.", variant: "destructive" });
        addLogEntry('game_over', "Succumbed to an event's direct impact. Game Over.");
        return;
      }
      // Handle combat triggered by event
      if (impact.triggerCombat) {
         let opponentTypeForEvent: 'police' | 'gang' | 'fiend' = 'fiend'; // Default
         if (impact.triggerCombat === 'police_raid') opponentTypeForEvent = 'police';
         else if (impact.triggerCombat === 'gang_activity') opponentTypeForEvent = 'gang';
         // simulate combat here based on opponentTypeForEvent and currentStats
          try {
            const combatOutcome: CombatOutcome = await simulateCombat(opponentTypeForEvent, currentStats);
            let actualHealthLost = combatOutcome.healthLost;
            if (currentStats.equippedArmor) {
                actualHealthLost = Math.max(0, combatOutcome.healthLost - currentStats.equippedArmor.protectionBonus);
            }
            
            currentStats.health -= actualHealthLost;
            currentStats.cash += combatOutcome.cashChange;
            currentStats.reputation += combatOutcome.reputationChange; 

            currentStats.health = Math.max(0, currentStats.health);
            currentStats.cash = Math.max(0, currentStats.cash);

            toast({ title: combatOutcome.playerWins ? "Event Survived!" : "Event Trouble!", description: combatOutcome.narration, variant: combatOutcome.playerWins ? "default" : "destructive", duration: 6000 });
            addLogEntry(combatOutcome.playerWins ? 'combat_win' : 'combat_loss', `Event Combat (${opponentTypeForEvent}): ${combatOutcome.narration}`);
            // Further logging for health/cash/rep changes from this combat...
             if (currentStats.health <= 0) { /* Game over check after event combat */ }
          } catch (error) { /* Error handling for event combat */ }
      }
    }
    
    // Market Update using new events
    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(currentStats.currentLocation);
      newLocalHeadlines = await getLocalHeadlines(currentStats.currentLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
      newMarketPrices = applyEventPriceModifiers(newMarketPrices, eventInCurrentLocation); // Apply event modifiers
    } catch (error) {
      console.error("Failed to fetch market data for next day:", error);
      const marketErrorMsg = "Could not update market data.";
      toast({ title: "Market Error", description: marketErrorMsg, variant: "destructive" });
      addLogEntry('info', marketErrorMsg);
    }
    
    // Generic Random Encounter (if not already handled by a specific event combat)
    // Could add a condition here to skip if eventInCurrentLocation.effects.playerImpact?.triggerCombat already happened.
    // For now, both can occur, which might be intense.
    if (Math.random() < 0.3 && !eventInCurrentLocation?.effects.playerImpact?.triggerCombat) { 
      const opponentTypes = ["police", "gang", "fiend"] as const;
      const opponentType = opponentTypes[Math.floor(Math.random() * opponentTypes.length)];
      const encounterMsg = `You've run into ${opponentType === 'police' ? 'the police' : opponentType === 'gang' ? 'a rival gang' : 'a desperate fiend'} in ${currentStats.currentLocation}!`;
      toast({ title: "Encounter!", description: encounterMsg, duration: 4000 });
      addLogEntry('info', encounterMsg);
      
      try {
        const combatOutcome: CombatOutcome = await simulateCombat(opponentType, currentStats);
        
        let actualHealthLost = combatOutcome.healthLost;
        if (currentStats.equippedArmor) {
            actualHealthLost = Math.max(0, combatOutcome.healthLost - currentStats.equippedArmor.protectionBonus);
        }
        
        currentStats.health -= actualHealthLost;
        currentStats.cash += combatOutcome.cashChange;
        currentStats.reputation += combatOutcome.reputationChange;

        currentStats.health = Math.max(0, currentStats.health);
        currentStats.cash = Math.max(0, currentStats.cash);

        toast({ title: combatOutcome.playerWins ? "Victory!" : "Defeat!", description: combatOutcome.narration, variant: combatOutcome.playerWins ? "default" : "destructive", duration: 6000 });
        addLogEntry(combatOutcome.playerWins ? 'combat_win' : 'combat_loss', combatOutcome.narration);
        if (actualHealthLost > 0) addLogEntry('health_update', `Lost ${actualHealthLost} health. ${currentStats.equippedArmor ? `(Armor reduced by ${currentStats.equippedArmor.protectionBonus})` : ''}`);
        if (combatOutcome.cashChange !== 0) addLogEntry('info', `${combatOutcome.cashChange > 0 ? 'Gained' : 'Lost'} $${Math.abs(combatOutcome.cashChange).toLocaleString()}.`);
        if (combatOutcome.reputationChange !== 0) addLogEntry('info', `Reputation changed by ${combatOutcome.reputationChange}.`);

      } catch (error) { /* Error handling for generic combat */ }
    }

    if (currentStats.health <= 0) {
      const gameOverMsg = "Your health reached 0. Game Over.";
      setGameState(prev => ({ ...prev, playerStats: { ...currentStats, health: 0 }, isGameOver: true, isLoadingNextDay: false, marketPrices: newMarketPrices, localHeadlines: newLocalHeadlines, activeBoroughEvents: newDailyEvents, boroughHeatLevels: newHeatLevels, }));
      toast({ title: "Game Over", description: gameOverMsg, variant: "destructive" });
      addLogEntry('game_over', gameOverMsg);
      return;
    }
    
    const oldRank = currentStats.rank;
    if (currentStats.cash > 50000 && currentStats.rank !== 'Kingpin') currentStats.rank = 'Kingpin';
    else if (currentStats.cash > 25000 && !['Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Baron';
    else if (currentStats.cash > 10000 && !['Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Distributor';
    else if (currentStats.cash > 5000 && !['Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Supplier';
    else if (currentStats.cash > 2000 && !['Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Dealer';
    else if (currentStats.cash > 1000 && !['Peddler', 'Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Peddler';
    
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
      activeBoroughEvents: newDailyEvents,
      boroughHeatLevels: newHeatLevels,
      isLoadingNextDay: false,
    }));

  }, [gameState.playerStats, gameState.isGameOver, gameState.boroughHeatLevels, gameState.activeBoroughEvents, toast, addLogEntry]);

  const resetGame = useCallback(() => {
     const initialHeatLevelsReset: Record<string, number> = {};
     NYC_LOCATIONS.forEach(loc => initialHeatLevelsReset[loc] = 0);
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
      availableArmor: [],
      availableHealingItems: [],
      activeBoroughEvents: {},
      boroughHeatLevels: initialHeatLevelsReset,
    });
    addLogEntry('info', 'Game reset.');
    fetchInitialData(); // This will also fetch initial events
  }, [fetchInitialData, addLogEntry]);

  return {
    ...gameState,
    buyDrug,
    sellDrug,
    buyWeapon,
    buyArmor,
    buyHealingItem,
    handleNextDay,
    resetGame,
    travelToLocation,
    fetchHeadlinesForLocation,
  };
}