
import type { PlayerStats } from '@/types/game';
// import { simulateCombatEncounter, type CombatInput, type CombatOutput as GenkitCombatOutput } from '@/ai/flows/combat-flow'; // AI related import

/**
 * Represents the detailed outcome of a combat encounter.
 */
// Ensure CombatOutcome matches the structure expected by useGameLogic if GenkitCombatOutput is not used.
// If GenkitCombatOutput was defining this structure, and it's removed, CombatOutcome needs to be explicitly defined
// or take fields from a hardcoded structure.
// For now, assuming CombatOutcome is { playerWins: boolean, healthLost: number, cashChange: number, reputationChange: number, narration: string }
// as per the hardcoded outcomes.
export interface CombatOutcome {
  playerWins: boolean;
  healthLost: number;
  cashChange: number;
  reputationChange: number;
  narration: string;
}


/**
 * Asynchronously simulates a combat scenario.
 * This version uses hardcoded outcomes.
 * @param opponentType Type of opponent (police, gang, fiend).
 * @param playerStats Current stats of the player.
 * @returns A promise that resolves to a CombatOutcome object.
 */
export async function simulateCombat(opponentType: 'police' | 'gang' | 'fiend', playerStats: PlayerStats): Promise<CombatOutcome> {
  // Define hardcoded combat outcomes for each opponent type
  const combatOutcomes: { [key: string]: CombatOutcome[] } = {
    police: [
      {
        playerWins: true,
        healthLost: 0,
        cashChange: -Math.min(playerStats.cash, Math.floor(Math.random() * 100 + 50)), // Fine 50-150
        reputationChange: - (1 + Math.floor(Math.random() * 3)), // Lose 1-3 rep
        narration: "You managed to talk your way out of trouble with the cops, but it cost you a 'donation'.",
      },
      {
        playerWins: false,
        healthLost: Math.min(playerStats.health, Math.floor(Math.random() * 10 + 5)), // Lose 5-14 health
        cashChange: -Math.min(playerStats.cash, Math.floor(playerStats.cash * (Math.random() * 0.1 + 0.05))), // Lose 5-15% cash
        reputationChange: -(3 + Math.floor(Math.random() * 5)), // Lose 3-7 rep
        narration: "The police busted you. You lost some cash and took a beating to your reputation.",
      },
       {
        playerWins: true, // Escaped
        healthLost: 0,
        cashChange: 0,
        reputationChange: 1 + Math.floor(Math.random() * 2), // Small rep boost for evading
        narration: "You spotted the cops and made a daring escape!",
      },
    ],
    gang: [
      {
        playerWins: true,
        healthLost: Math.min(playerStats.health, Math.floor(Math.random() * 15 + 10)), // Lose 10-24 health
        cashChange: Math.floor(Math.random() * 200 + 100), // Gain 100-300 cash
        reputationChange: (5 + Math.floor(Math.random() * 10)), // Gain 5-14 rep
        narration: "You clashed with a rival gang and came out on top, taking their cash and earning respect.",
      },
      {
        playerWins: false,
        healthLost: Math.min(playerStats.health, Math.floor(Math.random() * 20 + 15)), // Lose 15-34 health
        cashChange: -Math.min(playerStats.cash, Math.floor(playerStats.cash * (Math.random() * 0.15 + 0.1))), // Lose 10-25% cash
        reputationChange: -(5 + Math.floor(Math.random() * 8)), // Lose 5-12 rep
        narration: "A rival gang got the drop on you. You lost cash, took a beating, and your rep suffered.",
      },
      {
        playerWins: playerStats.reputation > 50, // Higher rep might allow avoiding fight
        healthLost: 0,
        cashChange: 0,
        reputationChange: playerStats.reputation > 50 ? (1 + Math.floor(Math.random() * 3)) : -(1 + Math.floor(Math.random() * 2)),
        narration: playerStats.reputation > 50 ? "Your reputation preceded you, and the rival gang decided to back down." : "A tense standoff with a rival gang ended with them sneering and walking away. You lost a bit of face.",
      }
    ],
    fiend: [
      {
        playerWins: true,
        healthLost: 0,
        cashChange: Math.floor(Math.random() * 50 + 10), // Gain 10-60
        reputationChange: (1 + Math.floor(Math.random() * 2)), // Gain 1-2 rep
        narration: "You easily scared off a desperate fiend. They dropped some pocket change.",
      },
      {
        playerWins: false,
        healthLost: Math.min(playerStats.health, Math.floor(Math.random() * 10 + 1)), // Lose 1-10 health
        cashChange: -Math.min(playerStats.cash, Math.floor(Math.random() * 30 + 5)), // Lose 5-35
        reputationChange: -(1 + Math.floor(Math.random() * 2)), // Lose 1-2 rep
        narration: "A fiend caught you off guard and managed to snatch some cash after a brief scuffle.",
      },
    ],
  };

  const outcomesForOpponent = combatOutcomes[opponentType];
  if (!outcomesForOpponent || outcomesForOpponent.length === 0) {
    // Fallback if something goes wrong, though it shouldn't with hardcoded types
    return {
      playerWins: false,
      healthLost: 0,
      cashChange: 0,
      reputationChange: 0,
      narration: "An uneventful encounter.",
    };
  }

  const randomIndex = Math.floor(Math.random() * outcomesForOpponent.length);
  let selectedOutcome = { ...outcomesForOpponent[randomIndex] }; // Clone to modify

  // Ensure healthLost doesn't exceed current health
  selectedOutcome.healthLost = Math.min(playerStats.health, selectedOutcome.healthLost);
  
  // Ensure cash doesn't go below zero due to cashChange
  if (playerStats.cash + selectedOutcome.cashChange < 0) {
    selectedOutcome.cashChange = -playerStats.cash; // Lose all cash
  }

  return selectedOutcome;
}


/*
// PREVIOUS AI INTEGRATION (Example, currently inactive)
// import { simulateCombatEncounter, type CombatInput, type CombatOutput as GenkitCombatOutput } from '@/ai/flows/combat-flow';

export async function simulateCombat_AI(opponentType: 'police' | 'gang' | 'fiend', playerStats: PlayerStats): Promise<CombatOutcome> {
  const inventoryItems = Object.entries(playerStats.inventory)
    .filter(([, item]) => item.quantity > 0)
    .filter(([drugName]) => {
        // Base prices for determining "valuable" items for the prompt
        // These should be kept in sync with market.ts if AI is re-enabled
        const basePrices: Record<string, number> = {
            'Cocaine': 13000,  // Was 18000
            'Heroin': 9000,   // Was 12000
            'MDMA': 1500,
            'Meth': 4500,     // Was 6000
            'Opium': 5000,    // Was 7000
            'Fentanyl': 15000, // Was 20000
            'Crack': 1000,
            'Weed': 300,
            'LSD': 800,
            'Mushrooms': 500,
            'Ketamine': 2000,
            'PCP': 1200,
            'Xanax': 50,
            'Valium': 40,
            'Steroids': 300,
        };
        return (basePrices[drugName] || 0) > 1000; // Example: valuable if base price > 1000
    })
    .map(([drugName]) => drugName);

  const input: any = { // Replace 'any' with CombatInput if re-enabling
    opponentType,
    playerHealth: playerStats.health,
    playerCash: playerStats.cash,
    playerReputation: playerStats.reputation,
    playerInventoryItems: inventoryItems,
  };

  try {
    // const result = await simulateCombatEncounter(input); // AI Call
    // return result;
    throw new Error("AI simulation is currently disabled."); // Placeholder
  } catch (error) {
    console.error('Error simulating combat via Genkit flow:', error);
    // Fallback to a default loss scenario if the AI call fails
    return {
      playerWins: false,
      healthLost: Math.min(playerStats.health, 10 + Math.floor(Math.random() * 15)),
      cashChange: -Math.min(playerStats.cash, Math.floor(playerStats.cash * (Math.random() * 0.1 + 0.05))),
      reputationChange: - (1 + Math.floor(Math.random() * 5)),
      narration: "The situation got messy and you barely escaped. Things didn't go your way (AI fallback).",
    };
  }
}
*/
