
import type { Weapon, Armor, HealingItem } from '@/types/game';

export const AVAILABLE_WEAPONS: Weapon[] = [
  { name: 'Switchblade', price: 100, damageBonus: 3 },
  { name: 'Baseball Bat', price: 250, damageBonus: 6 },
  { name: '9MM', price: 750, damageBonus: 10 },
  { name: 'Switch (SMG)', price: 3000, damageBonus: 20 },
  { name: 'Combat Shotty', price: 6000, damageBonus: 35 },
  { name: 'RPG', price: 12000, damageBonus: 50 },
];

export const AVAILABLE_ARMOR: Armor[] = [
  { name: 'Jacket', price: 150, protectionBonus: 2 },
  { name: 'Leather Jacket', price: 500, protectionBonus: 5 },
  { name: 'Bike Helmet & Pads', price: 1000, protectionBonus: 8 },
  { name: 'Tac Vest', price: 2800, protectionBonus: 12 },
  { name: 'Kevlar', price: 5500, protectionBonus: 20 },
  { name: 'John Wick Suit', price: 11000, protectionBonus: 30 },
];

export const AVAILABLE_HEALING_ITEMS: HealingItem[] = [
  { id: 'urgent_care_patch_up', name: 'Urgent Care Patch-up', price: 150, healAmount: 25, isPercentageHeal: true, description: 'Heals 25% of max HP.' },
  { id: 'back_alley_doc', name: 'Back Alley Doc', price: 600, healAmount: 60, isPercentageHeal: true, description: 'Heals 60% of max HP.' },
  { id: 'trauma_kit', name: 'Trauma Kit', price: 1200, isFullHeal: true, description: 'Restores to full health.' },
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

