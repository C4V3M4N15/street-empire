
import type { DrugPrice, LocalHeadline } from '@/services/market';

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
}
