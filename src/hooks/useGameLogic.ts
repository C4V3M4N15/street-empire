
"use client";

import { useState, useCallback, useEffect, useRef } from 'react';
import type { PlayerStats, GameState, LogEntry, LogEventType, InventoryItem, Weapon, Armor, HealingItem, CapacityUpgrade, EnemyStats, PlayerBattleActionType } from '@/types/game';
import type { GameEvent } from '@/types/events';
import { getMarketPrices, getLocalHeadlines, type DrugPrice, type LocalHeadline, ALL_DRUGS } from '@/services/market';
import { generateEnemyStats, getBattleResultConsequences } from '@/services/combat';
import { getShopWeapons, getShopArmor, getShopHealingItems, getShopCapacityUpgrades } from '@/services/shopItems';
import { getTodaysEvents, drugCategories, resetUniqueEvents } from '@/services/eventService';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import type { User } from 'firebase/auth';

export const NYC_LOCATIONS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];
const PLAYER_BASE_ATTACK = 5; 
const PLAYER_BASE_DEFENSE = 2; 
const MAX_PLAYER_HEALTH = 100;

const MISS_CHANCE = 0.15;
const CRITICAL_HIT_CHANCE = 0.10;
const CRITICAL_HIT_MULTIPLIER = 1.5;
const FLEE_CHANCE_BASE = 0.33;
const ENEMY_INITIATIVE_CHANCE = 0.30; 

const createInitialPlayerStats = (user: User | null): PlayerStats => ({
  name: user?.displayName || 'Player1', 
  health: MAX_PLAYER_HEALTH,
  cash: 1000,
  inventory: {},
  reputation: 0,
  daysPassed: 0,
  currentLocation: NYC_LOCATIONS[0],
  rank: 'Rookie',
  maxInventoryCapacity: 10,
  equippedWeapon: null,
  equippedWeaponAmmo: null,
  equippedArmor: null,
  purchasedUpgradeIds: [],
  purchasedArmorIds: [],
  travelsThisDay: 0, // Initialize travel count
});

interface DrugPriceWithLocation extends DrugPrice {
  location: string;
}


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
      const categoryKeyTyped = catMod.categoryKey as keyof typeof drugCategories;
      const drugsInCat = drugCategories[categoryKeyTyped];
      if (drugsInCat && drugsInCat.includes(dp.drug)) {
        newPrice *= catMod.factor;
      }
    });
    return { ...dp, price: Math.max(1, Math.round(newPrice)) };
  });
};


export function useGameLogic(user: User | null) { 
  const [gameState, setGameState] = useState<GameState>(() => {
    const initialHeatLevels: Record<string, number> = {};
    NYC_LOCATIONS.forEach(loc => initialHeatLevels[loc] = 0);
    return {
      playerStats: createInitialPlayerStats(user), 
      marketPrices: [],
      previousMarketPrices: [], 
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
  const isMounted = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);

  
  useEffect(() => {
    if (user?.displayName && user.displayName !== gameState.playerStats.name) {
      setGameState(prev => ({
        ...prev,
        playerStats: {
          ...prev.playerStats,
          name: user.displayName!,
        }
      }));
    }
  }, [user, gameState.playerStats.name]);


  const addLogEntry = useCallback((type: LogEventType, message: string, isBattleLog = false) => {
    const entry = { id: uuidv4(), timestamp: new Date().toISOString(), type, message };
    if (isMounted.current) {
        setGameState(prev => ({
        ...prev,
        eventLog: isBattleLog ? prev.eventLog : [entry, ...prev.eventLog].slice(0, 100),
        battleLog: isBattleLog ? [entry, ...prev.battleLog].slice(0, 20) : prev.battleLog,
        }));
    }
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
    
    if (!user) {
        if (isMounted.current) setGameState(prev => ({...prev, isLoadingMarket: false})); 
        return;
    }
    if (isMounted.current) setGameState(prev => ({ ...prev, isLoadingMarket: true }));
    resetUniqueEvents(); 

    try {
      const initialPlayerStats = createInitialPlayerStats(user);
      const rawDay0Prices = await getMarketPrices(initialPlayerStats.currentLocation, 0, gameState.boroughHeatLevels); 
      const [headlines, weapons, armor, healingItems, capacityUpgrades, dailyEvents] = await Promise.all([
        getLocalHeadlines(initialPlayerStats.currentLocation),
        getShopWeapons(),
        getShopArmor(),
        getShopHealingItems(),
        getShopCapacityUpgrades(),
        getTodaysEvents(initialPlayerStats.daysPassed, gameState.boroughHeatLevels),
      ]);

      let finalDay0PricesWithImpacts = applyHeadlineImpacts(rawDay0Prices, headlines);
      const eventInPlayerLocation = dailyEvents[initialPlayerStats.currentLocation];
      finalDay0PricesWithImpacts = applyEventPriceModifiers(finalDay0PricesWithImpacts, eventInPlayerLocation);
      
      const fictionalDayMinus1Prices = ALL_DRUGS.map(d => ({
        drug: d.name,
        price: d.basePrice, 
        volatility: d.volatility, 
      }));

      const day0MarketPricesWithDirection = finalDay0PricesWithImpacts.map(currentDrug => {
        const prevDrug = fictionalDayMinus1Prices.find(p => p.drug === currentDrug.drug);
        let direction: DrugPrice['priceChangeDirection'] = 'new'; 
        if (prevDrug) {
          if (currentDrug.price > prevDrug.price) direction = 'up';
          else if (currentDrug.price < prevDrug.price) direction = 'down';
          else direction = 'same';
        }
        return { ...currentDrug, priceChangeDirection: direction };
      });


      const initialBoroughHeat = { ...gameState.boroughHeatLevels };
      for (const borough in dailyEvents) {
        const event = dailyEvents[borough];
        if (event?.effects.heatChange) {
          initialBoroughHeat[borough] = Math.max(0, Math.min(5, (initialBoroughHeat[borough] || 0) + event.effects.heatChange));
        }
         if (event && isMounted.current) { 
          const durationText = event.durationInDays && event.durationInDays > 1 ? ` (lasts ${event.durationInDays} days)` : '';
          addLogEntry('event_trigger', `Event in ${borough}: ${event.name} (${event.type}) - ${event.text}${durationText}`);
        }
      }
      
      if (isMounted.current) {
        setGameState(prev => ({
          ...prev,
          playerStats: initialPlayerStats, 
          marketPrices: day0MarketPricesWithDirection,
          previousMarketPrices: finalDay0PricesWithImpacts.map(({priceChangeDirection, ...rest}) => rest), 
          localHeadlines: headlines,
          availableWeapons: weapons,
          availableArmor: armor,
          availableHealingItems: healingItems,
          availableCapacityUpgrades: capacityUpgrades,
          activeBoroughEvents: dailyEvents,
          boroughHeatLevels: initialBoroughHeat,
          isLoadingMarket: false,
        }));
        addLogEntry('info', `Game started in ${initialPlayerStats.currentLocation}. Market, shop, and events loaded.`);
      }
    } catch (error) {
      console.error("Failed to fetch initial game data:", error);
      if (isMounted.current) {
        setTimeout(() => toast({ title: "Error", description: "Could not load game data. Try refreshing.", variant: "destructive" }), 0);
        addLogEntry('info', 'Error loading initial game data.');
        setGameState(prev => ({ ...prev, isLoadingMarket: false }));
      }
    }
  
  }, [toast, addLogEntry, applyHeadlineImpacts, user, gameState.boroughHeatLevels]); 


  useEffect(() => {
    if (user) { 
        fetchInitialData();
    }
  
  }, [user, fetchInitialData]); 


  const buyDrug = useCallback((drugName: string, quantity: number, price: number) => {
    if (!user) return; 
    if (isMounted.current) {
        setGameState(prev => {
        const currentStats = prev.playerStats;
        const cost = quantity * price;
        if (quantity <= 0) {
            setTimeout(() => toast({ title: "Invalid Quantity", description: "Please enter a positive amount to buy.", variant: "destructive" }), 0);
            return prev;
        }
        if (currentStats.cash < cost) {
            setTimeout(() => toast({ title: "Not Enough Cash", description: `You need $${cost.toLocaleString()} but only have $${currentStats.cash.toLocaleString()}.`, variant: "destructive" }), 0);
            return prev;
        }
        const currentTotalUnits = Object.values(currentStats.inventory).reduce((sum, item) => sum + item.quantity, 0);
        if (currentTotalUnits + quantity > currentStats.maxInventoryCapacity) {
            setTimeout(() => toast({ title: "Not Enough Space", description: `You can only carry ${currentStats.maxInventoryCapacity - currentTotalUnits} more units.`, variant: "destructive" }), 0);
            return prev;
        }
        const newInventory = { ...currentStats.inventory };
        const currentItem: InventoryItem = newInventory[drugName] || { quantity: 0, totalCost: 0 };
        newInventory[drugName] = { quantity: currentItem.quantity + quantity, totalCost: currentItem.totalCost + cost };
        const successMsg = `Bought ${quantity} ${drugName} for $${cost.toLocaleString()}.`;
        setTimeout(() => toast({ title: "Purchase Successful", description: successMsg }), 0);
        addLogEntry('buy', successMsg);
        const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
        return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash - cost, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
        });
    }
  }, [toast, addLogEntry, user]);

  const sellDrug = useCallback((drugName: string, quantity: number, price: number) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const currentStats = prev.playerStats;
        const currentItem = currentStats.inventory[drugName];
        if (quantity <= 0) {
            setTimeout(() => toast({ title: "Invalid Quantity", description: "Please enter a positive amount.", variant: "destructive" }), 0);
            return prev;
        }
        if (!currentItem || currentItem.quantity < quantity) {
            setTimeout(() => toast({ title: "Not Enough Stock", description: `You only have ${currentItem?.quantity || 0} ${drugName}.`, variant: "destructive" }), 0);
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
        setTimeout(() => toast({ title: "Sale Successful", description: successMsg }), 0);
        addLogEntry('sell', successMsg);
        const newPlayerActivity = { ...prev.playerActivityInBoroughsThisDay, [currentStats.currentLocation]: (prev.playerActivityInBoroughsThisDay[currentStats.currentLocation] || 0) + 1 };
        return { ...prev, playerStats: { ...currentStats, cash: currentStats.cash + earnings, inventory: newInventory }, playerActivityInBoroughsThisDay: newPlayerActivity };
        });
    }
  }, [toast, addLogEntry, user]);

  const buyWeapon = useCallback((weaponToBuy: Weapon) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const cs = prev.playerStats;
        if (cs.cash < weaponToBuy.price) {
            setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0);
            return prev;
        }
        if (cs.equippedWeapon?.name === weaponToBuy.name) {
            setTimeout(() => toast({ title: "Already Equipped" }), 0);
            return prev;
        }

        let newEquippedWeaponAmmo: PlayerStats['equippedWeaponAmmo'] = null;
        if (weaponToBuy.isFirearm && weaponToBuy.clipSize && weaponToBuy.clipSize > 0) {
            newEquippedWeaponAmmo = {
            currentInClip: weaponToBuy.clipSize, 
            reserveAmmo: weaponToBuy.clipSize * 2, 
            };
        }

        const msg = `Purchased ${weaponToBuy.name} for $${weaponToBuy.price.toLocaleString()}.`;
        setTimeout(() => toast({ title: "Weapon Acquired!", description: msg }), 0);
        addLogEntry('shop_weapon_purchase', msg);
        return { ...prev, playerStats: { ...cs, cash: cs.cash - weaponToBuy.price, equippedWeapon: weaponToBuy, equippedWeaponAmmo: newEquippedWeaponAmmo } };
        });
    }
  }, [toast, addLogEntry, user]);

  const buyAmmoForEquippedWeapon = useCallback(() => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const cs = prev.playerStats;
        if (!cs.equippedWeapon || !cs.equippedWeapon.isFirearm || !cs.equippedWeapon.clipSize) {
            setTimeout(() => toast({ title: "No Firearm", description: "You don't have a firearm equipped to buy ammo for.", variant: "destructive" }), 0);
            return prev;
        }

        const weapon = cs.equippedWeapon;
        const ammoCost = Math.round(weapon.price * 0.10); 

        if (cs.cash < ammoCost) {
            setTimeout(() => toast({ title: "Not Enough Cash", description: `Need $${ammoCost.toLocaleString()} to buy a clip for ${weapon.name}.`, variant: "destructive" }), 0);
            return prev;
        }

        const currentAmmoState = cs.equippedWeaponAmmo || { currentInClip: 0, reserveAmmo: 0 };
        const maxReserveAmmo = weapon.clipSize * 2; 

        if (currentAmmoState.currentInClip === weapon.clipSize && currentAmmoState.reserveAmmo === maxReserveAmmo) {
            setTimeout(() => toast({ title: "Max Ammo", description: `${weapon.name} is already fully loaded.` }), 0);
            return prev;
        }
        
        let newCurrentInClip = currentAmmoState.currentInClip;
        let newReserveAmmo = currentAmmoState.reserveAmmo;
        let ammoToDistribute = weapon.clipSize; 

        const neededForCurrentClip = weapon.clipSize - newCurrentInClip;
        if (neededForCurrentClip > 0) {
            const fillCurrentAmount = Math.min(neededForCurrentClip, ammoToDistribute);
            newCurrentInClip += fillCurrentAmount;
            ammoToDistribute -= fillCurrentAmount;
        }

        if (ammoToDistribute > 0) {
            const spaceInReserve = maxReserveAmmo - newReserveAmmo;
            const fillReserveAmount = Math.min(spaceInReserve, ammoToDistribute);
            newReserveAmmo += fillReserveAmount;
        }
        
        const bulletsActuallyAdded = (newCurrentInClip + newReserveAmmo) - (currentAmmoState.currentInClip + currentAmmoState.reserveAmmo);

        if (bulletsActuallyAdded === 0) {
            setTimeout(() => toast({ title: "Max Ammo", description: `${weapon.name} is already at maximum ammo capacity.` }), 0);
            return prev;
        }


        const msg = `Bought a clip (${weapon.clipSize} rounds) for ${weapon.name} for $${ammoCost.toLocaleString()}.`;
        setTimeout(() => toast({ title: "Ammo Purchased!", description: msg }), 0);
        addLogEntry('shop_ammo_purchase', msg);

        return {
            ...prev,
            playerStats: {
            ...cs,
            cash: cs.cash - ammoCost,
            equippedWeaponAmmo: {
                currentInClip: newCurrentInClip,
                reserveAmmo: newReserveAmmo,
            },
            },
        };
        });
    }
  }, [toast, addLogEntry, user]);


  const buyArmor = useCallback((armorToBuy: Armor) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const cs = prev.playerStats;

        if (cs.purchasedArmorIds.includes(armorToBuy.id)) {
            if (cs.equippedArmor?.id !== armorToBuy.id) {
            setTimeout(() => toast({ title: "Armor Equipped", description: `Equipped ${armorToBuy.name}.` }), 0);
            return { ...prev, playerStats: { ...cs, equippedArmor: armorToBuy } };
            } else {
            setTimeout(() => toast({ title: "Already Equipped", description: `You are already wearing ${armorToBuy.name}.` }), 0);
            return prev;
            }
        }

        if (cs.cash < armorToBuy.price) {
            setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0);
            return prev;
        }

        const newPlayerStats = {
            ...cs,
            cash: cs.cash - armorToBuy.price,
            purchasedArmorIds: [...cs.purchasedArmorIds, armorToBuy.id],
            equippedArmor: armorToBuy, 
        };

        const msg = `Purchased and equipped ${armorToBuy.name} for $${armorToBuy.price.toLocaleString()}. Protection: ${armorToBuy.protectionBonus}.`;
        setTimeout(() => toast({ title: "Armor Acquired!", description: msg }), 0);
        addLogEntry('shop_armor_purchase', msg);

        return { ...prev, playerStats: newPlayerStats };
        });
    }
  }, [toast, addLogEntry, user]);


  const buyHealingItem = useCallback((itemToBuy: HealingItem) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const cs = prev.playerStats;
        if (cs.cash < itemToBuy.price) {
            setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0);
            return prev;
        }
        if (cs.health >= MAX_PLAYER_HEALTH) {
            setTimeout(() => toast({ title: "Full Health", description: "You are already at maximum health." }), 0);
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
            setTimeout(() => toast({ title: "No Effect", description: "This item provided no additional healing." }), 0);
            return prev;
        }

        const msg = `Used ${itemToBuy.name}. Healed ${healedAmount} HP.`;
        setTimeout(() => toast({ title: "Healing Applied!", description: msg }), 0);
        addLogEntry('shop_healing_purchase', msg);
        addLogEntry('health_update', `Health +${healedAmount} to ${newHealth}.`);
        return { ...prev, playerStats: { ...cs, cash: cs.cash - itemToBuy.price, health: newHealth } };
        });
    }
  }, [toast, addLogEntry, user]);

  const buyCapacityUpgrade = useCallback((upgradeToBuy: CapacityUpgrade) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const cs = prev.playerStats;
        if (cs.purchasedUpgradeIds.includes(upgradeToBuy.id)) {
            setTimeout(() => toast({ title: "Already Owned" }), 0);
            return prev;
        }
        if (cs.cash < upgradeToBuy.price) {
            setTimeout(() => toast({ title: "Not Enough Cash", variant: "destructive" }), 0);
            return prev;
        }
        const msg = `Purchased ${upgradeToBuy.name}. Capacity +${upgradeToBuy.capacityIncrease}.`;
        setTimeout(() => toast({ title: "Upgrade Acquired!", description: msg }), 0);
        addLogEntry('shop_capacity_upgrade', msg);
        return { ...prev, playerStats: { ...cs, cash: cs.cash - upgradeToBuy.price, maxInventoryCapacity: cs.maxInventoryCapacity + upgradeToBuy.capacityIncrease, purchasedUpgradeIds: [...cs.purchasedUpgradeIds, upgradeToBuy.id] } };
        });
    }
  }, [toast, addLogEntry, user]);

  const travelToLocation = useCallback(async (targetLocation: string) => {
    if (!user) return;

    if (isMounted.current) {
      // Use setGameState with a callback to get the most recent state
      setGameState(prev => {
        const currentLoc = prev.playerStats.currentLocation;
        if (currentLoc === targetLocation) {
          setTimeout(() => toast({ title: "Already There", description: `You are already in ${targetLocation}.` }), 0);
          return prev; // Return previous state, no changes
        }

        if (prev.playerStats.travelsThisDay >= 5) {
          addLogEntry('info', `Travel limit of 5 reached for the day. Advancing to the next day.`);
          setTimeout(() => toast({ title: "Travel Limit Reached", description: "Advancing to the next day." }), 0);
          
          // Directly call handleNextDay. It will manage its own state updates.
          // No need to return a new state here if handleNextDay will take over.
          // However, we need to ensure this setGameState call completes *before* handleNextDay might try to read stale state.
          // To be safe, we set isLoadingNextDay and let handleNextDay run.
          // The handleNextDay function should be robust enough to handle being called at this point.
          Promise.resolve().then(() => handleNextDay()); // Schedule handleNextDay to run after current updates.

          return { ...prev, isLoadingNextDay: true }; // Set loading for next day
        }
        
        // Proceed with travel logic
        const travelMessage = `Traveled from ${currentLoc} to ${targetLocation}.`;
        addLogEntry('travel', travelMessage);
        setTimeout(() => toast({ title: "Travel Successful", description: travelMessage }), 0);

        const previousPricesInOldLocation = [...prev.marketPrices];

        // This part will update state for the travel itself
        const newStateAfterTravelSetup = {
          ...prev,
          playerStats: { 
            ...prev.playerStats, 
            currentLocation: targetLocation,
            travelsThisDay: prev.playerStats.travelsThisDay + 1, // Increment travel count
          },
          isLoadingMarket: true,
          localHeadlines: [],
          marketPrices: [],
          previousMarketPrices: previousPricesInOldLocation.map(({ priceChangeDirection, ...rest }) => rest),
        };
        
        // Fetch new market data after setting the new location
        // This needs to be an async operation outside the main setGameState
        (async () => {
            try {
                const newRawPrices = await getMarketPrices(targetLocation, newStateAfterTravelSetup.playerStats.daysPassed, newStateAfterTravelSetup.boroughHeatLevels);
                const newHeadlines = await getLocalHeadlines(targetLocation);

                const currentActiveEvents = newStateAfterTravelSetup.activeBoroughEvents;

                let finalPricesWithImpacts = applyHeadlineImpacts(newRawPrices, newHeadlines);
                finalPricesWithImpacts = applyEventPriceModifiers(finalPricesWithImpacts, currentActiveEvents[targetLocation]);

                const newMarketPricesWithDirection = finalPricesWithImpacts.map(currentDrug => {
                const baseDrug = ALL_DRUGS.find(d => d.name === currentDrug.drug);
                let direction: DrugPrice['priceChangeDirection'] = 'new';
                if(baseDrug){
                    if(currentDrug.price === baseDrug.basePrice) direction = 'same';
                    else if (currentDrug.price > baseDrug.basePrice) direction = 'up';
                    else direction = 'down';
                }
                return { ...currentDrug, priceChangeDirection: direction };
                });

                if (isMounted.current) {
                    setGameState(s => ({ // Use functional update here for safety
                        ...s,
                        marketPrices: newMarketPricesWithDirection,
                        localHeadlines: newHeadlines,
                        isLoadingMarket: false
                    }));
                }
                addLogEntry('info', `Market data for ${targetLocation} updated.`);
            } catch (e) {
                console.error("Market fetch error during travel:", e);
                if (isMounted.current) {
                    setTimeout(() => toast({ title: "Market Error", description: `Could not load market data for ${targetLocation}.`, variant: "destructive" }), 0);
                    setGameState(s => ({...s, isLoadingMarket: false}));
                }
            }
        })();

        return newStateAfterTravelSetup; // Return the state updated for initiating travel
      });
    }
  }, [user, toast, addLogEntry, applyHeadlineImpacts, handleNextDay]); // Added handleNextDay as a dependency

 const startBattle = useCallback((opponentType: 'police' | 'gang' | 'fiend') => {
    if (!user || gameState.playerStats.daysPassed <= 10) { 
      if (gameState.playerStats.daysPassed <= 10 && isMounted.current) {
        addLogEntry('info', `An encounter with ${opponentType} was avoided due to being early in the game.`);
        setTimeout(() => toast({title: "Close Call!", description: `You managed to avoid a confrontation with a ${opponentType}. Still new to these streets...`, duration: 4000}),0);
      }
      return;
    }

    if (isMounted.current) {
        setGameState(prev => {
        if (prev.isBattleActive) return prev; 

        const enemy = generateEnemyStats(opponentType, prev.playerStats);
        let initialBattleLog: LogEntry[] = [{id: uuidv4(), timestamp: new Date().toISOString(), type: 'info', message: `Encountered ${enemy.name}!`}]
        let updatedPlayerStats = { ...prev.playerStats };

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
            return {
            ...prev,
            playerStats: updatedPlayerStats,
            isBattleActive: true, 
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
    }
  }, [addLogEntry, user, gameState.playerStats.daysPassed, toast]); 

  const handlePlayerBattleAction = useCallback((action: PlayerBattleActionType) => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        if (!prev.isBattleActive || !prev.currentEnemy || prev.battleMessage) return prev; 

        let newPlayerStats = { ...prev.playerStats };
        let newEnemyStats = { ...prev.currentEnemy };
        let newBattleLog = [...prev.battleLog];
        let battleEnded = false;
        let playerWon: boolean | null = null;
        let finalBattleMessage = ""; 

        const addBattleLog = (msg: string, type: LogEventType = 'battle_action') => {
            newBattleLog.push({id: uuidv4(), timestamp: new Date().toISOString(), type, message: msg});
        };

        const playerAttackPower = (newPlayerStats.equippedWeapon?.damageBonus || 0) + PLAYER_BASE_ATTACK;
        const playerDefensePower = (newPlayerStats.equippedArmor?.protectionBonus || 0) + PLAYER_BASE_DEFENSE;


        if (action === 'attack') {
            let canAttack = true;
            if (newPlayerStats.equippedWeapon?.isFirearm) {
            if (!newPlayerStats.equippedWeaponAmmo || newPlayerStats.equippedWeaponAmmo.currentInClip <= 0) {
                if (newPlayerStats.equippedWeaponAmmo && newPlayerStats.equippedWeaponAmmo.reserveAmmo > 0 && newPlayerStats.equippedWeapon.clipSize) {
                const bulletsToReload = Math.min(newPlayerStats.equippedWeapon.clipSize, newPlayerStats.equippedWeaponAmmo.reserveAmmo);
                newPlayerStats.equippedWeaponAmmo.currentInClip = bulletsToReload;
                newPlayerStats.equippedWeaponAmmo.reserveAmmo -= bulletsToReload;
                addBattleLog(`Reloading ${newPlayerStats.equippedWeapon.name}! (${bulletsToReload} rounds)`);
                } else {
                addBattleLog(`Out of ammo for ${newPlayerStats.equippedWeapon.name}!`);
                canAttack = false; 
                }
            } else if (newPlayerStats.equippedWeaponAmmo) { 
                newPlayerStats.equippedWeaponAmmo.currentInClip -= 1; 
            }
            }

            if (canAttack) { 
            if (Math.random() < MISS_CHANCE) {
                addBattleLog(`You try to attack ${newEnemyStats.name}, but miss!`);
            } else {
                let playerDamage = Math.max(1, playerAttackPower - newEnemyStats.defense);
                const isCrit = Math.random() < CRITICAL_HIT_CHANCE;
                if (isCrit) {
                playerDamage = Math.round(playerDamage * CRITICAL_HIT_MULTIPLIER);
                addBattleLog(`CRITICAL HIT! You strike ${newEnemyStats.name} for ${playerDamage} damage!`);
                } else {
                addBattleLog(`You hit ${newEnemyStats.name} for ${playerDamage} damage.`);
                }
                newEnemyStats.health = Math.max(0, newEnemyStats.health - playerDamage);
                if (newEnemyStats.health <= 0) {
                playerWon = true;
                battleEnded = true;
                }
            }
            }
        } else if (action === 'flee') {
            let actualFleeChance = FLEE_CHANCE_BASE;
            if (newPlayerStats.health < MAX_PLAYER_HEALTH * 0.3) actualFleeChance += 0.25;
            const enemyStrength = newEnemyStats.attack + newEnemyStats.defense;
            const playerStrength = playerAttackPower + playerDefensePower;
            if (enemyStrength > playerStrength * 1.2) actualFleeChance -= 0.15;

            actualFleeChance = Math.max(0.10, Math.min(0.90, actualFleeChance)); 

            if (Math.random() < actualFleeChance) {
            addBattleLog("You successfully escaped!");
            finalBattleMessage = "You managed to escape!"; 
            battleEnded = true;
            } else {
            addBattleLog("You failed to escape!");
            }
        } else if (action === 'bribe') {
            if (!newEnemyStats.bribable || !newEnemyStats.bribeBaseCost || newEnemyStats.bribeSuccessRate === undefined) {
                addBattleLog(`${newEnemyStats.name} cannot be bribed!`);
            } else if (newPlayerStats.cash < newEnemyStats.bribeBaseCost) {
                addBattleLog(`Not enough cash to bribe ${newEnemyStats.name}. (Need $${newEnemyStats.bribeBaseCost.toLocaleString()})`);
            } else {
                const bribeCost = newEnemyStats.bribeBaseCost;
                newPlayerStats.cash -= bribeCost;
                addLogEntry('bribe_attempt', `Attempted to bribe ${newEnemyStats.name} for $${bribeCost.toLocaleString()}.`, true);

                if (Math.random() < newEnemyStats.bribeSuccessRate) {
                    addBattleLog(`Bribe successful! ${newEnemyStats.name} takes the $${bribeCost.toLocaleString()} and leaves.`);
                    finalBattleMessage = "Bribe successful!";
                    battleEnded = true;
                    
                    newPlayerStats.reputation += (newEnemyStats.name === 'Beat Cop' ? -2 : 1);
                } else {
                    addBattleLog(`Bribe failed! ${newEnemyStats.name} is not swayed.`);
                }
            }
        }

        if (!battleEnded) {
            if (Math.random() < MISS_CHANCE) { 
            addBattleLog(`${newEnemyStats.name} tries to attack you, but misses!`);
            } else {
            const enemyAttackPower = newEnemyStats.attack;
            let enemyDamage = Math.max(1, enemyAttackPower - playerDefensePower);
            const isEnemyCrit = Math.random() < CRITICAL_HIT_CHANCE; 
            if (isEnemyCrit) {
                enemyDamage = Math.round(enemyDamage * CRITICAL_HIT_MULTIPLIER);
                addBattleLog(`CRITICAL HIT! ${newEnemyStats.name} strikes you for ${enemyDamage} damage!`);
            } else {
                addBattleLog(`${newEnemyStats.name} hits you for ${enemyDamage} damage.`);
            }
            newPlayerStats.health = Math.max(0, newPlayerStats.health - enemyDamage);
            addLogEntry('health_update', `Health -${enemyDamage} to ${newPlayerStats.health} from ${newEnemyStats.name}'s attack.`, true); 
            if (newPlayerStats.health <= 0) {
                playerWon = false;
                battleEnded = true;
            }
            }
        }

        if (battleEnded) {
            if (finalBattleMessage) { 
                
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
            if (!playerWon && newPlayerStats.health <= 0 && action !== 'flee' && action !== 'bribe') {
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
    }
  }, [addLogEntry, user]);

  const endBattleScreen = useCallback(() => {
    if (!user) return;
    if (isMounted.current) {
        setGameState(prev => {
        const wasGameOverFromBattle = prev.playerStats.health <= 0 && prev.isBattleActive && prev.battleMessage !== "You managed to escape!" && prev.battleMessage !== "Bribe successful!";
        return {
            ...prev,
            isBattleActive: false, 
            currentEnemy: null,    
            battleLog: [],         
            battleMessage: null,   
            isGameOver: prev.isGameOver || wasGameOverFromBattle, 
        };
        });
    }
  }, [user]);

  const handleNextDay = useCallback(async () => {
    if (!user) return;
    if (gameState.isGameOver || gameState.isBattleActive) return; 
    if (isMounted.current) {
      setGameState(prev => ({ ...prev, isLoadingNextDay: true, gameMessage: null, previousMarketPrices: prev.marketPrices.map(({priceChangeDirection, ...rest}) => rest) }));
    }

    let currentStats = { ...gameState.playerStats };
    currentStats.daysPassed += 1;
    currentStats.travelsThisDay = 0; // Reset travel count for the new day

    let workingHeatLevels = { ...gameState.boroughHeatLevels };
    NYC_LOCATIONS.forEach(borough => {
      const activityCount = gameState.playerActivityInBoroughsThisDay[borough] || 0;
      const currentBoroughHeat = workingHeatLevels[borough] || 0;
      let newHeat = currentBoroughHeat;
      if (activityCount > 0) {
        newHeat = Math.min(5, currentBoroughHeat + 1); 
      } else {
        newHeat = Math.max(0, currentBoroughHeat - 1); 
      }

      if(newHeat !== currentBoroughHeat && isMounted.current) {
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
        if (updatedHeatByEvent !== currentEventBoroughHeat && isMounted.current) {
          addLogEntry('event_trigger', `${borough} heat further adjusted by ${event.effects.heatChange} to ${updatedHeatByEvent} due to event: ${event.name}.`);
        }
        eventProcessedHeatLevels[borough] = updatedHeatByEvent;
      }
      if (event && isMounted.current) {
        const durationText = event.durationInDays && event.durationInDays > 1 ? ` (lasts ${event.durationInDays} days)` : '';
        addLogEntry('event_trigger', `Event in ${borough}: ${event.name} (${event.type}) - ${event.text}${durationText}`);
      }
    }
    if (isMounted.current) addLogEntry('info', `Day ${currentStats.daysPassed} starting in ${currentStats.currentLocation}. Heat: ${eventProcessedHeatLevels[currentStats.currentLocation]}.`);

    const eventInCurrentLocation = newDailyEvents[currentStats.currentLocation];
    let combatTriggeredByEvent = false;

    if (eventInCurrentLocation?.effects.playerImpact) {
      const impact = eventInCurrentLocation.effects.playerImpact;
      if (isMounted.current) setTimeout(() => toast({ title: `Event: ${eventInCurrentLocation.name}!`, description: impact.message, duration: 5000}), 0);
      if (isMounted.current) addLogEntry('event_player_impact', `${eventInCurrentLocation.name}: ${impact.message}`);

      if (impact.healthChange) {
        const oldHealth = currentStats.health;
        currentStats.health = Math.max(0, Math.min(MAX_PLAYER_HEALTH, currentStats.health + impact.healthChange));
        if (isMounted.current) addLogEntry('health_update', `Health ${impact.healthChange > 0 ? '+' : ''}${impact.healthChange} (from ${oldHealth} to ${currentStats.health}) due to ${eventInCurrentLocation.name}.`);
      }
      if (impact.cashChange) {
        currentStats.cash = Math.max(0, currentStats.cash + impact.cashChange);
        if (isMounted.current) addLogEntry('info', `Cash ${impact.cashChange > 0 ? '+' : ''}$${Math.abs(impact.cashChange)} due to ${eventInCurrentLocation.name}. New balance: $${currentStats.cash.toLocaleString()}`);
      }
      if (impact.reputationChange) {
        currentStats.reputation += impact.reputationChange;
        if (isMounted.current) addLogEntry('info', `Reputation ${impact.reputationChange > 0 ? '+' : ''}${impact.reputationChange} due to ${eventInCurrentLocation.name}. New rep: ${currentStats.reputation}.`);
      }

      if (currentStats.health <= 0) {
        if (isMounted.current) {
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
          setTimeout(() => toast({ title: "Game Over", description: `Succumbed to event: ${eventInCurrentLocation.name}.`, variant: "destructive" }), 0);
          addLogEntry('game_over', `Player defeated by event: ${eventInCurrentLocation.name}.`);
        }
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

    let currentMarketPrices: DrugPrice[] = [];
    let newLocalHeadlines: LocalHeadline[] = [];
    try {
      const rawNewMarketPrices = await getMarketPrices(currentStats.currentLocation, currentStats.daysPassed, eventProcessedHeatLevels);
      newLocalHeadlines = await getLocalHeadlines(currentStats.currentLocation);
      let impactedPrices = applyHeadlineImpacts(rawNewMarketPrices, newLocalHeadlines);
      impactedPrices = applyEventPriceModifiers(impactedPrices, newDailyEvents[currentStats.currentLocation]);
        
        const pricesWithLocation = rawNewMarketPrices.map((price, index): DrugPriceWithLocation => ({
            ...price,
            location: NYC_LOCATIONS[index % NYC_LOCATIONS.length],
        }))

        currentMarketPrices = pricesWithLocation.map((currentDrug) => {
        const eventInLocation = newDailyEvents[currentDrug.location]
        const updatedPriceFromEvent = applyEventPriceModifiers([currentDrug], eventInLocation)[0]
        const prevDrug = gameState.previousMarketPrices.find(p => p.drug === currentDrug.drug);
        let direction: DrugPrice['priceChangeDirection'] = 'new'; 
        if (prevDrug) {
          if (updatedPriceFromEvent.price > prevDrug.price) direction = 'up';
          else if (updatedPriceFromEvent.price < prevDrug.price) direction = 'down';
          else direction = 'same';
        }
        return { ...updatedPriceFromEvent, priceChangeDirection: direction };
      });

    } catch (e) {
        console.error("Error fetching market data on next day:", e);
        if (isMounted.current) {
          setTimeout(() => toast({ title: "Market Error", description:"Failed to update market data for the new day.", variant: "destructive" }), 0);
          addLogEntry('info', "Market update failed on next day.");
        }
    }

    const heatInCurrentLocation = eventProcessedHeatLevels[currentStats.currentLocation] || 0;
    const randomEncounterChance = 0.05 + (heatInCurrentLocation * 0.09); 

    if (!combatTriggeredByEvent && !gameState.isBattleActive && currentStats.health > 0 && currentStats.daysPassed > 10 && Math.random() < randomEncounterChance) {
      const opponentTypes = ["police", "gang", "fiend"] as const;
      let selectedOpponentType: 'police' | 'gang' | 'fiend';
      const randomRoll = Math.random();
      if (randomRoll < (0.20 + heatInCurrentLocation * 0.10)) selectedOpponentType = 'police';
      else if (randomRoll < (0.55 + heatInCurrentLocation * 0.05)) selectedOpponentType = 'gang';
      else selectedOpponentType = 'fiend';
      if (isMounted.current) addLogEntry('info', `Random encounter with ${selectedOpponentType} in ${currentStats.currentLocation}. Heat: ${heatInCurrentLocation}.`);
      startBattle(selectedOpponentType); 
    }

    if (currentStats.health <= 0 && !gameState.isBattleActive) { 
      if (isMounted.current) {
        setGameState(prev => ({ ...prev, playerStats: currentStats, isGameOver: true, isLoadingNextDay: false, battleMessage: "Succumbed to injuries or events." }));
        setTimeout(() => toast({ title: "Game Over", description: "You succumbed to your fate.", variant: "destructive" }), 0);
        addLogEntry('game_over', 'Player health reached 0 outside of active battle.');
      }
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


      if (currentStats.rank !== oldRank && isMounted.current) {
        setTimeout(() => toast({title: "Rank Up!", description: `Promoted to ${currentStats.rank}!`}), 0);
        addLogEntry('rank_up', `Promoted to ${currentStats.rank}!`);
      }
    }

    if (isMounted.current) {
      setGameState(prev => ({
        ...prev,
        playerStats: currentStats,
        marketPrices: currentMarketPrices,
        localHeadlines: newLocalHeadlines,
        activeBoroughEvents: newDailyEvents, 
        boroughHeatLevels: eventProcessedHeatLevels, 
        isLoadingNextDay: false,
        playerActivityInBoroughsThisDay: {}, 
      }));
    }
  }, [gameState, toast, addLogEntry, startBattle, applyHeadlineImpacts, user]);

  const resetGame = useCallback(() => {
    if (!user) return; 
     const initialHeatLevelsReset: Record<string, number> = {};
     NYC_LOCATIONS.forEach(loc => initialHeatLevelsReset[loc] = 0);

    if (isMounted.current) {
        setGameState({ 
        playerStats: createInitialPlayerStats(user), 
        marketPrices: [], previousMarketPrices: [], localHeadlines: [], eventLog: [],
        isLoadingNextDay: false, isLoadingMarket: true, isGameOver: false, gameMessage: null,
        availableWeapons: [], availableArmor: [], availableHealingItems: [], availableCapacityUpgrades: [],
        activeBoroughEvents: {}, boroughHeatLevels: initialHeatLevelsReset, playerActivityInBoroughsThisDay: {},
        isBattleActive: false, currentEnemy: null, battleLog: [], battleMessage: null,
        });
        addLogEntry('info', 'Game reset.');
        fetchInitialData(); 
    }
  }, [fetchInitialData, addLogEntry, user]);

  return {
    ...gameState,
    buyDrug, sellDrug, buyWeapon, buyArmor, buyHealingItem, buyCapacityUpgrade, buyAmmoForEquippedWeapon,
    handleNextDay, resetGame, travelToLocation,
    startBattle, handlePlayerBattleAction, endBattleScreen,
  };
}
