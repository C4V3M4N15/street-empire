
'use server';
/**
 * @fileOverview A Genkit flow to simulate combat encounters in the game.
 *
 * - simulateCombatEncounter - A function that handles the combat simulation.
 * - CombatInput - The input type for the simulateCombatEncounter function.
 * - CombatOutput - The return type for the simulateCombatEncounter function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CombatInputSchema = z.object({
  opponentType: z.enum(['police', 'gang', 'fiend']).describe('The type of opponent the player is facing.'),
  playerHealth: z.number().int().min(0).describe("Player's current health points."),
  playerCash: z.number().int().min(0).describe("Player's current cash amount."),
  playerReputation: z.number().int().describe("Player's current reputation score."),
  playerInventoryItems: z.array(z.string()).describe('Names of valuable drugs the player is currently carrying (e.g., ["Cocaine", "Heroin"]). Empty if carrying none or only low-value items.'),
});
export type CombatInput = z.infer<typeof CombatInputSchema>;

const CombatOutputSchema = z.object({
  playerWins: z.boolean().describe('True if the player wins the encounter, false otherwise.'),
  healthLost: z.number().int().min(0).describe('Amount of health the player loses. Can be 0.'),
  cashChange: z.number().int().describe('Change in player cash. Negative for loss (e.g., robbed, fined), positive for gain (e.g., found cash). Can be 0.'),
  reputationChange: z.number().int().describe('Change in player reputation. Negative for loss, positive for gain. Can be 0.'),
  narration: z.string().describe('A short, engaging narration of the combat encounter and its outcome (1-2 sentences).'),
});
export type CombatOutput = z.infer<typeof CombatOutputSchema>;

export async function simulateCombatEncounter(input: CombatInput): Promise<CombatOutput> {
  return combatFlow(input);
}

const combatPrompt = ai.definePrompt({
  name: 'combatPrompt',
  input: {schema: CombatInputSchema},
  output: {schema: CombatOutputSchema},
  prompt: `You are a creative game master for a gritty street dealing simulator game called "Street Empire".
A player encounters an opponent. Based on the player's status and the opponent type, determine the outcome of this encounter.

Player Status:
- Health: {{playerHealth}}
- Cash: ${{playerCash}}
- Reputation: {{playerReputation}}
- Carrying: {{#if playerInventoryItems}}{{#each playerInventoryItems}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}{{else}}nothing significant{{/if}}

Opponent Type: {{opponentType}}

Consider these general guidelines for outcomes based on opponent type:
- Police: High risk of cash loss (confiscation, fines), or item confiscation. Low to moderate health loss if resisting. Reputation might decrease if caught. Player might try to bribe or run.
- Gang: Medium to high risk of health loss in a fight. Risk of cash/inventory loss. Winning against a gang could increase reputation significantly, losing could decrease it.
- Fiend: Low to medium risk of health loss (desperate attack). Small risk of cash/item loss (petty theft). Player might scare them off or get jumped.

Narrate the encounter and its result in 1-2 sentences. Be descriptive and maintain a gritty, street-wise tone.
Determine if the player wins, how much health they lose (0 if none), the change in their cash (negative for loss, positive for gain, 0 if no change), and the change in their reputation.
Ensure healthLost does not exceed playerHealth. If playerHealth is very low, they are more likely to lose or suffer more. High reputation might deter weaker opponents or attract stronger ones. Carrying valuable items makes the player a bigger target.
If player loses all their cash, cashChange should make their cash 0, not negative.

Example Narration: "A couple of beat cops tried to shake you down. You slipped them a 'donation' of $200 and they looked the other way, but your rep took a small hit."
Example Narration: "You ran into some rival gang members. After a tense standoff, a brutal fight erupted. You managed to fight them off, gaining some rep, but took a beating and lost 15 health."
Example Narration: "A desperate fiend tried to jump you for your stash. You easily overpowered them, and they ran off, dropping $50 in their haste."

Produce the outcome:
`,
});

const combatFlow = ai.defineFlow(
  {
    name: 'combatFlow',
    inputSchema: CombatInputSchema,
    outputSchema: CombatOutputSchema,
  },
  async (input) => {
    const {output} = await combatPrompt(input);
    if (!output) {
      // Fallback in case LLM fails to generate structured output
      // This is a simple fallback, ideally, you'd have more robust error handling or retry logic
      return {
        playerWins: Math.random() > 0.5,
        healthLost: Math.floor(Math.random() * 20),
        cashChange: 0,
        reputationChange: 0,
        narration: "The encounter was chaotic and confusing. You're not sure what happened.",
      };
    }
    // Ensure healthLost doesn't exceed current health or become negative
    output.healthLost = Math.max(0, Math.min(input.playerHealth, output.healthLost));
    
    // Ensure cash doesn't go below zero due to cashChange
    if (input.playerCash + output.cashChange < 0) {
      output.cashChange = -input.playerCash; // Lose all cash
    }

    return output;
  }
);
