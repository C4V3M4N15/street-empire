"use client";

import { useState, useCallback, useEffect } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem, Weapon, Armor, HealingItem, CapacityUpgrade, EnemyStats } from '@/types/game';
import type { GameEvent } from '@/types/events';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline } from '@/services/market';
import { generateEnemyStats, getBattleResultConsequences, type BattleResult } from '@/services/combat';
import { getShopWeapons, getShopArmor, getShopHealingItems, getShopCapacityUpgrades, AVAILABLE_ARMOR } from '@/services/shopItems'; // Import AVAILABLE_ARMOR
import { getTodaysEvents, drugCategories, resetUniqueEvents } from '@/services/eventService'; 
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid'; 

export const NYC_LOCATIONS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const PLAYER_BASE_ATTACK = 5; 
const PLAYER_BASE_DEFENSE = 2;
const MAX_PLAYER_HEALTH = 100;

// Combat constants
const MISS_CHANCE = 0.15; 
const CRITICAL_HIT_CHANCE = 0.10; 
const CRITICAL_HIT_MULTIPLIER = 1.5; 
const FLEE_CHANCE_BASE = 0.33; 
const ENEMY_INITIATIVE_CHANCE = 0.30; // 30% chance enemy attacks first

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
  purchasedArmorIds: [],
};

const applyEventPriceModifiers = (prices: DrugPrice[], event: GameEvent | null): DrugPrice[] => {
  if (!event || !event.effects) return prices;
  
  return prices.map(dp => {
    let newPrice = dp.price;
    if (event.effects.priceModifier && event.effects.priceModifier[dp.drug]) {
      newPrice *= event.effects.priceModifier[dp.drug];
    }
    event.effects.drugPriceModifiers?.forEach(mod => {
      if (mod.drugName === dp.drug) newPrice *= mod.factor;
    });
    event.effects.categoryPriceModifiers?.forEach(catMod => {
      const categoryDrugs = drugCategories[catMod.categoryKey as keyof typeof drugCategories];
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
          applyThisHeadline = true;
        }
  
        if (applyThisHeadline) {
          newPrice *= (1 + headline.priceImpact);
        }
      });
      return { ...drugPrice, price: Math.max(1, Math.round(newPrice)) };
    });
  }, []); 

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
      if (toast) { // Ensure toast is available
        setTimeout(() => toast({ title: "Error", description: "Could not load game data.", variant: "destructive" }), 0);
      }
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
      if (quantity <= 0) { 
        if (toast) setTimeout(() => toast({ title: "Invalid Quantity", description: "Please enter a positive amount to buy.", variant: "destructive" }), 0); 
        return prev; 
      }
      if (currentStats.cash < cost) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Cash", description: `You need $${cost.toLocaleString()} but only have $${currentStats.cash.toLocaleString()}.`, variant: "destructive" }), 0); 
        return prev; 
      }
      const currentTotalUnits = Object.values(currentStats.inventory).reduce((sum, item) => sum + item.quantity, 0);
      if (currentTotalUnits + quantity > currentStats.maxInventoryCapacity) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Space", description: `You can only carry ${currentStats.maxInventoryCapacity - currentTotalUnits} more units.`, variant: "destructive" }), 0); 
        return prev; 
      }
      const newInventory = { ...currentStats.inventory };
      const currentItem: InventoryItem = newInventory[drugName] || { quantity: 0, totalCost: 0 };
      newInventory[drugName] = { quantity: currentItem.quantity + quantity, totalCost: currentItem.totalCost + cost };
      const successMsg = `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.`;
      if (toast) setTimeout(() => toast({ title: "Purchase Successful", description: successMsg }), 0); 
      addLogEntry('buy', successMsg);
      const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
      return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash - cost, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
    });
  }, [toast, addLogEntry]);

  const sellDrug = useCallback((drugName: string, quantity: number, price: number) => {
    setGameState(prev => {
      const currentStats = prev.playerStats;
      const currentItem = currentStats.inventory[drugName];
      if (quantity <= 0) { 
        if (toast) setTimeout(() => toast({ title: "Invalid Quantity", description: "Please enter a positive amount.", variant: "destructive" }), 0); 
        return prev; 
      }
      if (!currentItem || currentItem.quantity < quantity) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Stock", description: `You only have ${currentItem?.quantity || 0} ${drugName}.`, variant: "destructive" }), 0); 
        return prev; 
      }
      
      const earnings = quantity * price;
      const newInventory = { ...currentStats.inventory };
      
      const avgCostPerUnit = currentItem.quantity > 0 ? (currentItem.totalCost / currentItem.quantity) : 0;
      const costOfGoodsSold = avgCostPerUnit * quantity;
      
      const newQuantity = currentItem.quantity - quantity;

      if (newQuantity > 0) { 
        newInventory[drugName] = { 
          quantity: newQuantity, 
          totalCost: Math.max(0, currentItem.totalCost - costOfGoodsSold) 
        }; 
      } else { 
        delete newInventory[drugName]; 
      }
      const successMsg = `Sold ${quantity} ${drugName} for $${earnings.toLocaleString()}.`;
      if (toast) setTimeout(() => toast({ title: "Sale Successful", description: successMsg }), 0); 
      addLogEntry('sell', successMsg);
      const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
      return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash + earnings, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
    });
  }, [toast, addLogEntry]);

  const buyWeapon = useCallback((weaponToBuy: Weapon) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.cash < weaponToBuy.price) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0); 
        return prev; 
      }
      if (cs.equippedWeapon?.name === weaponToBuy.name) { 
        if (toast) setTimeout(() => toast({ title: "Already Equipped" }), 0); 
        return prev; 
      }
      const msg = `Purchased ${weaponToBuy.name} for $${weaponToBuy.price.toLocaleString()}.`;
      if (toast) setTimeout(() => toast({ title: "Weapon Acquired!", description: msg }), 0); 
      addLogEntry('shop_weapon_purchase', msg);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - weaponToBuy.price, equippedWeapon: weaponToBuy } };
    });
  }, [toast, addLogEntry]);

  const buyArmor = useCallback((armorToBuy: Armor) => {
    setGameState(prev => {
      const cs = prev.playerStats;

      if (cs.purchasedArmorIds.includes(armorToBuy.id)) {
        if (toast) setTimeout(() => toast({ title: "Already Owned", description: `You already own ${armorToBuy.name}.` }), 0);
        return prev;
      }
      if (cs.cash < armorToBuy.price) {
        if (toast) setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0);
        return prev;
      }

      const newPlayerStats = {
        ...cs,
        cash: cs.cash - armorToBuy.price,
        purchasedArmorIds: [...cs.purchasedArmorIds, armorToBuy.id],
      };

      let bestOwnedArmor: Armor | null = null;
      if (newPlayerStats.purchasedArmorIds.length > 0) {
        const ownedArmors = prev.availableArmor.filter(a => newPlayerStats.purchasedArmorIds.includes(a.id));
        if (ownedArmors.length > 0) {
          bestOwnedArmor = ownedArmors.reduce((best, current) =>
            current.protectionBonus > best.protectionBonus ? current : best
          );
        }
      }
      newPlayerStats.equippedArmor = bestOwnedArmor;

      const msg = `Purchased ${armorToBuy.name} for $${armorToBuy.price.toLocaleString()}. Protection is now ${newPlayerStats.equippedArmor?.protectionBonus || PLAYER_BASE_DEFENSE}.`;
      if (toast) setTimeout(() => toast({ title: "Armor Acquired!", description: msg }), 0);
      addLogEntry('shop_armor_purchase', msg);

      return { ...prev, playerStats: newPlayerStats };
    });
  }, [toast, addLogEntry]);


  const buyHealingItem = useCallback((itemToBuy: HealingItem) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.cash < itemToBuy.price) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0); 
        return prev; 
      }
      if (cs.health >= MAX_PLAYER_HEALTH) { 
        if (toast) setTimeout(() => toast({ title: "Full Health", description: "You are already at maximum health." }), 0); 
        return prev; 
      }
      
      let healthToRestore = 0;
      if (itemToBuy.isFullHeal) {
        healthToRestore = MAX_PLAYER_HEALTH - cs.health;
      } else if (itemToBuy.isPercentageHeal && typeof itemToBuy.healAmount === 'number') {
        healthToRestore = Math.round(MAX_PLAYER_HEALTH * (itemToBuy.healAmount / 100));
      } else if (typeof itemToBuy.healAmount === 'number') {
        healthToRestore = itemToBuy.healAmount;
      }
      
      const newHealth = Math.min(MAX_PLAYER_HEALTH, cs.health + healthToRestore);
      const healedAmount = newHealth - cs.health;

      if (healedAmount <= 0) { 
        if (toast) setTimeout(() => toast({ title: "No Effect", description: "This item provided no additional healing." }), 0); 
        return prev; 
      }
      
      const msg = `Used ${itemToBuy.name}. Healed ${healedAmount} HP.`;
      if (toast) setTimeout(() => toast({ title: "Healing Applied!", description: msg }), 0); 
      addLogEntry('shop_healing_purchase', msg); 
      addLogEntry('health_update', `Health +${healedAmount} to ${newHealth}.`);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - itemToBuy.price, health: newHealth } };
    });
  }, [toast, addLogEntry]);

  const buyCapacityUpgrade = useCallback((upgradeToBuy: CapacityUpgrade) => {
    setGameState(prev => {
      const cs = prev.playerStats;
      if (cs.purchasedUpgradeIds.includes(upgradeToBuy.id)) { 
        if (toast) setTimeout(() => toast({ title: "Already Owned" }), 0); 
        return prev; 
      }
      if (cs.cash < upgradeToBuy.price) { 
        if (toast) setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0); 
        return prev; 
      }
      const msg = `Purchased ${upgradeToBuy.name}. Capacity +${upgradeToBuy.capacityIncrease}.`;
      if (toast) setTimeout(() => toast({ title: "Upgrade Acquired!", description: msg }), 0); 
      addLogEntry('shop_capacity_upgrade', msg);
      return { ...prev, playerStats: { ...cs, cash: cs.cash - upgradeToBuy.price, maxInventoryCapacity: cs.maxInventoryCapacity + upgradeToBuy.capacityIncrease, purchasedUpgradeIds: [...cs.purchasedUpgradeIds, upgradeToBuy.id] } };
    });
  }, [toast, addLogEntry]);

  const travelToLocation = useCallback(async (targetLocation: string) => {
    const currentLoc = gameState.playerStats.currentLocation;
    if (currentLoc === targetLocation) { 
      if (toast) setTimeout(() => toast({ title: "Already There", description: `You are already in ${targetLocation}.` }), 0); 
      return; 
    }

    const travelMessage = `Traveled from ${currentLoc} to ${targetLocation}.`;
    addLogEntry('travel', travelMessage);
    if (toast) setTimeout(() => toast({ title: "Travel Successful", description: travelMessage }), 0);

    setGameState(prev => ({
      ...prev,
      playerStats: { ...prev.playerStats, currentLocation: targetLocation },
      isLoadingMarket: true,
      localHeadlines: [], 
      marketPrices: [],   
    }));

    try {
      const newPrices = await getMarketPrices(targetLocation);
      const newHeadlines = await getLocalHeadlines(targetLocation);
      
      const currentActiveEvents = gameState.activeBoroughEvents; 
      
      let finalPrices = applyHeadlineImpacts(newPrices, newHeadlines);
      finalPrices = applyEventPriceModifiers(finalPrices, currentActiveEvents[targetLocation]);
      
      setGameState(prev => ({ 
        ...prev, 
        marketPrices: finalPrices, 
        localHeadlines: newHeadlines, 
        isLoadingMarket: false 
      }));
      addLogEntry('info', `Market data for ${targetLocation} updated.`);
    } catch (e) { 
      console.error("Market fetch error during travel:", e); 
      if (toast) setTimeout(() => toast({ title: "Market Error", description: `Could not load market data for ${targetLocation}.`, variant: "destructive" }), 0);
      setGameState(prev => ({...prev, isLoadingMarket: false}));
    }
  }, [toast, addLogEntry, gameState.playerStats.currentLocation, gameState.activeBoroughEvents, applyHeadlineImpacts, applyEventPriceModifiers]); 

  const fetchHeadlinesForLocation = useCallback(async (location: string): Promise<LocalHeadline[]> => {
    try { return await getLocalHeadlines(location); } 
    catch (e) { 
      console.error(e); 
      if (toast) setTimeout(() => toast({ title: "Headline Error", variant: "destructive" }), 0); 
      return []; 
    }
  }, [toast]);

  const startBattle = useCallback((opponentType: 'police' | 'gang' | 'fiend') => {
    setGameState(prev => {
      if (prev.isBattleActive) return prev; 

      const enemy = generateEnemyStats(opponentType, prev.playerStats);
      let initialBattleLog: LogEntry[] = [{id: uuidv4(), timestamp: new Date().toISOString(), type: 'info', message: `Encountered ${enemy.name}!`}]
      let updatedPlayerStats = { ...prev.playerStats };

      // Enemy Initiative Check
      if (Math.random() < ENEMY_INITIATIVE_CHANCE) {
        initialBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `${enemy.name} attacks first!`});
        if (Math.random() < MISS_CHANCE) {
            initialBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `${enemy.name} tries to attack you, but misses!`});
        } else {
            const enemyAttackPower = enemy.attack;
            const playerDefensePower = PLAYER_BASE_DEFENSE + (updatedPlayerStats.equippedArmor?.protectionBonus || 0);
            let enemyDamage = Math.max(1, enemyAttackPower - playerDefensePower);
            const isEnemyCrit = Math.random() < CRITICAL_HIT_CHANCE;
            if (isEnemyCrit) {
                enemyDamage = Math.round(enemyDamage * CRITICAL_HIT_MULTIPLIER);
                initialBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `CRITICAL HIT! ${enemy.name} strikes you for ${enemyDamage} damage!`});
            } else {
                initialBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: `${enemy.name} hits you for ${enemyDamage} damage.`});
            }
            updatedPlayerStats.health = Math.max(0, updatedPlayerStats.health - enemyDamage);
            addLogEntry('health_update', `Health -${enemyDamage} to ${updatedPlayerStats.health} from ${enemy.name}'s initiative attack.`, true);
        }
      }
      
      addLogEntry('info', `Battle started against ${enemy.name}! Player health: ${updatedPlayerStats.health}`, true);
      if (updatedPlayerStats.health <=0 && !prev.isGameOver) {
         // Game over from initiative attack
         return {
          ...prev,
          playerStats: updatedPlayerStats,
          isBattleActive: true, // Will show battle screen briefly then game over dialog
          currentEnemy: enemy,
          battleLog: initialBattleLog,
          battleMessage: `You were defeated by ${enemy.name} before you could react!`,
          isGameOver: true
        };
      }

      return {
        ...prev,
        playerStats: updatedPlayerStats,
        isBattleActive: true,
        currentEnemy: enemy,
        battleLog: initialBattleLog,
        battleMessage: null,
      };
    });
  }, [addLogEntry]);

  const handlePlayerBattleAction = useCallback((action: 'attack' | 'flee') => {
    setGameState(prev => {
      if (!prev.isBattleActive || !prev.currentEnemy || prev.battleMessage) return prev;

      let newPlayerStats = { ...prev.playerStats };
      let newEnemyStats = { ...prev.currentEnemy };
      let newBattleLog = [...prev.battleLog];
      let battleEnded = false;
      let playerWon: boolean | null = null;
      let finalBattleMessage = "";

      const addBattleLog = (msg: string) => {
        newBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type: 'battle_action', message: msg});
      };
      
      const playerEffectiveAttack = PLAYER_BASE_ATTACK + (newPlayerStats.equippedWeapon?.damageBonus || 0);
      const playerEffectiveDefense = PLAYER_BASE_DEFENSE + (newPlayerStats.equippedArmor?.protectionBonus || 0);


      if (action === 'attack') {
        if (Math.random() < MISS_CHANCE) {
          addBattleLog(`You try to attack ${newEnemyStats.name}, but miss!`);
        } else {
          let playerDamage = Math.max(1, playerEffectiveAttack - newEnemyStats.defense);
          const isCrit = Math.random() < CRITICAL_HIT_CHANCE;
          if (isCrit) {
            playerDamage = Math.round(playerDamage * CRITICAL_HIT_MULTIPLIER);
            addBattleLog(`CRITICAL HIT! You strike ${newEnemyStats.name} for ${playerDamage} damage!`);
          } else {
            addBattleLog(`You hit ${newEnemyStats.name} for ${playerDamage} damage.`);
          }
          newEnemyStats.health = Math.max(0, newEnemyStats.health - playerDamage);
          if (newEnemyStats.health <= 0) { playerWon = true; battleEnded = true; }
        }
      } else if (action === 'flee') {
        let actualFleeChance = FLEE_CHANCE_BASE;
        if (newPlayerStats.health < MAX_PLAYER_HEALTH * 0.3) actualFleeChance += 0.25; // Increased chance if health is low
        const enemyStrength = newEnemyStats.attack + newEnemyStats.defense;
        const playerStrength = playerEffectiveAttack + playerEffectiveDefense;
        if (enemyStrength > playerStrength * 1.2) actualFleeChance += 0.15; // Increased chance if enemy is much stronger
        
        actualFleeChance = Math.max(0.10, Math.min(0.90, actualFleeChance)); // Clamp between 10% and 90%

        if (Math.random() < actualFleeChance) {
          addBattleLog("You successfully escaped!");
          finalBattleMessage = "You managed to escape!";
          battleEnded = true;
        } else {
          addBattleLog("You failed to escape!");
          // Enemy gets a free hit if flee fails
          if (Math.random() < MISS_CHANCE) {
            addBattleLog(`${newEnemyStats.name} tries to attack you, but misses!`);
          } else {
            const enemyAttackPower = newEnemyStats.attack;
            let enemyDamage = Math.max(1, enemyAttackPower - playerEffectiveDefense);
            const isEnemyCrit = Math.random() < CRITICAL_HIT_CHANCE;
            if (isEnemyCrit) {
              enemyDamage = Math.round(enemyDamage * CRITICAL_HIT_MULTIPLIER);
              addBattleLog(`CRITICAL HIT! ${newEnemyStats.name} strikes you for ${enemyDamage} damage!`);
            } else {
              addBattleLog(`${newEnemyStats.name} hits you for ${enemyDamage} damage.`);
            }
            newPlayerStats.health = Math.max(0, newPlayerStats.health - enemyDamage);
            addLogEntry('health_update', `Health -${enemyDamage} to ${newPlayerStats.health} from ${newEnemyStats.name}'s attack after failed flee.`, true);
            if (newPlayerStats.health <= 0) { playerWon = false; battleEnded = true; }
          }
        }
      }
      
      if (!battleEnded && action === 'attack') { 
        if (Math.random() < MISS_CHANCE) {
          addBattleLog(`${newEnemyStats.name} tries to attack you, but misses!`);
        } else {
          const enemyAttackPower = newEnemyStats.attack;
          let enemyDamage = Math.max(1, enemyAttackPower - playerEffectiveDefense);
          const isEnemyCrit = Math.random() < CRITICAL_HIT_CHANCE;
          if (isEnemyCrit) {
            enemyDamage = Math.round(enemyDamage * CRITICAL_HIT_MULTIPLIER);
            addBattleLog(`CRITICAL HIT! ${newEnemyStats.name} strikes you for ${enemyDamage} damage!`);
          } else {
            addBattleLog(`${newEnemyStats.name} hits you for ${enemyDamage} damage.`);
          }
          newPlayerStats.health = Math.max(0, newPlayerStats.health - enemyDamage);
          addLogEntry('health_update', `Health -${enemyDamage} to ${newPlayerStats.health} from ${newEnemyStats.name}'s attack.`, true);
          if (newPlayerStats.health <= 0) { playerWon = false; battleEnded = true; }
        }
      }
      
      if (battleEnded) {
        if (finalBattleMessage) { 
          // Flee message handled
        } else if (playerWon !== null) { 
          const battleResult = getBattleResultConsequences(playerWon, newEnemyStats, newPlayerStats);
          newPlayerStats.cash = Math.max(0, newPlayerStats.cash + battleResult.cashChange);
          newPlayerStats.reputation += battleResult.reputationChange;
          
          const generalLogType = playerWon ? 'combat_win' : 'combat_loss';
          addLogEntry(generalLogType, battleResult.narration); 
          addBattleLog(battleResult.narration); 
          
          finalBattleMessage = playerWon ? `You defeated ${newEnemyStats.name}!` : "You have been defeated!";
        }

        let finalIsGameOver = prev.isGameOver;
        if (!playerWon && newPlayerStats.health <= 0 && action !== 'flee') { 
          finalIsGameOver = true; 
        }
        
        return { 
          ...prev, 
          playerStats: newPlayerStats, 
          currentEnemy: newEnemyStats, 
          battleLog: newBattleLog.slice(-20), 
          battleMessage: finalBattleMessage, 
          isGameOver: finalIsGameOver,
          isBattleActive: true, 
        };
      }
      return { ...prev, playerStats: newPlayerStats, currentEnemy: newEnemyStats, battleLog: newBattleLog.slice(-20) };
    });
  }, [addLogEntry]);
  
  const endBattleScreen = useCallback(() => {
    setGameState(prev => {
      const wasGameOverFromBattle = prev.playerStats.health <= 0 && prev.isBattleActive && prev.battleMessage !== "You managed to escape!";
      return { 
        ...prev, 
        isBattleActive: false, 
        currentEnemy: null, 
        battleLog: [], 
        battleMessage: null,
        isGameOver: prev.isGameOver || wasGameOverFromBattle, 
      };
    });
  }, []);

  const handleNextDay = useCallback(async () => {
    if (gameState.isGameOver || gameState.isBattleActive) return;
    setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null }));
    
    let currentStats = { ...gameState.playerStats };
    currentStats.daysPassed += 1;
    
    let workingHeatLevels = { ...gameState.boroughHeatLevels };
    NYC_LOCATIONS.forEach(borough => {
      const activityCount = gameState.playerActivityInBoroughsThisDay[borough] || 0;
      const currentBoroughHeat = workingHeatLevels[borough] || 0;
      let newHeat = currentBoroughHeat;
      if (activityCount > 0) newHeat = Math.min(5, currentBoroughHeat + 1);
      else newHeat = Math.max(0, currentBoroughHeat - 1);
      
      if(newHeat !== currentBoroughHeat) {
        addLogEntry('info', `${borough} heat changed by ${newHeat > currentBoroughHeat ? '+1' : '-1'} to ${newHeat}. Activity: ${activityCount}.`);
      }
      workingHeatLevels[borough] = newHeat;
    });
    
    const newDailyEvents = await getTodaysEvents(currentStats.daysPassed, workingHeatLevels);
    let eventProcessedHeatLevels = { ...workingHeatLevels };

    for (const borough in newDailyEvents) { 
      const event = newDailyEvents[borough];
      if (event?.effects.heatChange) { 
        const currentEventBoroughHeat = eventProcessedHeatLevels[borough] || 0;
        const updatedHeatByEvent = Math.max(0, Math.min(5, currentEventBoroughHeat + event.effects.heatChange));
        if (updatedHeatByEvent !== currentEventBoroughHeat) {
          addLogEntry('event_trigger', `${borough} heat further adjusted by ${event.effects.heatChange} to ${updatedHeatByEvent} due to event: ${event.name}.`);
        }
        eventProcessedHeatLevels[borough] = updatedHeatByEvent;
      }
      if (event) {
        const durationText = event.durationInDays && event.durationInDays > 1 ? ` (lasts ${event.durationInDays} days)` : '';
        addLogEntry('event_trigger', `Event in ${borough}: ${event.name} (${event.type}) - ${event.text}${durationText}`);
      }
    }
    addLogEntry('info', `Day ${currentStats.daysPassed} starting in ${currentStats.currentLocation}. Heat: ${eventProcessedHeatLevels[currentStats.currentLocation]}.`);

    const eventInCurrentLocation = newDailyEvents[currentStats.currentLocation];
    let combatTriggeredByEvent = false;

    if (eventInCurrentLocation?.effects.playerImpact) {
      const impact = eventInCurrentLocation.effects.playerImpact; 
      if (toast) setTimeout(() => toast({ title: `Event: ${eventInCurrentLocation.name}!`, description: impact.message, duration: 5000}), 0);
      addLogEntry('event_player_impact', `${eventInCurrentLocation.name}: ${impact.message}`);
      
      if (impact.healthChange) { 
        const oldHealth = currentStats.health;
        currentStats.health = Math.max(0, Math.min(MAX_PLAYER_HEALTH, currentStats.health + impact.healthChange)); 
        addLogEntry('health_update', `Health ${impact.healthChange > 0 ? '+' : ''}${impact.healthChange} (from ${oldHealth} to ${currentStats.health}) due to ${eventInCurrentLocation.name}.`); 
      }
      if (impact.cashChange) { 
        currentStats.cash = Math.max(0, currentStats.cash + impact.cashChange); 
        addLogEntry('info', `Cash ${impact.cashChange > 0 ? '+' : ''}$${Math.abs(impact.cashChange)} due to ${eventInCurrentLocation.name}. New balance: $${currentStats.cash.toLocaleString()}`); 
      }
      if (impact.reputationChange) { 
        currentStats.reputation += impact.reputationChange; 
        addLogEntry('info', `Reputation ${impact.reputationChange > 0 ? '+' : ''}${impact.reputationChange} due to ${eventInCurrentLocation.name}. New rep: ${currentStats.reputation}.`); 
      }
      
      if (currentStats.health <= 0) {
        setGameState(prev => ({ 
          ...prev, 
          playerStats: currentStats, 
          isGameOver: true, 
          isLoadingNextDay: false, 
          activeBoroughEvents: newDailyEvents, 
          boroughHeatLevels: eventProcessedHeatLevels, 
          playerActivityInBoroughsThisDay: {},
          battleMessage: `Overcome by event: ${eventInCurrentLocation.name}.` 
        }));
        if (toast) setTimeout(() => toast({ title: "Game Over", description: `Succumbed to event: ${eventInCurrentLocation.name}.`, variant: "destructive" }), 0); 
        addLogEntry('game_over', `Player defeated by event: ${eventInCurrentLocation.name}.`);
        return;
      }
      if (impact.triggerCombat) {
         combatTriggeredByEvent = true;
         const opponentMap: Record<string, 'police' | 'gang' | 'fiend'> = {
            'police_raid': 'police',
            'gang_activity': 'gang',
            'fiend_encounter': 'fiend',
            'desperate_seller': 'fiend', 
            'mugging': 'fiend', 
         };
         const opponentTypeForEvent = opponentMap[impact.triggerCombat] || 'fiend'; 
         startBattle(opponentTypeForEvent);
      }
    }
    
    let newMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      newMarketPrices = await getMarketPrices(currentStats.currentLocation); 
      newLocalHeadlines = await getLocalHeadlines(currentStats.currentLocation);
      newMarketPrices = applyHeadlineImpacts(newMarketPrices, newLocalHeadlines);
      newMarketPrices = applyEventPriceModifiers(newMarketPrices, eventInCurrentLocation); 
    } catch (e) { 
        console.error("Error fetching market data on next day:", e); 
        if (toast) setTimeout(() => toast({ title: "Market Error", description:"Failed to update market data.", variant: "destructive" }), 0); 
        addLogEntry('info', "Market update failed on next day."); 
    }
    
    const heatInCurrentLocation = eventProcessedHeatLevels[currentStats.currentLocation] || 0;
    const randomEncounterChance = 0.10 + (heatInCurrentLocation * 0.08); 

    if (!combatTriggeredByEvent && !gameState.isBattleActive && currentStats.health > 0 && Math.random() < randomEncounterChance) { 
      const opponentTypes = ["police", "gang", "fiend"] as const;
      let selectedOpponentType: 'police' | 'gang' | 'fiend';
      const randomRoll = Math.random();
      if (randomRoll < (0.25 + heatInCurrentLocation * 0.10)) selectedOpponentType = 'police'; 
      else if (randomRoll < (0.60 + heatInCurrentLocation * 0.05)) selectedOpponentType = 'gang'; 
      else selectedOpponentType = 'fiend';
      addLogEntry('info', `Random encounter with ${selectedOpponentType} in ${currentStats.currentLocation}. Heat: ${heatInCurrentLocation}.`);
      startBattle(selectedOpponentType);
    }

    if (currentStats.health <= 0 && !gameState.isBattleActive) {
      setGameState(prev => ({ ...prev, playerStats: currentStats, isGameOver: true, isLoadingNextDay: false, battleMessage: "Succumbed to injuries or events." }));
      if (toast) setTimeout(() => toast({ title: "Game Over", description: "You succumbed to your fate.", variant: "destructive" }), 0);
      addLogEntry('game_over', 'Player health reached 0 outside of active battle.');
      return;
    }

    if (!gameState.isBattleActive && currentStats.health > 0) {
      const oldRank = currentStats.rank;
      if (currentStats.cash > 50000 && currentStats.rank !== 'Kingpin') currentStats.rank = 'Kingpin';
      else if (currentStats.cash > 25000 && !['Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Baron';
      else if (currentStats.cash > 10000 && !['Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Distributor';
      else if (currentStats.cash > 5000 && !['Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Supplier';
      else if (currentStats.cash > 2000 && !['Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Dealer';
      else if (currentStats.cash > 1000 && !['Peddler', 'Dealer', 'Supplier', 'Distributor', 'Baron', 'Kingpin'].includes(currentStats.rank)) currentStats.rank = 'Peddler';
      if (currentStats.rank !== oldRank) { 
        if (toast) setTimeout(() => toast({title: "Rank Up!", description: `Promoted to ${currentStats.rank}!`}), 0); 
        addLogEntry('rank_up', `Promoted to ${currentStats.rank}!`); 
      }
    }

    if (!gameState.isBattleActive) { 
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
    } else { 
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
  }, [gameState.playerStats, gameState.isGameOver, gameState.isBattleActive, gameState.boroughHeatLevels, gameState.activeBoroughEvents, gameState.playerActivityInBoroughsThisDay, toast, addLogEntry, startBattle, applyHeadlineImpacts, applyEventPriceModifiers]);

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

    