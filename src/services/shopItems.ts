
import type { Weapon, Armor, HealingItem, CapacityUpgrade } from '@/types/game';

export const AVAILABLE_WEAPONS: Weapon[] = [
  { name: 'Switchblade', price: 100, damageBonus: 3 },
  { name: 'Baseball Bat', price: 250, damageBonus: 6 },
  { name: '9MM', price: 750, damageBonus: 10 },
  { name: 'Switch (SMG)', price: 3000, damageBonus: 20 },
  { name: 'Combat Shotty', price: 6000, damageBonus: 35 },
  { name: 'RPG', price: 12000, damageBonus: 50 },
];

export const AVAILABLE_ARMOR: Armor[] = [
  { id: 'jacket', name: 'Jacket', price: 150, protectionBonus: 2 },
  { id: 'leather_jacket', name: 'Leather Jacket', price: 500, protectionBonus: 5 },
  { id: 'bike_gear', name: 'Bike Helmet & Pads', price: 1000, protectionBonus: 8 },
  { id: 'tac_vest', name: 'Tac Vest', price: 2800, protectionBonus: 12 },
  { id: 'kevlar', name: 'Kevlar', price: 5500, protectionBonus: 20 },
  { id: 'john_wick_suit', name: 'John Wick Suit', price: 11000, protectionBonus: 30 },
];

export const AVAILABLE_HEALING_ITEMS: HealingItem[] = [
  { id: 'urgent_care_patch_up', name: 'Urgent Care Patch-up', price: 150, healAmount: 25, isPercentageHeal: true, description: 'Heals 25% of max HP.' },
  { id: 'back_alley_doc', name: 'Back Alley Doc', price: 600, healAmount: 60, isPercentageHeal: true, description: 'Heals 60% of max HP.' },
  { id: 'trauma_kit', name: 'Trauma Kit', price: 1200, isFullHeal: true, description: 'Restores to full health.' },
];

export const AVAILABLE_CAPACITY_UPGRADES: CapacityUpgrade[] = [
  { id: 'backpack', name: 'Backpack', price: 250, capacityIncrease: 20, description: 'A sturdy backpack to carry more product.' },
  { id: 'stash_box', name: 'Stash Box', price: 500, capacityIncrease: 50, description: 'A hidden stash box for extra storage.' },
  { id: 'trap_house_closet', name: 'Trap House Closet', price: 1000, capacityIncrease: 100, description: 'Secure a closet in a trap house for serious volume.' },
];

/**
 * Retrieves the list of available weapons in the shop.
 * Currently returns a static list.
 * @returns An array of Weapon objects.
 */
export async function getShopWeapons(): Promise<Weapon[]> {
  // Simulate API call delay if this were dynamic
  await new Promise(resolve => setTimeout(resolve, 100));
  return AVAILABLE_WEAPONS;
}

/**
 * Retrieves the list of available armor in the shop.
 * Currently returns a static list.
 * @returns An array of Armor objects.
 */
export async function getShopArmor(): Promise<Armor[]> {
  // Simulate API call delay if this were dynamic
  await new Promise(resolve => setTimeout(resolve, 100));
  return AVAILABLE_ARMOR;
}

/**
 * Retrieves the list of available healing items in the shop.
 * Currently returns a static list.
 * @returns An array of HealingItem objects.
 */
export async function getShopHealingItems(): Promise<HealingItem[]> {
  // Simulate API call delay if this were dynamic
  await new Promise(resolve => setTimeout(resolve, 100));
  return AVAILABLE_HEALING_ITEMS;
}

/**
 * Retrieves the list of available capacity upgrades in the shop.
 * Currently returns a static list.
 * @returns An array of CapacityUpgrade objects.
 */
export async function getShopCapacityUpgrades(): Promise<CapacityUpgrade[]> {
  // Simulate API call delay if this were dynamic
  await new Promise(resolve => setTimeout(resolve, 100));
  return AVAILABLE_CAPACITY_UPGRADES;
}
