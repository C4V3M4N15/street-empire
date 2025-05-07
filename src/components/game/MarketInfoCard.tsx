
"use client";

import type { DrugPrice, LocalHeadline } from '@/services/market';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Newspaper, TrendingUp, AlertTriangle, Loader2, Package, DollarSign, ShoppingCart, Coins, Map } from 'lucide-react';
import type { PlayerStats } from '@/types/game';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NycMap } from './NycMap'; // Import the new NycMap component

interface MarketInfoCardProps {
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  isLoading: boolean;
  playerStats: PlayerStats;
  buyDrug: (drugName: string, quantity: number, price: number) => void;
  sellDrug: (drugName: string, quantity: number, price: number) => void;
  travelToLocation: (location: string) => void;
  fetchHeadlinesForLocation: (location: string) => Promise<LocalHeadline[]>;
}

const HeadlineItem: React.FC<{ headline: string; impact: number }> = ({ headline, impact }) => {
  const impactColor = impact > 0 ? 'text-accent' : impact < 0 ? 'text-destructive' : 'text-muted-foreground';
  const ImpactIcon = impact > 0 ? TrendingUp : impact < 0 ? AlertTriangle : TrendingUp;
  return (
    <div className="flex items-start space-x-2 py-1.5 border-b border-border/30 last:border-b-0">
      <ImpactIcon className={`h-4 w-4 mt-0.5 shrink-0 ${impactColor}`} />
      <div>
        <p className="text-xs">{headline}</p>
        <p className={`text-xs font-medium ${impactColor}`}>
          Impact: {impact > 0 ? '+' : ''}{(impact * 100).toFixed(0)}%
        </p>
      </div>
    </div>
  );
};

export function MarketInfoCard({ 
  marketPrices, 
  localHeadlines, 
  isLoading, 
  playerStats, 
  buyDrug, 
  sellDrug,
  travelToLocation,
  fetchHeadlinesForLocation
}: MarketInfoCardProps) {
  const [transactionQuantities, setTransactionQuantities] = React.useState<{ [drugName: string]: string }>({});

  const handleQuantityChange = (drugName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (value === "" || (numValue >= 0 && !isNaN(numValue))) {
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    } else if (isNaN(numValue) && value !== "") {
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    }
  };
  
  const getNumericQuantity = (drugName: string): number => {
    const valStr = transactionQuantities[drugName] || "";
    if (valStr === "") return 0;
    const val = parseInt(valStr, 10);
    return isNaN(val) || val < 0 ? 0 : val;
  };

  const renderSkeletons = () => (
    <>
      <div className="mb-4">
        <Skeleton className="h-5 w-1/2 mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div className="w-1/3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
            <Skeleton className="h-4 w-1/6" />
            <div className="flex items-center space-x-1 w-2/5 justify-end">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="h-5 w-1/3 mb-2" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="py-2 border-b border-border/30">
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </>
  );

  return (
    <Card className="shadow-md">
      <Tabs defaultValue="market" className="w-full">
        <CardHeader className="pb-0 pt-4 px-4">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="market" className="flex items-center">
                    <LineChart className="mr-2 h-4 w-4" /> Market
                </TabsTrigger>
                <TabsTrigger value="travel" className="flex items-center">
                    <Map className="mr-2 h-4 w-4" /> Travel
                </TabsTrigger>
            </TabsList>
        </CardHeader>
        <TabsContent value="market">
          <CardContent className="p-4 pt-3">
            {(isLoading && marketPrices.length === 0) ? (
              renderSkeletons()
            ) : (
              <div className="relative">
                {(isLoading && marketPrices.length > 0) && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg z-10 -m-4">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                )}
                
                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-accent" /> Drug Prices & Inventory ({playerStats.currentLocation})
                </h3>
                {marketPrices.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {marketPrices.map((drug, index) => {
                      const playerHoldings = playerStats.inventory[drug.drug]?.quantity || 0;
                      const currentQuantityInput = getNumericQuantity(drug.drug);
                      const costForBuy = currentQuantityInput * drug.price;
                      const valueForSell = currentQuantityInput * drug.price;

                      const canBuy = playerStats.cash >= costForBuy && currentQuantityInput > 0;
                      const canSell = playerHoldings >= currentQuantityInput && currentQuantityInput > 0;

                      return (
                        <React.Fragment key={drug.drug}>
                        <div className="py-2.5">
                          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 mb-1.5">
                            <div className="col-span-1 sm:col-span-1">
                              <p className="text-sm font-medium truncate" title={drug.drug}>{drug.drug}</p>
                              <p className="text-xs text-muted-foreground">Have: {playerHoldings.toLocaleString()}</p>
                            </div>
                            <p className="text-sm font-semibold text-accent text-right sm:text-center">${drug.price.toLocaleString()}</p>
                            <div className="col-span-3 sm:col-span-2 flex items-center space-x-1.5 justify-end">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={transactionQuantities[drug.drug] || ""}
                                onChange={(e) => handleQuantityChange(drug.drug, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="h-8 text-xs w-16 flex-grow-0"
                                min="0"
                                disabled={isLoading}
                              />
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  if (currentQuantityInput > 0) buyDrug(drug.drug, currentQuantityInput, drug.price);
                                }}
                                disabled={isLoading || !canBuy}
                                className="h-8 px-2.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                              >
                                <ShoppingCart className="h-3 w-3 mr-1 sm:mr-0" /> <span className="hidden sm:inline">Buy</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (currentQuantityInput > 0) sellDrug(drug.drug, currentQuantityInput, drug.price);
                                }}
                                disabled={isLoading || !canSell}
                                className="h-8 px-2.5 text-xs"
                              >
                                <Coins className="h-3 w-3 mr-1 sm:mr-0" /> <span className="hidden sm:inline">Sell</span>
                              </Button>
                            </div>
                          </div>
                          {currentQuantityInput > 0 && (
                            <div className="text-xs text-muted-foreground h-3.5">
                              {costForBuy > 0 && canBuy && <p>Cost: ${costForBuy.toLocaleString()}</p> }
                              {costForBuy > 0 && !canBuy && playerStats.cash < costForBuy && <p className="text-destructive">Need: ${costForBuy.toLocaleString()}</p>}
                            </div>
                          )}
                          {currentQuantityInput === 0 && <div className="h-3.5"></div>}
                        </div>
                        {index < marketPrices.length -1 && <Separator className="bg-border/50"/>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-3">No price data available for {playerStats.currentLocation}.</p>
                )}
                
                <h3 className="text-md font-semibold mt-4 mb-1.5 flex items-center">
                  <Newspaper className="mr-2 h-4 w-4 text-accent" /> Local Headlines ({playerStats.currentLocation})
                </h3>
                {localHeadlines.length > 0 ? (
                  <div className="max-h-28 overflow-y-auto pr-1 space-y-0.5">
                    {localHeadlines.map((headline, index) => <HeadlineItem key={index} headline={headline.headline} impact={headline.priceImpact} />)}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">No local headlines in {playerStats.currentLocation} today.</p>
                )}
              </div>
            )}
          </CardContent>
        </TabsContent>
        <TabsContent value="travel">
          <CardContent className="p-4 pt-3">
            <NycMap 
              currentLocation={playerStats.currentLocation}
              onTravel={travelToLocation}
              fetchHeadlinesForLocation={fetchHeadlinesForLocation}
              isLoading={isLoading}
            />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}
