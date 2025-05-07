
import type { PlayerStats } from '@/types/game';
import { simulateCombatEncounter, type CombatInput, type CombatOutput as GenkitCombatOutput } from '@/ai/flows/combat-flow';

/**
 * Represents the detailed outcome of a combat encounter.
 */
export interface CombatOutcome extends GenkitCombatOutput {}

/**
 * Asynchronously simulates a combat scenario by calling a Genkit flow.
 * @param opponentType Type of opponent (police, gang, fiend).
 * @param playerStats Current stats of the player.
 * @returns A promise that resolves to a CombatOutcome object.
 */
export async function simulateCombat(opponentType: 'police' | 'gang' | 'fiend', playerStats: PlayerStats): Promise<CombatOutcome> {
  const inventoryItems = Object.entries(playerStats.inventory)
    .filter(([, item]) => item.quantity > 0)
    // For simplicity, consider drugs with base price > 1000 as "valuable" for the prompt
    // This is a heuristic; a more sophisticated system might be needed
    .filter(([drugName]) => {
        const basePrices: Record<string, number> = {'Cocaine': 25000, 'Heroin': 15000, 'MDMA': 1500, 'Meth': 8000, 'Opium': 10000, 'Fentanyl': 50000, 'Crack': 1000};
        return (basePrices[drugName] || 0) > 1000;
    })
    .map(([drugName]) => drugName);

  const input: CombatInput = {
    opponentType,
    playerHealth: playerStats.health,
    playerCash: playerStats.cash,
    playerReputation: playerStats.reputation,
    playerInventoryItems: inventoryItems,
  };

  try {
    const result = await simulateCombatEncounter(input);
    return result;
  } catch (error) {
    console.error('Error simulating combat via Genkit flow:', error);
    // Fallback to a default loss scenario if the AI call fails
    return {
      playerWins: false,
      healthLost: Math.min(playerStats.health, 10 + Math.floor(Math.random() * 15)), // Lose 10-24 health, but not more than current
      cashChange: -Math.min(playerStats.cash, Math.floor(playerStats.cash * (Math.random() * 0.1 + 0.05))), // Lose 5-15% of cash
      reputationChange: - (1 + Math.floor(Math.random() * 5)), // Lose 1-5 rep
      narration: "The situation got messy and you barely escaped. Things didn't go your way.",
    };
  }
}
