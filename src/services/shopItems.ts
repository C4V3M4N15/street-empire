
import type { Weapon, Armor, HealingItem } from '@/types/game';

export const AVAILABLE_WEAPONS: Weapon[] = [
  { name: 'Switchblade', price: 150, damageBonus: 3 },      // Was $100
  { name: '9MM', price: 750, damageBonus: 10 },            // Was $500
  { name: 'Switch (SMG)', price: 3000, damageBonus: 20 },   // Was $2500
  { name: 'Combat Shotty', price: 7000, damageBonus: 35 },  // Was $5000
  { name: 'RPG', price: 15000, damageBonus: 50 },           // Was $10000
];

export const AVAILABLE_ARMOR: Armor[] = [
  { name: 'Jacket', price: 120, protectionBonus: 2 },             // Was $100
  { name: 'Leather Jacket', price: 600, protectionBonus: 5 },    // Was $450
  { name: 'Tac Vest', price: 2800, protectionBonus: 10 },        // Was $2200
  { name: 'Kevlar', price: 6500, protectionBonus: 18 },          // Was $4800
  { name: 'John Wick Suit', price: 13000, protectionBonus: 30 }, // Was $9500
];

export const AVAILABLE_HEALING_ITEMS: HealingItem[] = [
  { id: 'doctor_visit', name: 'Doctor Visit', price: 100, healAmount: 10, description: 'Heals 10 HP.' },
  { id: 'restful_visit', name: 'Restful Visit', price: 500, healAmount: 50, description: 'Heals 50 HP.' },
  { id: 'first_aid_kit', name: 'First Aid Kit', price: 1000, isFullHeal: true, description: 'Restores to full health.' },
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

