
import type { Weapon, Armor } from '@/types/game';

export const AVAILABLE_WEAPONS: Weapon[] = [
  { name: 'Switchblade', price: 100, damageBonus: 3 },
  { name: '9MM', price: 500, damageBonus: 10 },
  { name: 'Switch (SMG)', price: 2500, damageBonus: 20 },
  { name: 'Combat Shotty', price: 5000, damageBonus: 35 },
  { name: 'RPG', price: 10000, damageBonus: 50 },
];

export const AVAILABLE_ARMOR: Armor[] = [
  { name: 'Jacket', price: 100, protectionBonus: 2 },
  { name: 'Leather Jacket', price: 450, protectionBonus: 5 },
  { name: 'Tac Vest', price: 2200, protectionBonus: 10 },
  { name: 'Kevlar', price: 4800, protectionBonus: 18 },
  { name: 'John Wick Suit', price: 9500, protectionBonus: 30 },
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
