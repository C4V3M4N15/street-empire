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

export const ALL_DRUGS = [ // Exported ALL_DRUGS
  { name: 'Weed', basePrice: 20, volatility: 0.35 },
  { name: 'Cocaine', basePrice: 650, volatility: 0.55 },
  { name: 'Heroin', basePrice: 450, volatility: 0.5 },
  { name: 'MDMA', basePrice: 100, volatility: 0.35 },
  { name: 'LSD', basePrice: 50, volatility: 0.4 },
  { name: 'Meth', basePrice: 250, volatility: 0.55 },
  { name: 'Mushrooms', basePrice: 30, volatility: 0.35 },
  { name: 'Opium', basePrice: 300, volatility: 0.4 },
  { name: 'Ketamine', basePrice: 120, volatility: 0.38 },
  { name: 'PCP', basePrice: 70, volatility: 0.42 },
  { name: 'Xanax', basePrice: 10, volatility: 0.25 },
  { name: 'Valium', basePrice: 8, volatility: 0.2 },
  { name: 'Steroids', basePrice: 40, volatility: 0.3 },
  { name: 'Fentanyl', basePrice: 800, volatility: 0.65 },
  { name: 'Crack', basePrice: 60, volatility: 0.5 },
  { name: 'Spice', basePrice: 15, volatility: 0.35 },
  { name: 'GHB', basePrice: 50, volatility: 0.4 },
  { name: 'Rohypnol', basePrice: 25, volatility: 0.3 },
  { name: 'Adderall', basePrice: 12, volatility: 0.25 },
  { name: 'OxyContin', basePrice: 150, volatility: 0.45 },
  { name: 'Codeine Syrup', basePrice: 35, volatility: 0.3 },
  { name: 'Poppers (Amyl Nitrite)', basePrice: 10, volatility: 0.2 },
  { name: 'DMT', basePrice: 200, volatility: 0.5 },
  { name: 'Mescaline', basePrice: 90, volatility: 0.4 },
  { name: 'Ayahuasca Brew', basePrice: 100, volatility: 0.45 },
  { name: 'Ecstasy (MDMA)', basePrice: 100, volatility: 0.35 }, 
];

const ALL_HEADLINES: Array<{
  text: string;
  impactDrugSpecific: boolean;
  impactCategory?: string[]; 
  impactFactor: number;
  positive: boolean; 
}> = [
  { text: "Police crack down on {drug} trade in {location}. Prices skyrocket!", impactDrugSpecific: true, impactFactor: 0.5, positive: true },
  { text: "Major bust! {drug} supply dwindles across the city.", impactDrugSpecific: true, impactFactor: 0.3, positive: true },
  { text: "New synthetic {drug} floods {location}'s market. Prices plummet!", impactDrugSpecific: true, impactFactor: -0.4, positive: false },
  { text: "Celebrity overdoses on {drug} in a Manhattan penthouse. Public outcry!", impactDrugSpecific: true, impactFactor: -0.2, positive: false },
  { text: "Economic boom in NYC! More disposable income for recreational use.", impactDrugSpecific: false, impactFactor: 0.15, positive: true },
  { text: "City-wide recession hits. People cutting back on luxuries.", impactDrugSpecific: false, impactFactor: -0.1, positive: false },
  { text: "Music festival in Brooklyn! Demand for party drugs up.", impactDrugSpecific: false, impactCategory: ['party'], impactFactor: 0.25, positive: true },
  { text: "Wall Street traders seek focus enhancers. Demand high in Manhattan.", impactDrugSpecific: false, impactCategory: ['stimulants', 'prescription'], impactFactor: 0.18, positive: true },
  { text: "Increased patrols on bridges and tunnels. Smuggling routes disrupted.", impactDrugSpecific: false, impactFactor: 0.2, positive: true }, 
  { text: "New city legislation eases penalties for some drugs.", impactDrugSpecific: false, impactFactor: -0.15, positive: false }, 
  { text: "Rival gang war in The Bronx disrupts supply chains.", impactDrugSpecific: false, impactFactor: 0.1, positive: true }, 
  { text: "Health crisis in Queens leads to crackdown on opioids.", impactDrugSpecific: false, impactCategory: ['opioids'], impactFactor: 0.3, positive: true },
  { text: "Influencer promotes microdosing in trendy Brooklyn cafes. Psychedelics popular.", impactDrugSpecific: false, impactCategory: ['psychedelics'], impactFactor: 0.12, positive: true },
  { text: "Heatwave grips NYC! People staying indoors, less street activity.", impactDrugSpecific: false, impactFactor: -0.05, positive: false }, 
  { text: "Staten Island Ferry becomes popular spot for discreet deals.", impactDrugSpecific: false, impactFactor: 0.05, positive: true }, 
  { text: "Art scene in Queens creates demand for 'creative' substances.", impactDrugSpecific: false, impactCategory: ['psychedelics', 'cheap'], impactFactor: 0.1, positive: true},
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
      case "Manhattan": price *= 1.20; break;
      case "Brooklyn": price *= 1.10; break;
      case "Queens": price *= 1.00; break;
      case "The Bronx": price *= 0.90; break;
      case "Staten Island": price *= 0.85; break;
      default: price *= 1.0;
    }
    return {
      drug: drug.name,
      price: Math.max(1, Math.round(price)),
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
  const numHeadlines = Math.floor(Math.random() * 3) + 1; 

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
