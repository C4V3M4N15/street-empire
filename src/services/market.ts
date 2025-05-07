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
   * Could be positive or negative.
   */
  priceImpact: number; // e.g., 0.1 for +10%, -0.05 for -5%
}

const ALL_DRUGS = [
  { name: 'Weed', basePrice: 250, volatility: 0.3 },
  { name: 'Cocaine', basePrice: 13000, volatility: 0.45 }, // Adjusted
  { name: 'Heroin', basePrice: 9000, volatility: 0.4 },    // Adjusted
  { name: 'MDMA', basePrice: 1500, volatility: 0.3 },     // Adjusted
  { name: 'LSD', basePrice: 800, volatility: 0.35 },       // Adjusted
  { name: 'Meth', basePrice: 4500, volatility: 0.5 },      // Adjusted
  { name: 'Mushrooms', basePrice: 400, volatility: 0.3 },
  { name: 'Opium', basePrice: 5000, volatility: 0.35 },     // Adjusted
  { name: 'Ketamine', basePrice: 2000, volatility: 0.35 },  // Adjusted
  { name: 'PCP', basePrice: 1200, volatility: 0.4 },       // Adjusted
  { name: 'Xanax', basePrice: 50, volatility: 0.2 },       // Adjusted
  { name: 'Valium', basePrice: 40, volatility: 0.15 },      // Adjusted
  { name: 'Steroids', basePrice: 250, volatility: 0.3 },
  { name: 'Fentanyl', basePrice: 15000, volatility: 0.55 }, // Adjusted
  { name: 'Crack', basePrice: 1000, volatility: 0.45 },    // Adjusted
  { name: 'Spice', basePrice: 150, volatility: 0.35 },
  { name: 'GHB', basePrice: 600, volatility: 0.4 },
  { name: 'Rohypnol', basePrice: 200, volatility: 0.3 },
  { name: 'Adderall', basePrice: 100, volatility: 0.25 },
  { name: 'OxyContin', basePrice: 2500, volatility: 0.45 },
  { name: 'Codeine Syrup', basePrice: 350, volatility: 0.3 },
  { name: 'Poppers (Amyl Nitrite)', basePrice: 80, volatility: 0.2 },
  { name: 'DMT', basePrice: 3000, volatility: 0.5 },
  { name: 'Mescaline', basePrice: 1200, volatility: 0.4 },
  { name: 'Ayahuasca Brew', basePrice: 1500, volatility: 0.45 },
];

const ALL_HEADLINES = [
  { text: "Police crack down on {drug} trade in {location}. Prices skyrocket!", impactDrugSpecific: true, impactFactor: 0.35, positive: true }, // Adjusted impact
  { text: "Major bust! {drug} supply dwindles across the city.", impactDrugSpecific: true, impactFactor: 0.3, positive: true },
  { text: "New synthetic {drug} floods {location}'s market. Prices plummet!", impactDrugSpecific: true, impactFactor: -0.3, positive: false }, // Adjusted impact
  { text: "Celebrity overdoses on {drug} in a Manhattan penthouse. Public outcry!", impactDrugSpecific: true, impactFactor: -0.2, positive: false },
  { text: "Economic boom in NYC! More disposable income for recreational use.", impactDrugSpecific: false, impactFactor: 0.15, positive: true },
  { text: "City-wide recession hits. People cutting back on luxuries.", impactDrugSpecific: false, impactFactor: -0.1, positive: false },
  { text: "Music festival in Brooklyn! Demand for party drugs up.", impactDrugSpecific: false, impactCategory: ['MDMA', 'LSD', 'Mushrooms', 'Cocaine', 'Ketamine'], impactFactor: 0.25, positive: true },
  { text: "Wall Street traders seek focus enhancers. Demand high in Manhattan.", impactDrugSpecific: false, impactCategory: ['Meth', 'Cocaine', 'Adderall'], impactFactor: 0.18, positive: true },
  { text: "Increased patrols on bridges and tunnels. Smuggling routes disrupted.", impactDrugSpecific: false, impactFactor: 0.2, positive: true },
  { text: "New city legislation eases penalties for some drugs.", impactDrugSpecific: false, impactFactor: -0.15, positive: false },
  { text: "Rival gang war in The Bronx disrupts supply chains.", impactDrugSpecific: false, impactFactor: 0.1, positive: true },
  { text: "Health crisis in Queens leads to crackdown on opioids.", impactDrugSpecific: false, impactCategory: ['Heroin', 'Opium', 'Fentanyl', 'PCP', 'OxyContin'], impactFactor: 0.3, positive: true },
  { text: "Influencer promotes microdosing in trendy Brooklyn cafes. Psychedelics popular.", impactDrugSpecific: false, impactCategory: ['LSD', 'Mushrooms', 'Mescaline', 'DMT'], impactFactor: 0.12, positive: true },
  { text: "Heatwave grips NYC! People staying indoors, less street activity.", impactDrugSpecific: false, impactFactor: -0.05, positive: false },
  { text: "Staten Island Ferry becomes popular spot for discreet deals.", impactDrugSpecific: false, impactFactor: 0.05, positive: true }, // Example location-themed headline
  { text: "Art scene in Queens creates demand for 'creative' substances.", impactDrugSpecific: false, impactCategory: ['Weed', 'LSD', 'Mushrooms', 'Spice'], impactFactor: 0.1, positive: true},
];


/**
 * Generates a random number from a standard normal distribution (mean 0, standard deviation 1).
 * Uses the Box-Muller transform.
 * @returns A normally distributed random number.
 */
function gaussianRandom() {
  let u = 0, v = 0;
  while(u === 0) u = Math.random(); //Converting [0,1) to (0,1)
  while(v === 0) v = Math.random();
  return Math.sqrt( -2.0 * Math.log( u ) ) * Math.cos( 2.0 * Math.PI * v );
}

/**
 * Asynchronously retrieves the current market prices for drugs.
 * @param location The current location of the player (e.g., "Manhattan", "Brooklyn")
 * @returns A promise that resolves to an array of DrugPrice objects.
 */
export async function getMarketPrices(location: string): Promise<DrugPrice[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

  // Determine number of drugs to show (e.g., 7 to 12)
  const numDrugsToShow = 10 + Math.floor(Math.random() * 6); // Increased to 10-15 drugs
  const shuffledDrugs = [...ALL_DRUGS].sort(() => 0.5 - Math.random());
  const selectedDrugs = shuffledDrugs.slice(0, numDrugsToShow);

  return selectedDrugs.map(drug => {
    const randomFactor = gaussianRandom(); // Use a value from standard normal distribution
    // Scale and shift the randomFactor to be more suitable for price fluctuation.
    // For example, clamp it or use a smaller multiplier if volatility is high.
    // A typical gaussianRandom() output is mostly between -3 and 3.
    // We want volatility to represent a percentage, e.g., 0.3 means +/-30% potentially.
    // So, randomFactor * drug.volatility is a direct way.
    const priceFluctuation = randomFactor * drug.volatility;
    
    let price = drug.basePrice * (1 + priceFluctuation);
    
    // Add location-based modifier for NYC boroughs
    switch (location) {
      case "Manhattan": price *= 1.20; break; // Highest prices
      case "Brooklyn": price *= 1.10; break;  // Higher prices
      case "Queens": price *= 1.00; break;    // Average prices
      case "The Bronx": price *= 0.90; break; // Lower prices
      case "Staten Island": price *= 0.85; break; // Lowest prices
      default: price *= 1.0; // Default if location not matched
    }
    return {
      drug: drug.name,
      price: Math.max(1, Math.round(price)), // Ensure price is at least 1
    };
  });
}

/**
 * Asynchronously retrieves the local headlines for the current day.
 * @param location The current location of the player (e.g., "Manhattan", "Brooklyn")
 * @returns A promise that resolves to an array of LocalHeadline objects.
 */
export async function getLocalHeadlines(location: string): Promise<LocalHeadline[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

  const headlines: LocalHeadline[] = [];
  const numHeadlines = Math.floor(Math.random() * 3) + 1; // 1 to 3 headlines

  const availableHeadlines = [...ALL_HEADLINES];

  for (let i = 0; i < numHeadlines; i++) {
    if (availableHeadlines.length === 0) break;

    const headlineIndex = Math.floor(Math.random() * availableHeadlines.length);
    const selectedHeadlineTemplate = availableHeadlines.splice(headlineIndex, 1)[0];
    
    let headlineText = selectedHeadlineTemplate.text;
    let priceImpact = selectedHeadlineTemplate.impactFactor;

    headlineText = headlineText.replace("{location}", location); // Replace location placeholder

    if (selectedHeadlineTemplate.impactDrugSpecific) {
      const randomDrug = ALL_DRUGS[Math.floor(Math.random() * ALL_DRUGS.length)].name;
      headlineText = headlineText.replace("{drug}", randomDrug);
    }
    
    headlines.push({
      headline: headlineText,
      priceImpact: priceImpact, 
    });
  }

  return headlines;
}

