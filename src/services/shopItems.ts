
import type { Weapon } from '@/types/game';

export const AVAILABLE_WEAPONS: Weapon[] = [
  { name: 'Switchblade', price: 100, damageBonus: 3 },
  { name: '9MM', price: 500, damageBonus: 10 },
  { name: 'Switch (SMG)', price: 2500, damageBonus: 20 },
  { name: 'Combat Shotty', price: 5000, damageBonus: 35 },
  { name: 'RPG', price: 10000, damageBonus: 50 },
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
