/**
 * Defines the direct effects an event can have.
 */
export interface EventEffect {
  // Modifies price of specific drugs. factor: 1.1 for +10%, 0.9 for -10%
  drugPriceModifiers?: { drugName: string; factor: number }[];
  // Modifies price for categories of drugs.
  categoryPriceModifiers?: { category: string[]; factor: number }[];
  // Change in the borough's heat level (e.g., +10, -5)
  heatChange?: number;
  // Direct impact on the player if they are in the event's borough
  playerImpact?: {
    message: string; // Message shown to the player
    healthChange?: number; // +/- value
    cashChange?: number; // +/- value
    reputationChange?: number; // +/- value (if reputation system is expanded)
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
  description: string; // Description of the event broadcasted to the player or logged
  targetBoroughs?: string[]; // Specific boroughs this event can occur in. If undefined, can occur in any.
  effects: EventEffect;
  // durationInDays?: number; // How many days the event lasts. Default 1 if undefined.
  // For now, all events will be considered to last for the current day only.
}