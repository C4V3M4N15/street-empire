
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
  let enemy: Omit<EnemyStats, 'id' | 'spriteSeed'>;
  const difficultyScale = 1 + (playerStats.daysPassed / 50); // Simple scaling with days passed

  switch (opponentType) {
    case 'police':
      enemy = {
        name: 'Beat Cop',
        maxHealth: Math.round((30 + Math.random() * 10) * difficultyScale),
        attack: Math.round((8 + Math.random() * 4) * difficultyScale),
        defense: Math.round((10 + Math.random() * 5) * difficultyScale),
        defeatCashReward: 0, // Police don't typically drop cash
        defeatRepReward: -5 - Math.floor(Math.random() * 5), // Losing to police is bad for rep
      };
      break;
    case 'gang':
      enemy = {
        name: 'Rival Gang Member',
        maxHealth: Math.round((40 + Math.random() * 15) * difficultyScale),
        attack: Math.round((10 + Math.random() * 5) * difficultyScale),
        defense: Math.round((8 + Math.random() * 4) * difficultyScale),
        defeatCashReward: 50 + Math.floor(Math.random() * 100),
        defeatRepReward: 5 + Math.floor(Math.random() * 10),
      };
      break;
    case 'fiend':
    default:
      enemy = {
        name: 'Desperate Fiend',
        maxHealth: Math.round((20 + Math.random() * 10) * difficultyScale),
        attack: Math.round((5 + Math.random() * 3) * difficultyScale),
        defense: Math.round((3 + Math.random() * 3) * difficultyScale),
        defeatCashReward: 10 + Math.floor(Math.random() * 20),
        defeatRepReward: 1 + Math.floor(Math.random() * 3),
      };
      break;
  }

  return {
    ...enemy,
    id: uuidv4(),
    health: enemy.maxHealth,
    spriteSeed: opponentType + enemy.name.replace(/\s/g, ''), // Simple seed for placeholder
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
    return {
      playerWon: true,
      cashChange: enemyDefeated.defeatCashReward || 0,
      reputationChange: enemyDefeated.defeatRepReward || 0,
      narration: `You defeated the ${enemyDefeated.name}! You looted $${enemyDefeated.defeatCashReward || 0} and your reputation changed by ${enemyDefeated.defeatRepReward || 0}.`,
    };
  } else {
    // Player lost
    const cashLossPercentage = 0.1 + Math.random() * 0.15; // Lose 10-25% of cash
    const cashLost = Math.min(playerStats.cash, Math.floor(playerStats.cash * cashLossPercentage));
    const repLoss = - (5 + Math.floor(Math.random() * 10)); // Lose 5-14 rep

    return {
      playerWon: false,
      cashChange: -cashLost,
      reputationChange: repLoss,
      narration: `You were defeated by the ${enemyDefeated.name}. You lost $${cashLost} and your reputation took a hit (${repLoss}).`,
    };
  }
}
