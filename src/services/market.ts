
/**
 * Represents a drug and its associated price.
 */
export interface DrugPrice {
  /**
   * The name of the drug.
   */
  drug: string;
  /**
   * The price of the drug.
   */
  price: number;
  /**
   * The base volatility of the drug.
   */
  volatility?: number;
  /**
   * Indicates the direction of price change compared to the previous day.
   */
  priceChangeDirection?: 'up' | 'down' | 'same' | 'new';
}

/**
 * Represents a local headline or event that can influence drug prices.
 */
export interface LocalHeadline {
  /**
   * The headline text.
   */
  headline: string;
  /**
   * The impact this headline has on drug prices.
   * e.g., 0.1 for +10%, -0.05 for -5%
   */
  priceImpact: number;
  /**
   * If the headline impact is specific to a single drug.
   */
  affectedDrug?: string;
  /**
   * If the headline impact is specific to one or more categories of drugs.
   * Uses keys from drugCategories in eventService.ts
   */
  affectedCategories?: string[];
}

export const ALL_DRUGS = [
  { name: 'Weed', basePrice: 20, volatility: 0.15 },
  { name: 'Mushrooms', basePrice: 15, volatility: 0.16 },
  { name: 'LSD', basePrice: 25, volatility: 0.2 },
  { name: 'Meth', basePrice: 80, volatility: 0.28 }, // Was "Speed"
  { name: 'Crack', basePrice: 25, volatility: 0.23 }, // Was "Hard"
  { name: 'Heroin', basePrice: 120, volatility: 0.22 }, // Was "Boi"
  { name: 'OxyContin', basePrice: 60, volatility: 0.22 }, // Was "Blues"
  { name: 'Dilaudid', basePrice: 180, volatility: 0.26 }, // New
];

const ALL_HEADLINES: Array<{
  text: string;
  impactDrugSpecific: boolean;
  impactCategory?: string[]; // References keys in eventService's drugCategories
  impactFactor: number;
  positive: boolean;
}> = [
  { text: "Police crack down on {drug} trade in {location}. Prices affected!", impactDrugSpecific: true, impactFactor: 0.25, positive: true },
  { text: "Major bust! {drug} supply dwindles across the city.", impactDrugSpecific: true, impactFactor: 0.15, positive: true },
  { text: "New synthetic batch of {drug} floods {location}'s market. Prices affected!", impactDrugSpecific: true, impactFactor: -0.20, positive: false }, // e.g. for Meth
  { text: "Celebrity overdoses on {drug} in a Manhattan penthouse. Public outcry!", impactDrugSpecific: true, impactFactor: -0.1, positive: false }, // e.g. for Heroin or OxyContin
  { text: "Economic boom in NYC! More disposable income for recreational use.", impactDrugSpecific: false, impactFactor: 0.10, positive: true },
  { text: "City-wide recession hits. People cutting back on luxuries.", impactDrugSpecific: false, impactFactor: -0.08, positive: false },
  { text: "Music festival in Brooklyn! Demand for party drugs (LSD, Mushrooms) up.", impactDrugSpecific: false, impactCategory: ['psychedelics_soft'], impactFactor: 0.20, positive: true },
  { text: "Wall Street traders seek focus enhancers. Demand for Meth high in Manhattan.", impactDrugSpecific: false, impactCategory: ['stimulants_hard'], impactFactor: 0.12, positive: true },
  { text: "Increased patrols on bridges and tunnels. Smuggling routes for hard drugs disrupted.", impactDrugSpecific: false, impactCategory: ['opioids_hard', 'stimulants_hard'], impactFactor: 0.15, positive: true },
  { text: "New city legislation eases penalties for Weed.", impactDrugSpecific: false, impactCategory: ['relaxants'], impactFactor: -0.10, positive: false },
  { text: "Rival gang war in The Bronx disrupts Heroin and Crack supply chains.", impactDrugSpecific: false, impactCategory: ['opioids_hard', 'stimulants_cheap'], impactFactor: 0.08, positive: true },
  { text: "Health crisis in Queens leads to crackdown on Opioids (OxyContin, Dilaudid, Heroin).", impactDrugSpecific: false, impactCategory: ['opioids_hard', 'opioids_pharma'], impactFactor: 0.20, positive: true },
  { text: "Influencer promotes microdosing LSD in trendy Brooklyn cafes. Psychedelics popular.", impactDrugSpecific: false, impactCategory: ['psychedelics_strong'], impactFactor: 0.09, positive: true },
  { text: "Heatwave grips NYC! People staying indoors, less street activity for Weed.", impactDrugSpecific: false, impactCategory: ['relaxants'], impactFactor: -0.03, positive: false },
  { text: "Staten Island Ferry becomes popular spot for discreet deals for Weed and Shrooms.", impactDrugSpecific: false, impactCategory: ['relaxants', 'psychedelics_soft'], impactFactor: 0.04, positive: true },
  { text: "Art scene in Queens creates demand for 'creative' substances like LSD and Mushrooms.", impactDrugSpecific: false, impactCategory: ['psychedelics_strong', 'psychedelics_soft'], impactFactor: 0.07, positive: true},
];


/**
 * Generates a random number from a standard normal distribution (mean 0, standard deviation 1).
 * Uses the Box-Muller transform.
 * @returns A normally distributed random number.
 */
function gaussianRandom() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

/**
 * Asynchronously retrieves the current market prices for drugs.
 * @param location The current location of the player (e.g., "Manhattan", "Brooklyn")
 * @param daysPassed The number of days passed in the game.
 * @param boroughHeatLevels Current heat levels for all boroughs.
 * @returns A promise that resolves to an array of DrugPrice objects.
 */
export async function getMarketPrices(location: string, daysPassed: number, boroughHeatLevels: Record<string, number>): Promise<DrugPrice[]> {
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

  // All 8 drugs are always available in the market now.
  // We can implement logic later to make some drugs rarer or location-specific if needed.
  const selectedDrugs = [...ALL_DRUGS];
  const currentHeat = boroughHeatLevels[location] || 0;

  return selectedDrugs.map(drug => {
    // Base price fluctuation using Gaussian random
    const priceFluctuation = gaussianRandom() * drug.volatility * 0.5;
    let price = drug.basePrice * (1 + priceFluctuation);

    // Location-based price scaling
    switch (location) {
      case "Manhattan": price *= (1.10 + currentHeat * 0.02); break; // Higher base, heat has more impact
      case "Brooklyn": price *= (1.05 + currentHeat * 0.015); break;
      case "Queens": price *= (1.00 + currentHeat * 0.01); break;
      case "The Bronx": price *= (0.95 - currentHeat * 0.01); break; // Lower base, heat might increase if supply scared
      case "Staten Island": price *= (0.90 - currentHeat * 0.005); break;
      default: price *= 1.0;
    }

    // General market trend based on days passed (e.g., prices might slowly inflate over time)
    const dayTrendFactor = 1 + (daysPassed * 0.001); // Tiny inflation per day
    price *= dayTrendFactor;

    // Heat impact: higher heat can mean higher prices due to risk, or lower if dealers are scared off.
    // Let's make high heat generally increase prices due to risk premium.
    const heatPriceFactor = 1 + (currentHeat * 0.03); // Up to 15% increase at max heat
    price *= heatPriceFactor;


    return {
      drug: drug.name,
      price: Math.max(1, Math.round(price)), // Ensure price is at least 1
      volatility: drug.volatility,
    };
  });
}

/**
 * Asynchronously retrieves the local headlines for the current day.
 * @param location The current location of the player (e.g., "Manhattan", "Brooklyn")
 * @returns A promise that resolves to an array of LocalHeadline objects.
 */
export async function getLocalHeadlines(location: string): Promise<LocalHeadline[]> {
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  const headlines: LocalHeadline[] = [];
  const numHeadlines = Math.floor(Math.random() * 2) + 1; // 1 to 2 headlines

  const availableHeadlineTemplates = [...ALL_HEADLINES];

  for (let i = 0; i < numHeadlines; i++) {
    if (availableHeadlineTemplates.length === 0) break;

    const headlineIndex = Math.floor(Math.random() * availableHeadlineTemplates.length);
    const selectedTemplate = availableHeadlineTemplates.splice(headlineIndex, 1)[0];

    let headlineText = selectedTemplate.text.replace("{location}", location);
    let affectedDrugName: string | undefined = undefined;

    if (selectedTemplate.impactDrugSpecific) {
      // If headline is drug-specific, pick one of the current 8 drugs
      const randomDrugFromCurrentList = ALL_DRUGS[Math.floor(Math.random() * ALL_DRUGS.length)].name;
      headlineText = headlineText.replace("{drug}", randomDrugFromCurrentList);
      affectedDrugName = randomDrugFromCurrentList;
    }

    headlines.push({
      headline: headlineText,
      priceImpact: selectedTemplate.impactFactor,
      affectedDrug: affectedDrugName,
      affectedCategories: selectedTemplate.impactCategory,
    });
  }

  return headlines;
}
