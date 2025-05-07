
import type { DrugPrice, LocalHeadline } from '@/services/market';
import type { GameEvent } from '@/types/events';

export type PlayerRank =
  | 'Rookie'
  | 'Peddler'
  | 'Dealer'
  | 'Supplier'
  | 'Distributor'
  | 'Baron'
  | 'Kingpin';

export interface InventoryItem {
  quantity: number;
  totalCost: number; // Total amount spent to acquire this quantity
}

export interface Weapon {
  name: string;
  price: number;
  damageBonus: number; // Damage added to base player damage (1 for fists)
}

export interface Armor {
  name: string;
  price: number;
  protectionBonus: number; // Represents damage reduction or protection points
}

export interface HealingItem {
  id: string; // Unique ID for the item
  name: string;
  price: number;
  description: string;
  healAmount?: number;    // Amount if fixed OR percentage value if isPercentageHeal is true
  isPercentageHeal?: boolean; // True if healAmount represents a percentage of max health
  isFullHeal?: boolean; // True if this item restores to full health
}

export interface CapacityUpgrade {
  id: string;
  name: string;
  price: number;
  capacityIncrease: number;
  description: string;
}

export interface PlayerStats {
  name: string;
  health: number;
  cash: number;
  inventory: { [drugName: string]: InventoryItem }; // drugName -> InventoryItem
  reputation: number;
  daysPassed: number;
  currentLocation: string;
  rank: PlayerRank;
  maxInventoryCapacity: number; // Maximum number of drug units player can carry
  equippedWeapon: Weapon | null; // Player's current weapon, null for fists
  equippedArmor: Armor | null; // Player's current armor, null for no armor
  purchasedUpgradeIds: string[]; // IDs of one-time capacity upgrades purchased
}

export interface EnemyStats {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spriteSeed?: string; // For generating a consistent placeholder image
  defeatCashReward?: number;
  defeatRepReward?: number;
}

export type LogEventType =
  | 'buy'
  | 'sell'
  | 'travel'
  | 'combat_win'
  | 'combat_loss'
  | 'health_update' // More generic for health changes
  | 'rank_up'
  | 'game_over'
  | 'shop_weapon_purchase'
  | 'shop_armor_purchase'
  | 'shop_healing_purchase'
  | 'shop_capacity_upgrade' // New log type for capacity upgrades
  | 'event_trigger' // For borough-wide events affecting the environment
  | 'event_player_impact' // For events directly impacting the player
  | 'battle_action' // For individual actions within a battle
  | 'info'; // General information

export interface LogEntry {
  id: string; // Unique ID for key prop
  timestamp: string; // ISO string for simplicity, can be formatted
  type: LogEventType;
  message: string;
}

export interface GameState {
  playerStats: PlayerStats;
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  eventLog: LogEntry[];
  isLoadingNextDay: boolean;
  isLoadingMarket: boolean;
  isGameOver: boolean;
  gameMessage: string | null;
  availableWeapons: Weapon[];
  availableArmor: Armor[];
  availableHealingItems: HealingItem[];
  availableCapacityUpgrades: CapacityUpgrade[]; 
  activeBoroughEvents: Record<string, GameEvent | null>; 
  boroughHeatLevels: Record<string, number>; 
  playerActivityInBoroughsThisDay: Record<string, number>; 
  
  // Battle State
  isBattleActive: boolean;
  currentEnemy: EnemyStats | null;
  battleLog: LogEntry[]; // Specific log for the current battle
  battleMessage: string | null; // Message to display on battle screen (e.g., victory/defeat)
}
