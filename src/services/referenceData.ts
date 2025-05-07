// src/services/referenceData.ts

import { ALL_DRUGS as marketAllDrugs } from '@/services/market';

export interface DrugReference {
  name: string;
  basePrice: number;
  volatility?: number;
  description: string;
  category: string;
}

export interface BoroughReference {
    name: string;
    description: string;
    typicalHeat?: string; // e.g., "Low", "Medium", "High"
    commonEvents?: string; // e.g., "Police raids", "Music festivals"
    priceProfile?: string; // e.g. "Expensive drugs popular", "Cheap drugs common"
}


// Updated categories based on the new drug list
const drugCategoriesMap: Record<string, string> = {
  'Weed': 'Relaxant/Psychedelic (Soft)',
  'Mushrooms': 'Psychedelic (Organic)',
  'LSD': 'Psychedelic (Synthetic, Potent)',
  'Meth': 'Stimulant (Hard, Synthetic)', // Was "Speed"
  'Crack': 'Stimulant (Cheap, Addictive)', // Was "Hard"
  'Heroin': 'Opioid (Hard, Addictive)', // Was "Boi"
  'OxyContin': 'Opioid (Prescription, Expensive)', // Was "Blues"
  'Dilaudid': 'Opioid (Prescription, Very Potent)', // New
};

// Initial mapping - description will be set by the forEach loop below using static text
export const ALL_DRUG_REFERENCE_DATA: DrugReference[] = marketAllDrugs.map(drug => ({
  name: drug.name,
  basePrice: drug.basePrice,
  volatility: drug.volatility,
  description: '', // Placeholder: will be filled with static description from drugDescriptions
  category: drugCategoriesMap[drug.name] || 'General Illicit',
}));

// Static descriptions for each drug. These will not change based on market fluctuations.
const drugDescriptions: Record<string, { description: string, category?: string }> = {
  'Weed': { description: 'Popular psychoactive plant. Relatively low cost and often high demand. Good entry point.', category: 'Relaxant/Psychedelic (Soft)' },
  'Mushrooms': { description: 'Naturally occurring psychedelics. Effects can vary. Market can be niche but profitable.', category: 'Psychedelic (Organic)' },
  'LSD': { description: 'Potent synthetic psychedelic. Small doses, big effects. Market can be volatile.', category: 'Psychedelic (Synthetic, Potent)' },
  'Meth': { description: 'Powerful synthetic stimulant, known for its intense high and addictive properties. High risk, high reward.', category: 'Stimulant (Hard, Synthetic)' },
  'Crack': { description: 'Smokable form of cocaine. Cheaper, intense but short high, highly addictive. Fast turnover.', category: 'Stimulant (Cheap, Addictive)' },
  'Heroin': { description: 'Highly addictive opioid. Dangerous but can be very profitable due to dependency.', category: 'Opioid (Hard, Addictive)' },
  'OxyContin': { description: 'Powerful prescription opioid painkiller, often diverted to the black market. High street value.', category: 'Opioid (Prescription, Expensive)' },
  'Dilaudid': { description: 'Hydromorphone, an extremely potent prescription opioid. Very high risk and high value.', category: 'Opioid (Prescription, Very Potent)' },
};

// Populate the descriptions and categories from the static drugDescriptions object
ALL_DRUG_REFERENCE_DATA.forEach(drugRef => {
  const staticInfo = drugDescriptions[drugRef.name];
  if (staticInfo?.description) {
    drugRef.description = staticInfo.description;
  } else {
    // Fallback to a generic static description if no specific one is found
    drugRef.description = 'A commonly traded illicit substance.';
  }
  if (staticInfo?.category) {
    drugRef.category = staticInfo.category;
  }
});


export const ALL_BOROUGH_REFERENCE_DATA: BoroughReference[] = [
  {
    name: 'Manhattan',
    description: 'The bustling heart of NYC. High-end clientele, luxury goods, and major financial activities. Prices are generally higher, but so are the risks due to heavy police presence and sophisticated operations.',
    typicalHeat: 'Medium to High',
    commonEvents: 'Financial news, celebrity scandals, major police operations, UN summits.',
    priceProfile: 'Expensive. Demand for stimulants (Meth, Crack) and potent opioids (OxyContin, Dilaudid, Heroin) is high among certain crowds.',
  },
  {
    name: 'Brooklyn',
    description: 'A diverse borough known for its hipster culture, artistic communities, and historic neighborhoods. Markets can vary widely from one area to another.',
    typicalHeat: 'Low to Medium',
    commonEvents: 'Music festivals, warehouse fires (labs), gentrification protests, local art scene buzz.',
    priceProfile: 'Varied. Strong demand for "boutique" drugs like Weed, Mushrooms, LSD. Some opioid use.',
  },
  {
    name: 'Queens',
    description: 'The most ethnically diverse urban area in the world. Home to major airports (JFK, LaGuardia), making it a hub for international smuggling. Many distinct neighborhoods with unique demands.',
    typicalHeat: 'Low to Medium',
    commonEvents: 'Airport security changes, cultural festivals, ethnic gang conflicts, new casino developments.',
    priceProfile: 'Diverse. Good for moving imported goods. Heroin and potent prescription opioids can move here. Weed and Meth also present.',
  },
  {
    name: 'The Bronx',
    description: 'Known for its resilience and strong community ties. Can be rougher around the edges, with significant gang activity and a market for cheaper, harder drugs.',
    typicalHeat: 'Medium to High',
    commonEvents: 'Gang leader arrests, community watch programs, illegal factory busts, block parties.',
    priceProfile: 'Cheaper, harder drugs. Crack, Heroin, and Meth are prevalent. Higher risk of violent encounters.',
  },
  {
    name: 'Staten Island',
    description: 'More suburban and isolated than other boroughs, connected mainly by ferry. Often overlooked, which can be an advantage or a disadvantage. Has its own local mob presence.',
    typicalHeat: 'Low',
    commonEvents: 'Ferry security patrols, coastal storms, mob-related events (weddings, funerals), local politician scandals.',
    priceProfile: 'Generally lower prices, but harder to move large volumes. Ferry is a key chokepoint. Some local demand for everything, including prescription opioids.',
  },
];

export async function getDrugReferenceData(): Promise<DrugReference[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  return ALL_DRUG_REFERENCE_DATA;
}

export async function getBoroughReferenceData(): Promise<BoroughReference[]> {
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  return ALL_BOROUGH_REFERENCE_DATA;
}

