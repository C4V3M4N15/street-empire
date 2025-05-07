
import type { PlayerStats, EnemyStats } from '@/types/game';
import { v4 as uuidv4 } from 'uuid';

/**
 * Represents the simplified outcome of a battle, used after the battle screen resolves.
 */
export interface BattleResult {
  playerWon: boolean;
  cashChange: number;
  reputationChange: number;
  narration: string; // A summary of what happened post-battle
}

const PLAYER_BASE_ATTACK = 5; // Example base attack if no weapon
const PLAYER_BASE_DEFENSE = 2; // Example base defense if no armor

/**
 * Generates stats for an enemy based on type and potentially player progression.
 * @param opponentType Type of opponent (police, gang, fiend).
 * @param playerStats Current stats of the player (can be used for scaling).
 * @returns An EnemyStats object.
 */
export function generateEnemyStats(opponentType: 'police' | 'gang' | 'fiend', playerStats: PlayerStats): EnemyStats {
  let enemy: Omit<EnemyStats, 'id' | 'spriteSeed' | 'health'>; // Health will be set to maxHealth
  // Gentler scaling: no increase for first 3 days, then slower ramp up.
  const difficultyScale = 1 + (Math.max(0, playerStats.daysPassed - 10) / 40); // Battles start day 11, scale slower


  switch (opponentType) {
    case 'police':
      enemy = {
        name: 'Beat Cop',
        maxHealth: Math.round((35 + Math.random() * 10) * difficultyScale),
        attack: Math.round((10 + Math.random() * 4) * difficultyScale),
        defense: Math.round((12 + Math.random() * 5) * difficultyScale),
        defeatCashReward: 0, 
        defeatRepReward: -10 - Math.floor(Math.random() * 5), // More rep loss for fighting cops
        bribable: true,
        bribeBaseCost: 200 + Math.floor(playerStats.cash * 0.05), // Costlier bribe
        bribeSuccessRate: 0.6, // Cops can be bribed
      };
      break;
    case 'gang':
      enemy = {
        name: 'Rival Gang Member',
        maxHealth: Math.round((45 + Math.random() * 15) * difficultyScale),
        attack: Math.round((12 + Math.random() * 5) * difficultyScale),
        defense: Math.round((10 + Math.random() * 4) * difficultyScale),
        defeatCashReward: 100 + Math.floor(Math.random() * 150),
        defeatRepReward: 8 + Math.floor(Math.random() * 12),
        bribable: true,
        bribeBaseCost: 150 + Math.floor(playerStats.cash * 0.03),
        bribeSuccessRate: 0.4, // Gangs harder to bribe
      };
      break;
    case 'fiend':
    default:
      enemy = {
        name: 'Desperate Fiend',
        maxHealth: Math.round((25 + Math.random() * 10) * difficultyScale), 
        attack: Math.round((6 + Math.random() * 4) * difficultyScale), 
        defense: Math.round((4 + Math.random() * 3) * difficultyScale),
        defeatCashReward: 20 + Math.floor(Math.random() * 30),
        defeatRepReward: 2 + Math.floor(Math.random() * 4),
        bribable: true,
        bribeBaseCost: 50 + Math.floor(playerStats.cash * 0.02),
        bribeSuccessRate: 0.75, // Fiends are desperate
      };
      break;
  }

  return {
    ...enemy,
    id: uuidv4(),
    health: enemy.maxHealth, // Start with full health
    spriteSeed: opponentType + enemy.name.replace(/\s/g, ''), 
  };
}

/**
 * Determines the outcome narration and rewards/penalties AFTER a battle is decided.
 * @param playerWon Did the player win?
 * @param enemyDefeated The enemy that was fought.
 * @param playerStats Current player stats.
 * @returns A BattleResult object.
 */
export function getBattleResultConsequences(playerWon: boolean, enemyDefeated: EnemyStats, playerStats: PlayerStats): BattleResult {
  if (playerWon) {
    const cashReward = enemyDefeated.defeatCashReward || 0;
    const repReward = enemyDefeated.defeatRepReward || 0;
    return {
      playerWon: true,
      cashChange: cashReward,
      reputationChange: repReward,
      narration: `You defeated the ${enemyDefeated.name}! You looted $${cashReward} and your reputation changed by ${repReward}.`,
    };
  } else {
    // Player lost
    const cashLossPercentage = 0.15 + Math.random() * 0.10; // Lose 15-25% cash
    const cashLost = Math.min(playerStats.cash, Math.floor(playerStats.cash * cashLossPercentage));
    const repLoss = - (8 + Math.floor(Math.random() * 12)); // More significant rep loss

    return {
      playerWon: false,
      cashChange: -cashLost,
      reputationChange: repLoss,
      narration: `You were defeated by the ${enemyDefeated.name}. You lost $${cashLost} and your reputation took a hit (${repLoss}).`,
    };
  }
}
