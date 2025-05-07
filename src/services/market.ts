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
  { name: 'Weed', basePrice: 300, volatility: 0.3 },
  { name: 'Cocaine', basePrice: 25000, volatility: 0.5 },
  { name: 'Heroin', basePrice: 15000, volatility: 0.45 },
  { name: 'MDMA', basePrice: 1500, volatility: 0.35 },
  { name: 'LSD', basePrice: 800, volatility: 0.4 },
  { name: 'Meth', basePrice: 8000, volatility: 0.55 },
  { name: 'Mushrooms', basePrice: 500, volatility: 0.3 },
  { name: 'Opium', basePrice: 10000, volatility: 0.4 },
  { name: 'Ketamine', basePrice: 2000, volatility: 0.38 },
  { name: 'PCP', basePrice: 1200, volatility: 0.42 },
  { name: 'Xanax', basePrice: 50, volatility: 0.25 },
  { name: 'Valium', basePrice: 40, volatility: 0.2 },
  { name: 'Steroids', basePrice: 300, volatility: 0.3 },
  { name: 'Fentanyl', basePrice: 50000, volatility: 0.6 },
  { name: 'Crack', basePrice: 1000, volatility: 0.5 },
];

const ALL_HEADLINES = [
  { text: "Police crack down on {drug} trade. Prices skyrocket!", impactDrugSpecific: true, impactFactor: 0.5, positive: true },
  { text: "Major bust! {drug} supply dwindles.", impactDrugSpecific: true, impactFactor: 0.3, positive: true },
  { text: "New synthetic {drug} floods the market. Prices plummet!", impactDrugSpecific: true, impactFactor: -0.4, positive: false },
  { text: "Celebrity overdoses on {drug}. Public outcry!", impactDrugSpecific: true, impactFactor: -0.2, positive: false },
  { text: "Economic boom! More disposable income for recreational use.", impactDrugSpecific: false, impactFactor: 0.15, positive: true },
  { text: "Recession hits. People cutting back on luxuries.", impactDrugSpecific: false, impactFactor: -0.1, positive: false },
  { text: "Music festival in town! Demand for party drugs up.", impactDrugSpecific: false, impactCategory: ['MDMA', 'LSD', 'Mushrooms', 'Cocaine'], impactFactor: 0.25, positive: true },
  { text: "Tech conference attendees seek focus enhancers.", impactDrugSpecific: false, impactCategory: ['Meth', 'Cocaine'], impactFactor: 0.18, positive: true },
  { text: "Increased border patrol. Smuggling routes disrupted.", impactDrugSpecific: false, impactFactor: 0.2, positive: true },
  { text: "New legislation eases penalties for some drugs.", impactDrugSpecific: false, impactFactor: -0.15, positive: false },
  { text: "Rival gang war disrupts supply chains.", impactDrugSpecific: false, impactFactor: 0.1, positive: true },
  { text: "Health crisis leads to crackdown on opioids.", impactDrugSpecific: false, impactCategory: ['Heroin', 'Opium', 'Fentanyl', 'PCP'], impactFactor: 0.3, positive: true },
  { text: "Influencer promotes microdosing. Psychedelics popular.", impactDrugSpecific: false, impactCategory: ['LSD', 'Mushrooms'], impactFactor: 0.12, positive: true },
  { text: "Heatwave! People staying indoors, less street activity.", impactDrugSpecific: false, impactFactor: -0.05, positive: false },
];


/**
 * Asynchronously retrieves the current market prices for drugs.
 * @param location The current location of the player
 * @returns A promise that resolves to an array of DrugPrice objects.
 */
export async function getMarketPrices(location: string): Promise<DrugPrice[]> {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 300 + Math.random() * 400));

  // Determine number of drugs to show (e.g., 5 to 8)
  const numDrugsToShow = 5 + Math.floor(Math.random() * 4);
  const shuffledDrugs = [...ALL_DRUGS].sort(() => 0.5 - Math.random());
  const selectedDrugs = shuffledDrugs.slice(0, numDrugsToShow);

  return selectedDrugs.map(drug => {
    const priceFluctuation = (Math.random() - 0.5) * 2 * drug.volatility; // -volatility to +volatility
    let price = drug.basePrice * (1 + priceFluctuation);
    // Add location-based modifier (simple example)
    switch (location) {
      case "New York": price *= 1.1; break;
      case "Los Angeles": price *= 1.05; break;
      case "Miami": price *= 1.15; break;
      case "Chicago": price *= 0.95; break;
      case "Houston": price *= 0.9; break;
    }
    return {
      drug: drug.name,
      price: Math.max(1, Math.round(price)), // Ensure price is at least 1
    };
  });
}

/**
 * Asynchronously retrieves the local headlines for the current day.
 * @param location The current location of the player
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

    if (selectedHeadlineTemplate.impactDrugSpecific) {
      // Select a random drug from the main list for drug-specific headlines
      const randomDrug = ALL_DRUGS[Math.floor(Math.random() * ALL_DRUGS.length)].name;
      headlineText = headlineText.replace("{drug}", randomDrug);
      // For drug-specific headlines, the impact might only apply to that drug or related ones.
      // This is simplified here; a more complex system would adjust specific drug prices.
      // For now, we'll treat it as a general market impact if it's drug-specific.
    }
    
    // If it's category specific, and we picked one, that's fine.
    // The applyHeadlineImpacts function in useGameLogic will handle the actual price adjustment.

    headlines.push({
      headline: headlineText,
      priceImpact: priceImpact,
    });
  }

  return headlines;
}
