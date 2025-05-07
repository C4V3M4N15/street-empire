
import type { GameEvent, EventType } from '@/types/events';

// These should match the locations defined in useGameLogic or a shared constants file.
export const NYC_BOROUGHS_EVENTS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];

// Define drug categories for event effects (if still needed for some complex events)
// These names should match drug names in market.ts
export const drugCategories = {
  all: [], // Populated dynamically below
  stimulants: ['Cocaine', 'Meth', 'MDMA', 'Crack', 'Adderall'],
  opioids: ['Heroin', 'Opium', 'Fentanyl', 'OxyContin', 'Codeine Syrup'],
  psychedelics: ['LSD', 'Mushrooms', 'DMT', 'Mescaline', 'Ayahuasca Brew', 'Spice', 'PCP'],
  party: ['MDMA', 'Ketamine', 'LSD', 'Cocaine', 'GHB', 'Poppers (Amyl Nitrite)', 'Ecstasy (MDMA)'],
  prescription: ['Xanax', 'Valium', 'Adderall', 'OxyContin', 'Codeine Syrup'],
  cheap: ['Weed', 'Spice', 'Xanax', 'Valium', 'Poppers (Amyl Nitrite)'],
  expensive: ['Cocaine', 'Heroin', 'Fentanyl', 'DMT', 'OxyContin', 'Meth'],
};
const allDrugNamesForCategory = [
    'Weed', 'Cocaine', 'Heroin', 'MDMA', 'LSD', 'Meth', 'Mushrooms', 'Opium', 'Ketamine',
    'PCP', 'Xanax', 'Valium', 'Steroids', 'Fentanyl', 'Crack', 'Spice', 'GHB',
    'Rohypnol', 'Adderall', 'OxyContin', 'Codeine Syrup', 'Poppers (Amyl Nitrite)',
    'DMT', 'Mescaline', 'Ayahuasca Brew'
];
drugCategories.all = allDrugNamesForCategory;


// --- Event Pools ---
const genericEvents: GameEvent[] = [
  {
    id: 'generic_light_rain',
    name: 'Light Rain',
    text: 'Light rain falls over the city, making streets slick.',
    type: 'weather',
    description: 'A light drizzle is making the rounds. Not much impact, but the city looks grimier.',
    effects: { heatChange: 0, priceModifier: { 'Weed': 1.02 } } // Slightly up for staying in
  },
  {
    id: 'generic_economic_uptick',
    name: 'Economic Uptick',
    text: 'Positive economic news has people spending a bit more freely.',
    type: 'economy',
    description: 'Good times are rolling, or so they say. More cash flowing around.',
    effects: { heatChange: 0, priceModifier: { 'Cocaine': 1.05, 'MDMA': 1.03 } }
  },
   {
    id: 'generic_undercover_op_rumor',
    name: 'Undercover Op Rumor',
    text: "Whispers of undercover cops are making dealers nervous city-wide.",
    type: 'police',
    description: "There's a buzz about plainclothes officers. Everyone's a bit more cautious.",
    effects: {
        heatChange: 1, // Slight general heat increase
        priceModifier: { 'Heroin': 1.03, 'Meth': 1.03 } // Risk premium
    }
  }
];

const manhattanEvents: GameEvent[] = [
  {
    id: 'manhattan_wallstreet_raid_major',
    name: 'Major Wall Street Raid',
    text: 'SWAT teams hit multiple financial institutions in a massive crackdown on white-collar drug use.',
    type: 'police',
    description: 'The Financial District is crawling with feds. High-end drugs are risky business.',
    effects: {
      priceModifier: { 'Cocaine': 1.30, 'Adderall': 1.20, 'OxyContin': 1.15 },
      heatChange: 2, // Significant heat increase specific to this event
    }
  },
  {
    id: 'manhattan_celebrity_party_overdose',
    name: 'Celebrity Overdose Scandal',
    text: 'A-list celebrity overdose at a SoHo party. Media frenzy ensues.',
    type: 'celebrity',
    description: 'Paparazzi are everywhere after a celebrity OD. Party drugs are under scrutiny.',
    effects: {
      priceModifier: { 'MDMA': 0.9, 'Ketamine': 0.92, 'LSD': 1.1 }, // Some down due to bad press, LSD up for 'spiritual' alternatives
      heatChange: 1,
    }
  },
  {
    id: 'manhattan_un_summit_security',
    name: 'UN Summit Security',
    text: 'Midtown locked down for a UN summit. Police presence is overwhelming.',
    type: 'civil',
    description: 'Good luck moving anything through Midtown with this level of security for the UN summit.',
    effects: {
        heatChange: 2,
        priceModifier: { 'Weed': 1.1, 'Cocaine': 1.15, 'Heroin': 1.12 } // Harder to move anything
    }
  }
];

const brooklynEvents: GameEvent[] = [
  {
    id: 'brooklyn_warehouse_fire',
    name: 'Warehouse Fire in Bushwick',
    text: 'Massive warehouse fire in Bushwick destroys suspected drug lab. Certain supplies affected.',
    type: 'civil',
    description: 'A huge fire in Bushwick is making headlines. Rumor has it a major lab went up.',
    effects: {
      priceModifier: { 'Meth': 1.25, 'Spice': 1.20, 'MDMA': 1.15 },
      heatChange: 1,
    }
  },
  {
    id: 'brooklyn_hipster_festival',
    name: 'Hipster Music Festival',
    text: 'Williamsburg overrun by a massive indie music festival. Demand for "boutique" drugs spikes.',
    type: 'civil',
    description: 'Thousands of hipsters in Williamsburg for a music fest. They want the good stuff.',
    effects: {
        priceModifier: { 'Weed': 1.15, 'Mushrooms': 1.20, 'LSD': 1.18, 'Ketamine': 1.10 },
        heatChange: -1, // Police busy with crowd control
    }
  },
  {
    id: 'brooklyn_gang_truce_meeting',
    name: 'Gang Truce Meeting',
    text: 'Rival Brooklyn gangs reportedly holding a truce meeting. Streets unusually quiet.',
    type: 'gang',
    description: 'Word is the big gangs in BK are talking peace. Might be easier to operate for a bit.',
    effects: {
        heatChange: -2,
        priceModifier: { 'Crack': 0.95, 'Heroin': 0.97 } // Less territorial disputes, slightly easier supply
    }
  }
];

const queensEvents: GameEvent[] = [
  {
    id: 'queens_airport_security_tech',
    name: 'New Airport Security Tech',
    text: 'JFK and LaGuardia roll out advanced new scanners. Smuggling routes hit hard.',
    type: 'police',
    description: 'Getting anything through the airports in Queens just got a lot harder thanks to new tech.',
    effects: {
      priceModifier: { 'Cocaine': 1.20, 'Heroin': 1.18, 'Fentanyl': 1.25 }, // Affects imports
      heatChange: 2,
    }
  },
  {
    id: 'queens_cultural_festival',
    name: 'Large Cultural Festival',
    text: 'A major ethnic cultural festival in Flushing draws huge crowds. Specific demands up.',
    type: 'civil',
    description: 'Flushing is packed for a cultural fest. Some niche markets are buzzing.',
    effects: {
        priceModifier: { 'Opium': 1.15, 'Ketamine': 1.10 }, // Example niche demands
        heatChange: 0,
    }
  }
];

const bronxEvents: GameEvent[] = [
  {
    id: 'bronx_gang_leader_arrested',
    name: 'Major Gang Leader Arrested',
    text: 'High-profile Bronx gang leader busted in a pre-dawn raid. Power vacuum emerging.',
    type: 'gang',
    description: 'The arrest of a top gang figure in The Bronx has thrown the underworld into chaos.',
    effects: {
      priceModifier: { 'Crack': 1.10, 'PCP': 1.08, 'Heroin': 1.05 }, // Disruption and infighting
      heatChange: 1,
      playerImpact: {
        message: 'Streets in The Bronx are tense after a big arrest. Could be dangerous, could be opportunity.',
        triggerCombat: 'gang_activity'
      }
    }
  },
  {
    id: 'bronx_community_watch_boost',
    name: 'Community Watch Expansion',
    text: 'Several Bronx neighborhoods receive funding to expand community watch programs.',
    type: 'civil',
    description: 'More eyes on the street in The Bronx as community watch groups get a boost.',
    effects: {
        heatChange: 1,
        priceModifier: { 'Weed': 1.05, 'Crack': 1.07 } // Harder for street-level dealing
    }
  }
];

const statenIslandEvents: GameEvent[] = [
  {
    id: 'staten_ferry_drug_dog_patrols',
    name: 'Ferry Drug Dog Patrols',
    text: 'Increased K9 units patrolling Staten Island Ferry. Smuggling significantly harder.',
    type: 'police',
    description: 'Drug dogs are all over the S.I. Ferry terminals. Moving anything by boat is risky.',
    effects: {
      heatChange: 2,
      priceModifier: { 'Weed': 1.15, 'Cocaine': 1.12, 'Heroin': 1.10 } // Affects anything moved via ferry
    }
  },
  {
    id: 'staten_island_storm_surge',
    name: 'Coastal Storm Surge',
    text: 'Coastal storm surge warnings for Staten Island. Ferry services disrupted, some roads flooded.',
    type: 'weather',
    description: 'Bad weather hitting Staten Island. Transport is a mess.',
    effects: {
        heatChange: 0,
        priceModifier: { 'Fentanyl': 1.08, 'Meth': 1.05 } // Harder to get specific supplies in
    }
  }
];


// Combine generic events with borough-specific ones for the final pools
const boroughEventPools: Record<string, GameEvent[]> = {
  "Manhattan": [...genericEvents, ...manhattanEvents],
  "Brooklyn": [...genericEvents, ...brooklynEvents],
  "Queens": [...genericEvents, ...queensEvents],
  "The Bronx": [...genericEvents, ...bronxEvents],
  "Staten Island": [...genericEvents, ...statenIslandEvents],
};

/**
 * Gets the randomly selected event for each borough for the current day.
 * There's a chance no specific event occurs in a borough.
 * @returns A Promise resolving to a Record where keys are borough names and values are GameEvent or null.
 */
export async function getTodaysEvents(): Promise<Record<string, GameEvent | null>> {
  // Simulate async operation if needed in future (e.g., fetching from a dynamic source)
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));

  const dailyEvents: Record<string, GameEvent | null> = {};

  for (const borough of NYC_BOROUGHS_EVENTS) {
    const pool = boroughEventPools[borough];
    if (pool && pool.length > 0) {
      // Add a chance for NO event to occur in a borough for variety (e.g., 25% chance of no specific event, gets a generic one or null)
      if (Math.random() > 0.25) { // 75% chance of a specific/generic borough event
        const randomIndex = Math.floor(Math.random() * pool.length);
        dailyEvents[borough] = pool[randomIndex];
      } else { // 25% chance of a more generic or no event
        // Fallback to a purely generic event if no borough-specific one is picked
        if (genericEvents.length > 0 && Math.random() > 0.5) { // 50% of this 25% gets a generic
             const randomIndex = Math.floor(Math.random() * genericEvents.length);
             dailyEvents[borough] = genericEvents[randomIndex];
        } else {
            dailyEvents[borough] = null; // No specific event for this borough today
        }
      }
    } else {
      // If no pool defined, try to assign a generic event or null
      if (genericEvents.length > 0 && Math.random() > 0.3) {
           const randomIndex = Math.floor(Math.random() * genericEvents.length);
           dailyEvents[borough] = genericEvents[randomIndex];
      } else {
          dailyEvents[borough] = null;
      }
    }
  }
  return dailyEvents;
}
