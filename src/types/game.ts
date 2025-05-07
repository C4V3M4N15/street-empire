
import type { DrugPrice, LocalHeadline } from '@/services/market';

export type PlayerRank = 
  | 'Rookie' 
  | 'Peddler' 
  | 'Dealer' 
  | 'Supplier' 
  | 'Distributor' 
  | 'Baron' 
  | 'Kingpin';

export interface PlayerStats {
  name: string;
  health: number;
  cash: number;
  inventory: { [drugName: string]: number }; // drugName -> quantity
  reputation: number;
  daysPassed: number;
  currentLocation: string;
  rank: PlayerRank;
}

export interface GameState {
  playerStats: PlayerStats;
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  isLoadingNextDay: boolean;
  isLoadingMarket: boolean;
  isGameOver: boolean;
  gameMessage: string | null; // For combat results or other events
}

