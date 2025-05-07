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
  priceImpact: number;
}

/**
 * Asynchronously retrieves the current market prices for drugs.
 * @param location The current location of the player
 * @returns A promise that resolves to an array of DrugPrice objects.
 */
export async function getMarketPrices(location: string): Promise<DrugPrice[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      drug: 'Weed',
      price: 420,
    },
    {
      drug: 'Cocaine',
      price: 69000,
    },
    {
      drug: 'PCP',
      price: 69,
    },
  ];
}

/**
 * Asynchronously retrieves the local headlines for the current day.
 * @param location The current location of the player
 * @returns A promise that resolves to an array of LocalHeadline objects.
 */
export async function getLocalHeadlines(location: string): Promise<LocalHeadline[]> {
  // TODO: Implement this by calling an API.

  return [
    {
      headline: 'Police raid local grow op!',
      priceImpact: -0.2,
    },
    {
      headline: 'Festival goers inbound!',
      priceImpact: 0.4,
    },
  ];
}
