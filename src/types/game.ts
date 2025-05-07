
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
  reputation: number;
  daysPassed: number;
  currentLocation: string;
  rank: PlayerRank;
  // Future: inventory: { [drugName: string]: number };
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
