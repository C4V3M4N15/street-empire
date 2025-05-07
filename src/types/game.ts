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
  damageBonus: number; // Damage added to base player damage
  isFirearm?: boolean; // True if the weapon uses ammo
  clipSize?: number;   // Number of bullets in a full clip
}

export interface Armor {
  id: string; // Unique ID for the armor piece
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
  equippedWeapon: Weapon | null;
  equippedWeaponAmmo: { // Ammo details for the equipped weapon if it's a firearm
    currentInClip: number;
    reserveAmmo: number; // Total bullets in reserve, not number of clips
  } | null;
  equippedArmor: Armor | null;
  purchasedUpgradeIds: string[];
  purchasedArmorIds: string[];
  travelsThisDay: number; // Number of travels made in the current day
}

export interface EnemyStats {
  id: string;
  name: string;
  health: number;
  maxHealth: number;
  attack: number;
  defense: number;
  spriteSeed?: string;
  defeatCashReward?: number;
  defeatRepReward?: number;
  bribable?: boolean; // Can this enemy type be bribed?
  bribeBaseCost?: number; // Base cost to attempt a bribe
  bribeSuccessRate?: number; // Base success rate (0.0 to 1.0)
}

export type LogEventType =
  | 'buy'
  | 'sell'
  | 'travel'
  | 'combat_win'
  | 'combat_loss'
  | 'health_update'
  | 'rank_up'
  | 'game_over'
  | 'shop_weapon_purchase'
  | 'shop_armor_purchase'
  | 'shop_healing_purchase'
  | 'shop_capacity_upgrade'
  | 'shop_ammo_purchase'
  | 'event_trigger'
  | 'event_player_impact'
  | 'battle_action'
  | 'bribe_attempt'
  | 'info';

export interface LogEntry {
  id: string;
  timestamp: string;
  type: LogEventType;
  message: string;
}

export interface GameState {
  playerStats: PlayerStats;
  marketPrices: DrugPrice[];
  previousMarketPrices: DrugPrice[];
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
  battleLog: LogEntry[];
  battleMessage: string | null;
}

export type PlayerBattleActionType = 'attack' | 'flee' | 'bribe';
