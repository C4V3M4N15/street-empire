
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
  | 'generic'; // Added generic for events not fitting other categories

/**
 * Defines the direct effects an event can have.
 */
export interface EventEffect {
  // Modifies price of specific drugs. factor: 1.1 for +10%, 0.9 for -10%
  drugPriceModifiers?: { drugName: string; factor: number }[];
  // Modifies price for categories of drugs.
  categoryPriceModifiers?: { category: string[]; factor: number }[];
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
    triggerCombat?: 'police_raid' | 'gang_activity' | 'desperate_seller' | 'mugging';
  };
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
  // durationInDays?: number; // How many days the event lasts. Default 1 if undefined.
  // For now, all events will be considered to last for the current day only.
}
