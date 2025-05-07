
"use client";

import type { DrugPrice, LocalHeadline } from '@/services/market';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Newspaper, TrendingUp, AlertTriangle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketInfoCardProps {
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  isLoading: boolean;
}

const PriceItem: React.FC<{ drug: string; price: number }> = ({ drug, price }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
    <span className="text-sm font-medium">{drug}</span>
    <span className="text-sm font-semibold text-accent">${price.toLocaleString()}</span>
  </div>
);

const HeadlineItem: React.FC<{ headline: string; impact: number }> = ({ headline, impact }) => {
  const impactColor = impact > 0 ? 'text-green-500' : impact < 0 ? 'text-red-500' : 'text-muted-foreground';
  const ImpactIcon = impact > 0 ? TrendingUp : impact < 0 ? AlertTriangle : TrendingUp; // Simplified icon, can be AlertTriangle for negative too
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


export function MarketInfoCard({ marketPrices, localHeadlines, isLoading }: MarketInfoCardProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <LineChart className="mr-2 h-7 w-7 text-primary-foreground" /> Daily Market
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2 mb-4" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full mb-2" />
            <Skeleton className="h-8 w-full" />
          </>
        ) : (
          <>
            <h3 className="text-lg font-semibold mb-2 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-accent" /> Prices
            </h3>
            {marketPrices.length > 0 ? (
              marketPrices.map(drug => <PriceItem key={drug.drug} drug={drug.drug} price={drug.price} />)
            ) : (
              <p className="text-sm text-muted-foreground">No price data available.</p>
            )}
            
            <h3 className="text-lg font-semibold mt-6 mb-2 flex items-center">
              <Newspaper className="mr-2 h-5 w-5 text-accent" /> Local Headlines
            </h3>
            {localHeadlines.length > 0 ? (
              localHeadlines.map((headline, index) => <HeadlineItem key={index} headline={headline.headline} impact={headline.priceImpact} />)
            ) : (
              <p className="text-sm text-muted-foreground">No local headlines today.</p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
