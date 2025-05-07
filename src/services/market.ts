
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
  { name: 'Cocaine', basePrice: 150, volatility: 0.25 },
  { name: 'Heroin', basePrice: 120, volatility: 0.22 },
  { name: 'MDMA', basePrice: 40, volatility: 0.18 },
  { name: 'LSD', basePrice: 25, volatility: 0.2 },
  { name: 'Meth', basePrice: 80, volatility: 0.28 },
  { name: 'Mushrooms', basePrice: 15, volatility: 0.16 },
  { name: 'Opium', basePrice: 90, volatility: 0.2 },
  { name: 'Ketamine', basePrice: 50, volatility: 0.19 },
  { name: 'PCP', basePrice: 30, volatility: 0.21 },
  { name: 'Xanax', basePrice: 5, volatility: 0.12 },
  { name: 'Valium', basePrice: 4, volatility: 0.1 },
  { name: 'Steroids', basePrice: 20, volatility: 0.15 },
  { name: 'Fentanyl', basePrice: 200, volatility: 0.3 },
  { name: 'Crack', basePrice: 25, volatility: 0.23 },
  { name: 'Spice', basePrice: 8, volatility: 0.17 },
  { name: 'GHB', basePrice: 22, volatility: 0.19 },
  { name: 'Rohypnol', basePrice: 10, volatility: 0.15 },
  { name: 'Adderall', basePrice: 6, volatility: 0.13 },
  { name: 'OxyContin', basePrice: 60, volatility: 0.22 },
  { name: 'Codeine Syrup', basePrice: 18, volatility: 0.14 },
  { name: 'Poppers (Amyl Nitrite)', basePrice: 7, volatility: 0.11 },
  { name: 'DMT', basePrice: 70, volatility: 0.25 },
  { name: 'Mescaline', basePrice: 45, volatility: 0.2 },
  { name: 'Ayahuasca Brew', basePrice: 55, volatility: 0.21 },
];

const ALL_HEADLINES: Array<{
  text: string;
  impactDrugSpecific: boolean;
  impactCategory?: string[];
  impactFactor: number;
  positive: boolean;
}> = [
  { text: "Police crack down on {drug} trade in {location}. Prices affected!", impactDrugSpecific: true, impactFactor: 0.25, positive: true },
  { text: "Major bust! {drug} supply dwindles across the city.", impactDrugSpecific: true, impactFactor: 0.15, positive: true },
  { text: "New synthetic {drug} floods {location}'s market. Prices affected!", impactDrugSpecific: true, impactFactor: -0.20, positive: false },
  { text: "Celebrity overdoses on {drug} in a Manhattan penthouse. Public outcry!", impactDrugSpecific: true, impactFactor: -0.1, positive: false },
  { text: "Economic boom in NYC! More disposable income for recreational use.", impactDrugSpecific: false, impactFactor: 0.10, positive: true },
  { text: "City-wide recession hits. People cutting back on luxuries.", impactDrugSpecific: false, impactFactor: -0.08, positive: false },
  { text: "Music festival in Brooklyn! Demand for party drugs up.", impactDrugSpecific: false, impactCategory: ['party'], impactFactor: 0.20, positive: true },
  { text: "Wall Street traders seek focus enhancers. Demand high in Manhattan.", impactDrugSpecific: false, impactCategory: ['stimulants', 'prescription'], impactFactor: 0.12, positive: true },
  { text: "Increased patrols on bridges and tunnels. Smuggling routes disrupted.", impactDrugSpecific: false, impactFactor: 0.15, positive: true },
  { text: "New city legislation eases penalties for some drugs.", impactDrugSpecific: false, impactFactor: -0.10, positive: false },
  { text: "Rival gang war in The Bronx disrupts supply chains.", impactDrugSpecific: false, impactFactor: 0.08, positive: true },
  { text: "Health crisis in Queens leads to crackdown on opioids.", impactDrugSpecific: false, impactCategory: ['opioids'], impactFactor: 0.20, positive: true },
  { text: "Influencer promotes microdosing in trendy Brooklyn cafes. Psychedelics popular.", impactDrugSpecific: false, impactCategory: ['psychedelics'], impactFactor: 0.09, positive: true },
  { text: "Heatwave grips NYC! People staying indoors, less street activity.", impactDrugSpecific: false, impactFactor: -0.03, positive: false },
  { text: "Staten Island Ferry becomes popular spot for discreet deals.", impactDrugSpecific: false, impactFactor: 0.04, positive: true },
  { text: "Art scene in Queens creates demand for 'creative' substances.", impactDrugSpecific: false, impactCategory: ['psychedelics', 'cheap'], impactFactor: 0.07, positive: true},
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
 * @returns A promise that resolves to an array of DrugPrice objects.
 */
export async function getMarketPrices(location: string): Promise<DrugPrice[]> {

  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));


  const numDrugsToShow = 15 + Math.floor(Math.random() * 6);
  const shuffledDrugs = [...ALL_DRUGS].sort(() => 0.5 - Math.random());
  const selectedDrugs = shuffledDrugs.slice(0, numDrugsToShow);

  return selectedDrugs.map(drug => {

    const priceFluctuation = gaussianRandom() * drug.volatility * 0.5;

    let price = drug.basePrice * (1 + priceFluctuation);


    switch (location) {
      case "Manhattan": price *= 1.15; break;
      case "Brooklyn": price *= 1.08; break;
      case "Queens": price *= 1.00; break;
      case "The Bronx": price *= 0.92; break;
      case "Staten Island": price *= 0.88; break;
      default: price *= 1.0;
    }
    return {
      drug: drug.name,
      price: Math.max(1, Math.round(price)),
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
  const numHeadlines = Math.floor(Math.random() * 3) + 1; // 1 to 3 headlines

  const availableHeadlineTemplates = [...ALL_HEADLINES];

  for (let i = 0; i < numHeadlines; i++) {
    if (availableHeadlineTemplates.length === 0) break;

    const headlineIndex = Math.floor(Math.random() * availableHeadlineTemplates.length);
    const selectedTemplate = availableHeadlineTemplates.splice(headlineIndex, 1)[0];

    let headlineText = selectedTemplate.text.replace("{location}", location);
    let affectedDrugName: string | undefined = undefined;

    if (selectedTemplate.impactDrugSpecific) {
      const randomDrug = ALL_DRUGS[Math.floor(Math.random() * ALL_DRUGS.length)].name;
      headlineText = headlineText.replace("{drug}", randomDrug);
      affectedDrugName = randomDrug;
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
