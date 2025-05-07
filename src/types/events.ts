
/**
 * Defines the types of events that can occur.
 */
export type EventType =
  | 'police'
  | 'gang'
  | 'economy'
  | 'celebrity'
  | 'civil'
  | 'weather'
  | 'player_choice_required' // For events that might present a dilemma
  | 'story_beat' // For events that advance a narrative
  | 'generic';

/**
 * Defines the direct effects an event can have.
 */
export interface EventEffect {
  // Modifies price of specific drugs. factor: 1.1 for +10%, 0.9 for -10%
  drugPriceModifiers?: { drugName: string; factor: number }[];
  // Modifies price for categories of drugs.
  categoryPriceModifiers?: { categoryKey: keyof typeof import('@/services/eventService').drugCategories; factor: number }[];
  // New simpler price modifier: maps drug names directly to their price factors.
  // e.g., { "Cocaine": 0.8 } means Cocaine price becomes 80% of original.
  priceModifier?: Record<string, number>;
  // Change in the borough's heat level (e.g., +1, 0, -1 or larger values for significant events)
  heatChange?: number;
  // Direct impact on the player if they are in the event's borough
  playerImpact?: {
    message: string; // Message shown to the player
    healthChange?: number; // +/- value
    cashChange?: number; // +/- value
    reputationChange?: number; // +/- value
    // Specifies if combat should be triggered, and potentially the type/intensity
    triggerCombat?: 'police_raid' | 'gang_activity' | 'desperate_seller' | 'mugging' | 'fiend_encounter'; // Added fiend_encounter
    inventoryChange?: { itemName: string, quantityChange: number }[]; // Add/remove specific items from player inventory
  };
  // For branching events - defines possible choices and their outcomes/follow-up event IDs
  // This is a stub for future expansion, actual UI/logic for choices not yet implemented
  choices?: Array<{
    choiceText: string;
    outcomeDescription: string;
    effects?: EventEffect; // Effects specific to this choice
    nextEventId?: string; // ID of a follow-up event
  }>;
  // Potential follow-up event ID even without explicit choices
  followUpEventId?: string;
}

/**
 * Represents a dynamic event that can occur in a borough.
 */
export interface GameEvent {
  id: string; // Unique identifier for the event
  name: string; // Short name of the event (e.g., "Police Crackdown")
  text: string; // Descriptive text for the event (headline)
  type: EventType; // Category of the event
  description: string; // Longer description of the event broadcasted to the player or logged
  targetBoroughs?: string[]; // Specific boroughs this event can occur in. If undefined, can occur in any.
  effects: EventEffect;
  durationInDays?: number; // How many days the event lasts. Default 1 if undefined.
  // Conditions for this event to trigger (e.g., high player heat, specific day, previous event occurred)
  // This is a stub for future, more complex trigger logic.
  triggerConditions?: {
    minHeat?: number;
    maxHeat?: number;
    minDaysPassed?: number;
    requiresPreviousEvent?: string; // ID of an event that must have happened
    playerInventory?: { itemName: string, minQuantity: number };
  };
  isUnique?: boolean; // If true, this event can only happen once per game.
  isChainStart?: boolean; // Marks the beginning of a potential event chain.
}

