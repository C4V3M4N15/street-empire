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
  typicalHeat?: string; 
  commonEvents?: string; 
  priceProfile?: string; 
}

const drugCategoriesMap: Record<string, string> = {
  'Weed': 'Psychedelic/Relaxant',
  'Cocaine': 'Stimulant',
  'Heroin': 'Opioid',
  'MDMA': 'Party/Empathogen',
  'LSD': 'Psychedelic',
  'Meth': 'Stimulant',
  'Mushrooms': 'Psychedelic',
  'Opium': 'Opioid',
  'Ketamine': 'Dissociative/Party',
  'PCP': 'Dissociative',
  'Xanax': 'Prescription/Depressant',
  'Valium': 'Prescription/Depressant',
  'Steroids': 'Performance Enhancer',
  'Fentanyl': 'Opioid (Synthetic)',
  'Crack': 'Stimulant',
  'Spice': 'Synthetic Cannabinoid',
  'GHB': 'Depressant/Party',
  'Rohypnol': 'Depressant/Prescription',
  'Adderall': 'Prescription/Stimulant',
  'OxyContin': 'Prescription/Opioid',
  'Codeine Syrup': 'Prescription/Opioid',
  'Poppers (Amyl Nitrite)': 'Party/Inhalant',
  'DMT': 'Psychedelic',
  'Mescaline': 'Psychedelic',
  'Ayahuasca Brew': 'Psychedelic',
  'Ecstasy (MDMA)': 'Party/Empathogen',
};

export const ALL_DRUG_REFERENCE_DATA: DrugReference[] = marketAllDrugs.map(drug => ({
  name: drug.name,
  basePrice: drug.basePrice,
  volatility: drug.volatility,
  description: `A commonly traded illicit substance. Base price is around $${drug.basePrice}. Known for its ${drug.volatility * 100}% price volatility.`, 
  category: drugCategoriesMap[drug.name] || 'General Illicit',
}));

// Enhance descriptions
const drugDescriptions: Record<string, Partial<DrugReference>> = {
  'Weed': { description: 'Popular psychoactive plant. Relatively low cost and high demand.', category: 'Psychedelic/Relaxant' },
  'Cocaine': { description: 'Powerful stimulant derived from coca leaves. High price, high risk, high profit.', category: 'Stimulant (Expensive)' },
  'Heroin': { description: 'Highly addictive opioid. Dangerous but profitable.', category: 'Opioid (Expensive)' },
  'MDMA': { description: 'Also known as Ecstasy. Popular party drug, creates feelings of euphoria.', category: 'Party/Empathogen' },
  'LSD': { description: 'Potent psychedelic. Small doses, big effects. Volatile market.', category: 'Psychedelic' },
  'Meth': { description: 'Cheap and powerful synthetic stimulant. Highly destructive.', category: 'Stimulant (Synthetic)' },
  'Mushrooms': { description: 'Naturally occurring psychedelics. Often sold by weight.', category: 'Psychedelic (Organic)' },
  'Opium': { description: 'Raw opioid, less processed than heroin. Old-school drug.', category: 'Opioid (Organic)' },
  'Ketamine': { description: 'Dissociative anesthetic used as a party drug. "K-hole" experiences.', category: 'Dissociative/Party' },
  'PCP': { description: 'Powerful and unpredictable dissociative. High risk.', category: 'Dissociative/Dangerous' },
  'Xanax': { description: 'Prescription anti-anxiety medication, often abused.', category: 'Prescription/Depressant' },
  'Valium': { description: 'Another prescription benzodiazepine, similar to Xanax.', category: 'Prescription/Depressant' },
  'Steroids': { description: 'Anabolic steroids for muscle growth. Niche market.', category: 'Performance Enhancer' },
  'Fentanyl': { description: 'Extremely potent synthetic opioid. Very dangerous, very high price.', category: 'Opioid (Synthetic, Dangerous)' },
  'Crack': { description: 'Smokable form of cocaine. Cheaper, intense high, highly addictive.', category: 'Stimulant (Cheap, Addictive)' },
  'Spice': { description: 'Synthetic cannabinoids sprayed on plant matter. Unpredictable effects.', category: 'Synthetic Cannabinoid' },
  'GHB': { description: 'Depressant often used as a club drug. Can cause blackouts.', category: 'Depressant/Party' },
  'Rohypnol': { description: 'Potent sedative, infamously known as a "date rape" drug.', category: 'Depressant/Prescription (Dangerous)' },
  'Adderall': { description: 'Prescription stimulant for ADHD, abused for focus and performance.', category: 'Prescription/Stimulant' },
  'OxyContin': { description: 'Powerful prescription opioid painkiller. Highly addictive.', category: 'Prescription/Opioid (Expensive)' },
  'Codeine Syrup': { description: 'Prescription cough syrup containing codeine, abused for its opioid effects ("Lean").', category: 'Prescription/Opioid' },
  'Poppers (Amyl Nitrite)': { description: 'Inhalant used for a short, intense rush, often at parties.', category: 'Party/Inhalant' },
  'DMT': { description: 'Powerful, short-acting psychedelic. "The Spirit Molecule".', category: 'Psychedelic (Potent)' },
  'Mescaline': { description: 'Psychedelic found in peyote and San Pedro cacti.', category: 'Psychedelic (Organic)' },
  'Ayahuasca Brew': { description: 'Psychedelic brew traditionally used in shamanic rituals.', category: 'Psychedelic (Organic)' },
  'Ecstasy (MDMA)': { description: 'Commonly known as Ecstasy, same as MDMA. Popular party drug.', category: 'Party/Empathogen' },
};

ALL_DRUG_REFERENCE_DATA.forEach(drugRef => {
  if (drugDescriptions[drugRef.name]) {
    Object.assign(drugRef, drugDescriptions[drugRef.name]);
  }
});


export const ALL_BOROUGH_REFERENCE_DATA: BoroughReference[] = [
  {
    name: 'Manhattan',
    description: 'The bustling heart of NYC. High-end clientele, luxury goods, and major financial activities. Prices are generally higher, but so are the risks due to heavy police presence and sophisticated operations.',
    typicalHeat: 'Medium to High',
    commonEvents: 'Financial news, celebrity scandals, major police operations, UN summits.',
    priceProfile: 'Expensive. Demand for stimulants (Cocaine, Adderall) and party drugs (MDMA) is high.',
  },
  {
    name: 'Brooklyn',
    description: 'A diverse borough known for its hipster culture, artistic communities, and historic neighborhoods. Markets can vary widely from one area to another.',
    typicalHeat: 'Low to Medium',
    commonEvents: 'Music festivals, warehouse fires (labs), gentrification protests, local art scene buzz.',
    priceProfile: 'Varied. Strong demand for "boutique" drugs like artisanal Weed, Mushrooms, LSD. Party drugs are also popular.',
  },
  {
    name: 'Queens',
    description: 'The most ethnically diverse urban area in the world. Home to major airports (JFK, LaGuardia), making it a hub for international smuggling. Many distinct neighborhoods with unique demands.',
    typicalHeat: 'Low to Medium',
    commonEvents: 'Airport security changes, cultural festivals, ethnic gang conflicts, new casino developments.',
    priceProfile: 'Diverse. Good for moving imported goods. Opium, Ketamine, and specific ethnic demands can be strong. Airport proximity affects Cocaine/Heroin.',
  },
  {
    name: 'The Bronx',
    description: 'Known for its resilience and strong community ties. Can be rougher around the edges, with significant gang activity and a market for cheaper, harder drugs.',
    typicalHeat: 'Medium to High',
    commonEvents: 'Gang leader arrests, community watch programs, illegal factory busts, block parties.',
    priceProfile: 'Cheaper, harder drugs. Crack, PCP, and Heroin are prevalent. Higher risk of violent encounters.',
  },
  {
    name: 'Staten Island',
    description: 'More suburban and isolated than other boroughs, connected mainly by ferry. Often overlooked, which can be an advantage or a disadvantage. Has its own local mob presence.',
    typicalHeat: 'Low',
    commonEvents: 'Ferry security patrols, coastal storms, mob-related events (weddings, funerals), local politician scandals.',
    priceProfile: 'Generally lower prices, but harder to move large volumes. Ferry is a key chokepoint. Some local demand for everything.',
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
