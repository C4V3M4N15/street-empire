"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem, Weapon, Armor, HealingItem, CapacityUpgrade, EnemyStats } from '@/types/game';
import type { GameEvent } from '@/types/events';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { generateEnemyStats, getBattleResultConsequences, type BattleResult } from '@/services/combat';
import { getShopWeapons, getShopArmor, getShopHealingItems, getShopCapacityUpgrades } from '@/services/shopItems';
import { getTodaysEvents, drugCategories, resetUniqueEvents } from '@/services/eventService'; 
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 

export const NYC_LOCATIONS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const PLAYER_BASE_ATTACK = 5; 
const PLAYER_BASE_DEFENSE = 2;
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
  purchasedUpgradeIds: [],
};

const applyEventPriceModifiers = (prices: DrugPrice[], event: GameEvent | null): DrugPrice[] => {
  if (!event || !event.effects) return prices;
  
  return prices.map(dp => {
    let newPrice = dp.price;
    // Direct drug name modifier
    if (event.effects.priceModifier && event.effects.priceModifier[dp.drug]) {
      newPrice *= event.effects.priceModifier[dp.drug];
    }
    // Specific drug list modifier (legacy, can be merged into priceModifier)
    event.effects.drugPriceModifiers?.forEach(mod => {
      if (mod.drugName === dp.drug) newPrice *= mod.factor;
    });
    // Category modifiers
    event.effects.categoryPriceModifiers?.forEach(catMod => {
      const categoryDrugs = drugCategories[catMod.categoryKey] || [];
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
      availableCapacityUpgrades: [],
      activeBoroughEvents: {}, 
      boroughHeatLevels: initialHeatLevels, 
      playerActivityInBoroughsThisDay: {},
      // Battle State Init
      isBattleActive: false,
      currentEnemy: null,
      battleLog: [],
      battleMessage: null,
    };
  });

  const { toast } = useToast();

  const addLogEntry = useCallback((type: LogEventType, message: string, isBattleLog = false) => {
    const entry = { id: uuidv4(), timestamp: new Date().toISOString(), type, message };
    setGameState(prev => ({
      ...prev,
      eventLog: isBattleLog ? prev.eventLog : [entry, ...prev.eventLog].slice(0, 100),
      battleLog: isBattleLog ? [entry, ...prev.battleLog].slice(0, 20) : prev.battleLog,
    }));
  }, []);

  const applyHeadlineImpacts = useCallback((prices: DrugPrice[], headlines: LocalHeadline[]): DrugPrice[] => {
    if (!headlines || headlines.length === 0) return prices;
  
    return prices.map(drugPrice => {
      let newPrice = drugPrice.price;
      headlines.forEach(headline => {
        let applyThisHeadline = false;
        if (headline.affectedDrug && headline.affectedDrug === drugPrice.drug) {
          applyThisHeadline = true;
        } else if (headline.affectedCategories && headline.affectedCategories.length > 0) {
          for (const catKey of headline.affectedCategories) {
            const drugsInCat = drugCategories[catKey as keyof typeof drugCategories];
            if (drugsInCat?.includes(drugPrice.drug)) {
              applyThisHeadline = true;
              break;
            }
          }
        } else if (!headline.affectedDrug && (!headline.affectedCategories || headline.affectedCategories.length === 0)) {
          // General headline, applies to all if no specific drug or category is mentioned
          applyThisHeadline = true;
        }
  
        if (applyThisHeadline) {
          newPrice *= (1 + headline.priceImpact);
        }
      });
      return { ...drugPrice, price: Math.max(1, Math.round(newPrice)) };
    });
  }, []); // drugCategories is stable, so not needed in dep array if imported directly from module scope

  const fetchInitialData = useCallback(async () => {
    setGameState(prev => ({ ...prev, isLoadingMarket: true }));
    resetUniqueEvents(); 
    try {
      const [prices, headlines, weapons, armor, healingItems, capacityUpgrades, dailyEvents] = await Promise.all([
        getMarketPrices(INITIAL_PLAYER_STATS.currentLocation),
        getLocalHeadlines(INITIAL_PLAYER_STATS.currentLocation),
        getShopWeapons(),
        getShopArmor(),
        getShopHealingItems(),
        getShopCapacityUpgrades(),
        getTodaysEvents(INITIAL_PLAYER_STATS.daysPassed, gameState.boroughHeatLevels), 
      ]);
      
      let adjustedPrices = applyHeadlineImpacts(prices, headlines);
      const eventInPlayerLocation = dailyEvents[INITIAL_PLAYER_STATS.currentLocation];
      adjustedPrices = applyEventPriceModifiers(adjustedPrices, eventInPlayerLocation);
      
      const initialBoroughHeat = { ...gameState.boroughHeatLevels }; 
      for (const borough in dailyEvents) {
        const event = dailyEvents[borough];
        if (event?.effects.heatChange) {
          initialBoroughHeat[borough] = Math.max(0, Math.min(5, (initialBoroughHeat[borough] || 0) + event.effects.heatChange));
        }
         if (event) {
          const durationText = event.durationInDays && event.durationInDays > 1 ? ` (lasts ${event.durationInDays} days)` : '';
          addLogEntry('event_trigger', `Event in ${borough}: ${event.name} (${event.type}) - ${event.text}${durationText}`);
        }
      }

      setGameState(prev => ({
        ...prev,
        marketPrices: adjustedPrices,
        localHeadlines: headlines,
        availableWeapons: weapons,
        availableArmor: armor,
        availableHealingItems: healingItems,
        availableCapacityUpgrades: capacityUpgrades,
        activeBoroughEvents: dailyEvents,
        boroughHeatLevels: initialBoroughHeat,
        isLoadingMarket: false,
      }));
      addLogEntry('info', `Game started in ${INITIAL_PLAYER_STATS.currentLocation}. Market, shop, and events loaded.`);
    } catch (error) {
      console.error("Failed to fetch initial game data:", error);
      toast({ title: "Error", description: "Could not load game data.", variant: "destructive" });
      addLogEntry('info', 'Error loading initial game data.');
      setGameState(prev => ({ ...prev, isLoadingMarket: false }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, addLogEntry, applyHeadlineImpacts]);

  useEffect(() => {
    fetchInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 


  const buyDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const cost = quantity * price;
      if (quantity <= 0) { toast({ title: "Invalid Quantity", description: "Please enter a positive amount to buy.", variant: "destructive" }); return prev; }
      if (currentStats.cash < cost) { toast({ title: "Not Enough Cash", description: `You need $${cost.toLocaleString()} but only have $${currentStats.cash.toLocaleString()}.`, variant: "destructive" }); return prev; }
      const currentTotalUnits = Object.values(currentStats.inventory).reduce((sum, item) => sum + item.quantity, 0);
      if (currentTotalUnits + quantity > currentStats.maxInventoryCapacity) { toast({ title: "Not Enough Space", description: `You can only carry ${currentStats.maxInventoryCapacity - currentTotalUnits} more units.`, variant: "destructive" }); return prev; }
      const newInventory = { ...currentStats.inventory };
      const currentItem: InventoryItem = newInventory[drugName] || { quantity: 0, totalCost: 0 };
      newInventory[drugName] = { quantity: currentItem.quantity + quantity, totalCost: currentItem.totalCost + cost };
      const successMsg = `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.`;
      toast({ title: "Purchase Successful", description: successMsg }); addLogEntry('buy', successMsg);
      const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
      return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash - cost, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
    });
  }, [toast, addLogEntry]);

  const sellDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const currentItem = currentStats.inventory[drugName];
      if (!currentItem || currentItem.quantity < quantity) { toast({ title: "Not Enough Stock", description: `You only have ${currentItem?.quantity || 0} ${drugName}.`, variant: "destructive" }); return prev; }
      if (quantity <= 0) { toast({ title: "Invalid Quantity", description: "Please enter a positive amount.", variant: "destructive" }); return prev; }
      const earnings = quantity * price;
      const newInventory = { ...currentStats.inventory };
      const avgCostPerUnit = currentItem.totalCost / currentItem.quantity;
      const costOfGoodsSold = avgCostPerUnit * quantity;
      const newQuantity = currentItem.quantity - quantity;
      if (newQuantity > 0) { newInventory[drugName] = { quantity: newQuantity, totalCost: Math.max(0, currentItem.totalCost - costOfGoodsSold) }; } 
      else { delete newInventory[drugName]; }
      const successMsg = `Sold ${quantity} ${drugName} for $${earnings.toLocaleString()}.`;
      toast({ title: "Sale Successful", description: successMsg }); addLogEntry('sell', successMsg);
      const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
      return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash + earnings, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
    });
  }, [toast, addLogEntry]);

  const buyWeapon = useCallback((weaponToBuy: Weapon) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.cash < weaponToBuy.price) { toast({ title: "Not Enough Cash", variant: "destructive" }); return prev; }
      if (cs.equippedWeapon?.name === weaponToBuy.name) { toast({ title: "Already Equipped" }); return prev; }
      const msg = `Purchased ${weaponToBuy.name} for $${weaponToBuy.price.toLocaleString()}.`;
      toast({ title: "Weapon Acquired!", description: msg }); addLogEntry('shop_weapon_purchase', msg);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - weaponToBuy.price, equippedWeapon: weaponToBuy } };
    });
  }, [toast, addLogEntry]);

  const buyArmor = useCallback((armorToBuy: Armor) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.cash < armorToBuy.price) { toast({ title: "Not Enough Cash", variant: "destructive" }); return prev; }
      if (cs.equippedArmor?.name === armorToBuy.name) { toast({ title: "Already Equipped" }); return prev; }
      const msg = `Purchased ${armorToBuy.name} for $${armorToBuy.price.toLocaleString()}.`;
      toast({ title: "Armor Acquired!", description: msg }); addLogEntry('shop_armor_purchase', msg);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - armorToBuy.price, equippedArmor: armorToBuy } };
    });
  }, [toast, addLogEntry]);

  const buyHealingItem = useCallback((itemToBuy: HealingItem) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.cash < itemToBuy.price) { toast({ title: "Not Enough Cash", variant: "destructive" }); return prev; }
      if (cs.health >= MAX_PLAYER_HEALTH) { toast({ title: "Full Health" }); return prev; }
      let healthToRestore = 0;
      if (itemToBuy.isFullHeal) healthToRestore = MAX_PLAYER_HEALTH - cs.health;
      else if (itemToBuy.isPercentageHeal && itemToBuy.healAmount) healthToRestore = Math.round(MAX_PLAYER_HEALTH * (itemToBuy.healAmount / 100));
      else if (itemToBuy.healAmount) healthToRestore = itemToBuy.healAmount;
      const newHealth = Math.min(MAX_PLAYER_HEALTH, cs.health + healthToRestore);
      const healedAmount = newHealth - cs.health;
      if (healedAmount <= 0) { toast({ title: "No Effect" }); return prev; }
      const msg = `Used ${itemToBuy.name}. Healed ${healedAmount} HP.`;
      toast({ title: "Healing Applied!", description: msg }); addLogEntry('shop_healing_purchase', msg); addLogEntry('health_update', `Health +${healedAmount} to ${newHealth}.`);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - itemToBuy.price, health: newHealth } };
    });
  }, [toast, addLogEntry]);

  const buyCapacityUpgrade = useCallback((upgradeToBuy: CapacityUpgrade) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.purchasedUpgradeIds.includes(upgradeToBuy.id)) { toast({ title: "Already Owned" }); return prev; }
      if (cs.cash < upgradeToBuy.price) { toast({ title: "Not Enough Cash", variant: "destructive" }); return prev; }
      const msg = `Purchased ${upgradeToBuy.name}. Capacity +${upgradeToBuy.capacityIncrease}.`;
      toast({ title: "Upgrade Acquired!", description: msg }); addLogEntry('shop_capacity_upgrade', msg);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - upgradeToBuy.price, maxInventoryCapacity: cs.maxInventoryCapacity + upgradeToBuy.capacityIncrease, purchasedUpgradeIds: [...cs.purchasedUpgradeIds, upgradeToBuy.id] } };
    });
  }, [toast, addLogEntry]);

  const travelToLocation = useCallback((targetLocation: string) => {
    if (gameState.playerStats.currentLocation === targetLocation) { toast({ title: "Already There" }); return; }
    setGameState(prev => {
      const travelMessage = `Traveled from ${prev.playerStats.currentLocation} to ${targetLocation}.`;
      toast({ title: "Travel Successful", description: travelMessage }); addLogEntry('travel', travelMessage);
      (async () => {
        setGameState(ip => ({...ip, isLoadingMarket: true}));
        try {
          let newPrices = await getMarketPrices(targetLocation);
          const newHeadlines = await getLocalHeadlines(targetLocation);
          newPrices = applyHeadlineImpacts(newPrices, newHeadlines);
          newPrices = applyEventPriceModifiers(newPrices, prev.activeBoroughEvents[targetLocation]);
          setGameState(ip => ({ ...ip, marketPrices: newPrices, localHeadlines: newHeadlines, isLoadingMarket: false }));
          addLogEntry('info', `Market data for ${targetLocation} updated.`);
        } catch (e) { console.error(e); toast({ title: "Market Error", variant: "destructive" }); setGameState(ip => ({...ip, isLoadingMarket: false}));}
      })();
      return { ...prev, playerStats: { ...prev.playerStats, currentLocation: targetLocation }};
    });
  }, [toast, addLogEntry, gameState.playerStats.currentLocation, gameState.activeBoroughEvents, applyHeadlineImpacts]);

  const fetchHeadlinesForLocation = useCallback(async (location: string): Promise<LocalHeadline[]> => {
    try { return await getLocalHeadlines(location); } 
    catch (e) { console.error(e); toast({ title: "Headline Error", variant: "destructive" }); return []; }
  }, [toast]);

  const startBattle = useCallback((opponentType: 'police' | 'gang' | 'fiend') => {
    setGameState(prev => {
      const enemy = generateEnemyStats(opponentType, prev.playerStats);
      addLogEntry('info', `Battle started against ${enemy.name}!`);
      return {
        ...prev,
        isBattleActive: true,
        currentEnemy: enemy,
        battleLog: [{id: uuidv4(), timestamp: new Date().toISOString(), type: 'info', message: `Encountered ${enemy.name}!`}],
        battleMessage: null,
      };
    });
  }, [addLogEntry]);

  const handlePlayerBattleAction = useCallback((action: 'attack') => {
    setGameState(prev => {
      if (!prev.isBattleActive || !prev.currentEnemy || prev.battleMessage) return prev;

      let newPlayerStats = { ...prev.playerStats };
      let newEnemyStats = { ...prev.currentEnemy };
      let newBattleLog = [...prev.battleLog];
      let battleEnded = false;
      let playerWon: boolean | null = null;

      if (action === 'attack') {
        const playerAttackPower = PLAYER_BASE_ATTACK + (newPlayerStats.equippedWeapon?.damageBonus || 0);
        const playerDamage = Math.max(1, playerAttackPower - newEnemyStats.defense);
        newEnemyStats.health = Math.max(0, newEnemyStats.health - playerDamage);
        newBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `You hit ${newEnemyStats.name} for ${playerDamage} damage.`});
        if (newEnemyStats.health <= 0) { playerWon = true; battleEnded = true; }
      }
      
      if (!battleEnded) {
        const enemyAttackPower = newEnemyStats.attack;
        const playerDefensePower = PLAYER_BASE_DEFENSE + (newPlayerStats.equippedArmor?.protectionBonus || 0);
        const enemyDamage = Math.max(1, enemyAttackPower - playerDefensePower);
        newPlayerStats.health = Math.max(0, newPlayerStats.health - enemyDamage);
        newBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `${newEnemyStats.name} hits you for ${enemyDamage} damage.`});
        if (newPlayerStats.health <= 0) { playerWon = false; battleEnded = true; }
      }
      
      if (battleEnded) {
        const battleResult = getBattleResultConsequences(playerWon!, newEnemyStats, newPlayerStats);
        newPlayerStats.cash = Math.max(0, newPlayerStats.cash + battleResult.cashChange);
        newPlayerStats.reputation += battleResult.reputationChange;
        
        const generalLogType = playerWon ? 'combat_win' : 'combat_loss';
        addLogEntry(generalLogType, battleResult.narration);
        
        if (!playerWon) {
           return { ...prev, playerStats: { ...newPlayerStats, health: 0 }, currentEnemy: newEnemyStats, battleLog: newBattleLog, battleMessage: "You have been defeated!", isGameOver: true, isBattleActive: true };
        }
        return { ...prev, playerStats: newPlayerStats, currentEnemy: null, battleLog: newBattleLog, battleMessage: `You defeated ${newEnemyStats.name}!`, isBattleActive: true };
      }
      return { ...prev, playerStats: newPlayerStats, currentEnemy: newEnemyStats, battleLog: newBattleLog.slice(-20) };
    });
  }, [addLogEntry]);
  
  const endBattleScreen = useCallback(() => {
    setGameState(prev => {
      if (prev.playerStats.health <= 0 && !prev.isGameOver) {
        return { ...prev, isBattleActive: false, currentEnemy: null, battleLog: [], battleMessage: null, isGameOver: true };
      }
      return { ...prev, isBattleActive: false, currentEnemy: null, battleLog: [], battleMessage: null };
    });
  }, []);

  const handleNextDay = useCallback(async () => {
    if (gameState.isGameOver || gameState.isBattleActive) return;
    setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null }));
    
    let currentStats = { ...gameState.playerStats };
    currentStats.daysPassed += 1;
    
    // Heat update based on player activity
    let workingHeatLevels = { ...gameState.boroughHeatLevels };
    NYC_LOCATIONS.forEach(borough => {
      const activityCount = gameState.playerActivityInBoroughsThisDay[borough] || 0;
      const currentBoroughHeat = workingHeatLevels[borough] || 0;
      if (activityCount > 0) workingHeatLevels[borough] = Math.min(5, currentBoroughHeat + 1);
      else workingHeatLevels[borough] = Math.max(0, currentBoroughHeat - 1);
      if(workingHeatLevels[borough] !== currentBoroughHeat) addLogEntry('info', `${borough} heat ${workingHeatLevels[borough] > currentBoroughHeat ? '+' : '-'}1 to ${workingHeatLevels[borough]}.`);
    });
    
    // Daily events and their heat impact
    const newDailyEvents = await getTodaysEvents(currentStats.daysPassed, workingHeatLevels);
    let eventProcessedHeatLevels = { ...workingHeatLevels };
    for (const borough in newDailyEvents) { 
      const event = newDailyEvents[borough];
      if (event?.effects.heatChange) { 
        const currentEventBoroughHeat = eventProcessedHeatLevels[borough] || 0;
        const updatedHeatByEvent = Math.max(0, Math.min(5, currentEventBoroughHeat + event.effects.heatChange));
        if (updatedHeatByEvent !== currentEventBoroughHeat) addLogEntry('event_trigger', `${borough} heat: ${currentEventBoroughHeat} to ${updatedHeatByEvent} by ${event.name}.`);
        eventProcessedHeatLevels[borough] = updatedHeatByEvent;
      }
      if (event) {
        const durationText = event.durationInDays && event.durationInDays > 1 ? ` (lasts ${event.durationInDays} days)` : '';
        addLogEntry('event_trigger', `Event in ${borough}: ${event.name} (${event.type}) - ${event.text}${durationText}`);
      }
    }
    addLogEntry('info', `Day ${currentStats.daysPassed} in ${currentStats.currentLocation}. Heat: ${eventProcessedHeatLevels[currentStats.currentLocation]}.`);

    const eventInCurrentLocation = newDailyEvents[currentStats.currentLocation];
    let combatTriggeredByEvent = false;

    // Player impact from event in current location
    if (eventInCurrentLocation?.effects.playerImpact) {
      const impact = eventInCurrentLocation.effects;
      toast({ title: `Event: ${eventInCurrentLocation.name}!`, description: impact.message, duration: 5000});
      addLogEntry('event_player_impact', `${eventInCurrentLocation.name}: ${impact.message}`);
      if (impact.healthChange) { currentStats.health = Math.max(0, Math.min(MAX_PLAYER_HEALTH, currentStats.health + impact.healthChange)); addLogEntry('health_update', `Health ${impact.healthChange > 0 ? '+' : ''}${impact.healthChange}. Now ${currentStats.health}.`); }
      if (impact.cashChange) { currentStats.cash = Math.max(0, currentStats.cash + impact.cashChange); addLogEntry('info', `Cash ${impact.cashChange > 0 ? '+' : ''}$${Math.abs(impact.cashChange)}.`) }
      if (impact.reputationChange) { currentStats.reputation += impact.reputationChange; addLogEntry('info', `Reputation ${impact.reputationChange > 0 ? '+' : ''}${impact.reputationChange}.`); }
      if (currentStats.health <= 0) {
        setGameState(prev => ({ ...prev, playerStats: currentStats, isGameOver: true, isLoadingNextDay: false, activeBoroughEvents: newDailyEvents, boroughHeatLevels: eventProcessedHeatLevels, playerActivityInBoroughsThisDay: {} }));
        toast({ title: "Game Over", description: "The event was too much.", variant: "destructive" }); addLogEntry('game_over', "Succumbed to event impact.");
        return;
      }
      if (impact.triggerCombat) {
         combatTriggeredByEvent = true;
         let opponentTypeForEvent: 'police' | 'gang' | 'fiend' = 'fiend'; 
         if (impact.triggerCombat === 'police_raid') opponentTypeForEvent = 'police';
         else if (impact.triggerCombat === 'gang_activity') opponentTypeForEvent = 'gang';
         else if (impact.triggerCombat === 'fiend_encounter') opponentTypeForEvent = 'fiend'; 
         startBattle(opponentTypeForEvent);
      }
    }
    
    // Market Update
    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(currentStats.currentLocation); 
      newLocalHeadlines = await getLocalHeadlines(currentStats.currentLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
      newMarketPrices = applyEventPriceModifiers(newMarketPrices, eventInCurrentLocation); 
    } catch (e) { console.error(e); toast({ title: "Market Error", variant: "destructive" }); addLogEntry('info', "Market update failed."); }
    
    // Random Combat Encounter based on heat (if not already in combat from event)
    const heatInCurrentLocation = eventProcessedHeatLevels[currentStats.currentLocation] || 0;
    const randomEncounterChance = 0.10 + (heatInCurrentLocation * 0.08); // Base 10%, +8% per heat level

    if (!combatTriggeredByEvent && !gameState.isBattleActive && currentStats.health > 0 && Math.random() < randomEncounterChance) { 
      const opponentTypes = ["police", "gang", "fiend"] as const;
      let selectedOpponentType: 'police' | 'gang' | 'fiend';
      const randomRoll = Math.random();
      // Weighted selection based on heat
      if (randomRoll < (0.25 + heatInCurrentLocation * 0.10)) selectedOpponentType = 'police'; 
      else if (randomRoll < (0.60 + heatInCurrentLocation * 0.05)) selectedOpponentType = 'gang'; 
      else selectedOpponentType = 'fiend';
      addLogEntry('info', `Encountered ${selectedOpponentType} in ${currentStats.currentLocation}. Heat: ${heatInCurrentLocation}.`);
      startBattle(selectedOpponentType);
    }

    // Rank update (only if not in battle and game not over)
    if (!gameState.isBattleActive && currentStats.health > 0) {
      const oldRank = currentStats.rank;
      if (currentStats.cash > 50000 && currentStats.rank !== 'Kingpin') currentStats.rank = 'Kingpin';
      else if (currentStats.cash > 25000 && !['Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Baron';
      else if (currentStats.cash > 10000 && !['Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Distributor';
      else if (currentStats.cash > 5000 && !['Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Supplier';
      else if (currentStats.cash > 2000 && !['Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Dealer';
      else if (currentStats.cash > 1000 && !['Peddler', 'Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Peddler';
      if (currentStats.rank !== oldRank) { toast({title: "Rank Up!", description: `Promoted to ${currentStats.rank}!`}); addLogEntry('rank_up', `Promoted to ${currentStats.rank}!`); }
    }

    if (!gameState.isBattleActive) { // Final state update if not entering a battle
        setGameState(prev => ({
          ...prev,
          playerStats: currentStats,
          marketPrices: newMarketPrices,
          localHeadlines: newLocalHeadlines,
          activeBoroughEvents: newDailyEvents,
          boroughHeatLevels: eventProcessedHeatLevels,
          isLoadingNextDay: false,
          playerActivityInBoroughsThisDay: {}, 
        }));
    } else { // If battle started, update stats changed before battle, but keep loading
       setGameState(prev => ({
        ...prev,
        playerStats: currentStats, 
        marketPrices: newMarketPrices,
        localHeadlines: newLocalHeadlines,
        activeBoroughEvents: newDailyEvents,
        boroughHeatLevels: eventProcessedHeatLevels,
        playerActivityInBoroughsThisDay: {}, 
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [gameState.playerStats, gameState.isGameOver, gameState.isBattleActive, gameState.boroughHeatLevels, gameState.activeBoroughEvents, gameState.playerActivityInBoroughsThisDay, toast, addLogEntry, startBattle, applyHeadlineImpacts]);

  const resetGame = useCallback(() => {
     const initialHeatLevelsReset: Record<string, number> = {};
     NYC_LOCATIONS.forEach(loc => initialHeatLevelsReset[loc] = 0);
    setGameState({
      playerStats: INITIAL_PLAYER_STATS,
      marketPrices: [], localHeadlines: [], eventLog: [],
      isLoadingNextDay: false, isLoadingMarket: true, isGameOver: false, gameMessage: null,
      availableWeapons: [], availableArmor: [], availableHealingItems: [], availableCapacityUpgrades: [],
      activeBoroughEvents: {}, boroughHeatLevels: initialHeatLevelsReset, playerActivityInBoroughsThisDay: {},
      isBattleActive: false, currentEnemy: null, battleLog: [], battleMessage: null,
    });
    addLogEntry('info', 'Game reset.');
    fetchInitialData(); 
  }, [fetchInitialData, addLogEntry]);

  return {
    ...gameState,
    buyDrug, sellDrug, buyWeapon, buyArmor, buyHealingItem, buyCapacityUpgrade,
    handleNextDay, resetGame, travelToLocation, fetchHeadlinesForLocation,
    startBattle, handlePlayerBattleAction, endBattleScreen,
  };
}