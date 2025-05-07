
"use client";

import * as React from 'react';
import type { DrugPrice, LocalHeadline } from '@/services/market';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Newspaper, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import type { PlayerStats } from '@/types/game';

interface MarketInfoCardProps {
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  isLoading: boolean;
  playerStats: PlayerStats;
  buyDrug: (drugName: string, quantity: number, price: number) => void;
  sellDrug: (drugName: string, quantity: number, price: number) => void;
}

const HeadlineItem: React.FC<{ headline: string; impact: number }> = ({ headline, impact }) => {
  const impactColor = impact > 0 ? 'text-accent' : impact < 0 ? 'text-destructive' : 'text-muted-foreground';
  const ImpactIcon = impact > 0 ? TrendingUp : impact < 0 ? AlertTriangle : TrendingUp;
  return (
    <div className="flex items-start space-x-2 py-2 border-b border-border/50 last:border-b-0">
      <ImpactIcon className={`h-4 w-4 mt-1 shrink-0 ${impactColor}`} />
      <div>
        <p className="text-sm">{headline}</p>
        <p className={`text-xs font-medium ${impactColor}`}>
          Impact: {impact > 0 ? '+' : ''}{(impact * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

export function MarketInfoCard({ marketPrices, localHeadlines, isLoading, playerStats, buyDrug, sellDrug }: MarketInfoCardProps) {
  const [transactionQuantities, setTransactionQuantities] = React.useState<{ [drugName: string]: string }>({});

  const handleQuantityChange = (drugName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (value === "" || (numValue >= 0 && !isNaN(numValue))) {
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    } else if (isNaN(numValue) && value !== "") {
      // Allow clearing the input or if it's not a number but not empty (e.g. during typing)
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    }
  };
  
  const getNumericQuantity = (drugName: string): number => {
    const valStr = transactionQuantities[drugName] || "";
    if (valStr === "") return 0; // Treat empty string as 0 for calculation
    const val = parseInt(valStr, 10);
    return isNaN(val) || val < 0 ? 0 : val;
  };

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <LineChart className="mr-2 h-7 w-7 text-primary-foreground" /> Daily Market
        </CardTitle>
      </CardHeader>
      <CardContent>
        {(isLoading && marketPrices.length === 0) ? (
          <>
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </>
        ) : (
          <div className="relative">
            {(isLoading && marketPrices.length > 0) && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-lg z-10">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
            )}
            
            <h3 className="text-lg font-semibold mb-3 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-accent" /> Prices & Inventory
            </h3>
            {marketPrices.length > 0 ? (
              <div className="space-y-4">
                {marketPrices.map(drug => {
                  const playerHoldings = playerStats.inventory[drug.drug] || 0;
                  const currentQuantityInput = getNumericQuantity(drug.drug);
                  const costForBuy = currentQuantityInput * drug.price;
                  const valueForSell = currentQuantityInput * drug.price;

                  const canBuy = playerStats.cash >= costForBuy && currentQuantityInput > 0;
                  const canSell = playerHoldings >= currentQuantityInput && currentQuantityInput > 0;

                  return (
                    <div key={drug.drug} className="p-3 border border-border/70 rounded-lg bg-card/50 shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-md font-semibold">{drug.drug}</span>
                        <span className="text-md font-bold text-accent">${drug.price.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mb-3">You have: {playerHoldings.toLocaleString()}</p>
                      
                      <div className="flex items-center space-x-2 mb-2">
                        <Input
                          type="number"
                          placeholder="Qty"
                          value={transactionQuantities[drug.drug] || ""}
                          onChange={(e) => handleQuantityChange(drug.drug, e.target.value)}
                          onFocus={(e) => e.target.select()}
                          className="h-9 text-sm w-24 flex-grow-0"
                          min="0"
                          disabled={isLoading}
                        />
                        <Button
                          size="sm"
                          onClick={() => {
                            if (currentQuantityInput > 0) buyDrug(drug.drug, currentQuantityInput, drug.price);
                          }}
                          disabled={isLoading || !canBuy}
                          className="flex-1 sm:flex-none bg-accent hover:bg-accent/90 text-accent-foreground px-4"
                        >
                          Buy
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                             if (currentQuantityInput > 0) sellDrug(drug.drug, currentQuantityInput, drug.price);
                          }}
                          disabled={isLoading || !canSell}
                          className="flex-1 sm:flex-none px-4"
                        >
                          Sell
                        </Button>
                      </div>
                      {currentQuantityInput > 0 && (
                        <div className="text-xs text-muted-foreground space-y-0.5 h-8"> {/* Fixed height to prevent layout shifts */}
                          {canBuy && <p>Cost: ${costForBuy.toLocaleString()}</p>}
                          {!canBuy && playerStats.cash < costForBuy && <p className="text-destructive">Need: ${costForBuy.toLocaleString()}</p>}
                          {canSell && <p>Value: ${valueForSell.toLocaleString()}</p>}
                        </div>
                      )}
                       {currentQuantityInput === 0 && <div className="h-8"></div>} {/* Placeholder for height consistency */}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-4">No price data available for this location.</p>
            )}
            
            <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
              <Newspaper className="mr-2 h-5 w-5 text-accent" /> Local Headlines
            </h3>
            {localHeadlines.length > 0 ? (
              localHeadlines.map((headline, index) => <HeadlineItem key={index} headline={headline.headline} impact={headline.priceImpact} />)
            ) : (
              <p className="text-sm text-muted-foreground">No local headlines today.</p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
