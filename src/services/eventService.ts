import type { GameEvent } from '@/types/events';

// These should match the locations defined in useGameLogic or a shared constants file.
export const NYC_BOROUGHS_EVENTS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];

// Define drug categories for event effects
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
// Placeholder for all drug names - ideally get this from market.ts ALL_DRUGS
// For now, let's list them manually to avoid circular deps or complex loading.
const allDrugNamesForCategory = [
    'Weed', 'Cocaine', 'Heroin', 'MDMA', 'LSD', 'Meth', 'Mushrooms', 'Opium', 'Ketamine',
    'PCP', 'Xanax', 'Valium', 'Steroids', 'Fentanyl', 'Crack', 'Spice', 'GHB',
    'Rohypnol', 'Adderall', 'OxyContin', 'Codeine Syrup', 'Poppers (Amyl Nitrite)',
    'DMT', 'Mescaline', 'Ayahuasca Brew'
];
drugCategories.all = allDrugNamesForCategory;


// --- Event Pools ---
// Generic events that can happen in any borough
const genericEvents: GameEvent[] = [
  {
    id: 'generic_increased_patrols',
    name: 'Increased Patrols',
    description: 'Police presence seems higher than usual across the city today.',
    effects: { heatChange: 5, categoryPriceModifiers: [{ category: drugCategories.cheap, factor: 1.05 }] }
  },
  {
    id: 'generic_supply_rumor_good',
    name: 'Supply Rumor (Good)',
    description: 'Word on the street is a big shipment made it through. Prices might dip.',
    effects: { categoryPriceModifiers: [{ category: drugCategories.all, factor: 0.95 }], heatChange: -2 }
  },
  {
    id: 'generic_supply_rumor_bad',
    name: 'Supply Rumor (Bad)',
    description: 'Chatter about a major bust has sellers spooked. Prices could climb.',
    effects: { categoryPriceModifiers: [{ category: drugCategories.all, factor: 1.05 }], heatChange: 3 }
  },
  {
    id: 'generic_undercover_op',
    name: 'Undercover Operation',
    description: "There's a buzz about undercover cops working the streets. Everyone's on edge.",
    effects: {
        heatChange: 10,
        playerImpact: {
            message: "Be extra careful, word is plainclothes officers are active in this area.",
            // No direct combat, but heat increases risk
        }
    }
  }
];

const manhattanEvents: GameEvent[] = [
  {
    id: 'manhattan_wallstreet_raid',
    name: 'Wall Street Raid',
    description: 'Reports of a major police raid targeting high-profile clients in the Financial District.',
    effects: {
      drugPriceModifiers: [{ drugName: 'Cocaine', factor: 1.25 }, { drugName: 'Adderall', factor: 1.15 }],
      heatChange: 15,
      playerImpact: { message: 'Cops are hitting hard in the Financial District today!' }
    }
  },
  {
    id: 'manhattan_fashion_week_demand',
    name: 'Fashion Week Demand',
    description: "It's Fashion Week! Demand for party drugs and stimulants is through the roof in Manhattan.",
    effects: {
      categoryPriceModifiers: [{ category: drugCategories.party, factor: 1.20 }, { category: drugCategories.stimulants, factor: 1.15 }],
      heatChange: 5
    }
  }
];

const brooklynEvents: GameEvent[] = [
  {
    id: 'brooklyn_warehouse_bust',
    name: 'Warehouse Bust in BK',
    description: 'A significant drug warehouse was reportedly busted in Brooklyn, affecting various supplies.',
    effects: {
      categoryPriceModifiers: [{ category: ['Weed', 'MDMA', 'Mushrooms'], factor: 1.18 }],
      heatChange: 12
    }
  },
  {
    id: 'brooklyn_block_party',
    name: 'Brooklyn Block Party',
    description: 'A massive block party is underway, increasing demand for recreational substances.',
    effects: {
        categoryPriceModifiers: [{category: drugCategories.party, factor: 1.15}, {drugName: 'Weed', factor: 1.10}],
        heatChange: -3, // Parties might distract police short-term
        playerImpact: {
            message: "There's a wild block party nearby. Good opportunity for sales, but could get chaotic.",
        }
    }
  }
];

const queensEvents: GameEvent[] = [
  {
    id: 'queens_airport_seizure',
    name: 'Airport Seizure at JFK/LGA',
    description: 'Customs made a large seizure at one of the airports in Queens. Exotic imports might be scarce.',
    effects: {
      categoryPriceModifiers: [{ category: drugCategories.expensive, factor: 1.22 }],
      heatChange: 10
    }
  }
];

const bronxEvents: GameEvent[] = [
  {
    id: 'bronx_gang_turf_war',
    name: 'Gang Turf War Intensifies',
    description: 'Rival gangs are clashing openly in parts of The Bronx. It\'s dangerous, but some goods are moving cheap.',
    effects: {
      drugPriceModifiers: [{ drugName: 'Crack', factor: 0.85 }, { drugName: 'Heroin', factor: 0.9 }],
      heatChange: 20,
      playerImpact: {
        message: 'A gang war is flaring up! Watch your back, but there might be deals if you dare.',
        triggerCombat: 'gang_activity'
      }
    }
  }
];

const statenIslandEvents: GameEvent[] = [
  {
    id: 'staten_ferry_crackdown',
    name: 'Ferry Terminal Crackdown',
    description: 'Police are heavily patrolling the Staten Island Ferry terminals.',
    effects: {
      heatChange: 18,
      categoryPriceModifiers: [{ category: drugCategories.all, factor: 1.08 }], // Harder to get anything in/out
      playerImpact: { message: 'The ferry is hot today. Risky to move product.'}
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
      // Add a chance for NO event to occur in a borough for variety (e.g., 20% chance of no event)
      if (Math.random() > 0.25) {
        const randomIndex = Math.floor(Math.random() * pool.length);
        dailyEvents[borough] = pool[randomIndex];
      } else {
        dailyEvents[borough] = null; // No specific event for this borough today
      }
    } else {
      dailyEvents[borough] = null; // No event pool defined for this borough
    }
  }
  return dailyEvents;
}