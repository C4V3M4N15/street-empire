
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { LocalHeadline } from '@/services/market';
import { Loader2, TrendingUp, AlertTriangle, Pin, CheckCircle } from 'lucide-react';

interface NycMapProps {
  currentLocation: string;
  onTravel: (location: string) => void;
  fetchHeadlinesForLocation: (location: string) => Promise<LocalHeadline[]>;
  isLoading: boolean;
}

const boroughs = [
  { name: 'Manhattan', top: '30%', left: '45%', width: '15%', height: '40%' },
  { name: 'Brooklyn', top: '55%', left: '55%', width: '20%', height: '30%' },
  { name: 'Queens', top: '40%', left: '70%', width: '25%', height: '45%' },
  { name: 'The Bronx', top: '10%', left: '50%', width: '25%', height: '25%' },
  { name: 'Staten Island', top: '70%', left: '20%', width: '20%', height: '25%' },
];

const HeadlineItem: React.FC<{ headline: LocalHeadline }> = ({ headline }) => {
    const impactColor = headline.priceImpact > 0 ? 'text-accent' : headline.priceImpact < 0 ? 'text-destructive' : 'text-muted-foreground';
    const ImpactIcon = headline.priceImpact > 0 ? TrendingUp : headline.priceImpact < 0 ? AlertTriangle : TrendingUp;
    return (
      <div className="flex items-start space-x-2 py-1.5 border-b border-border/30 last:border-b-0 text-xs">
        <ImpactIcon className={`h-3 w-3 mt-0.5 shrink-0 ${impactColor}`} />
        <div>
          <p>{headline.headline}</p>
          <p className={`font-medium ${impactColor}`}>
            Impact: {headline.priceImpact > 0 ? '+' : ''}{(headline.priceImpact * 100).toFixed(0)}%
          </p>
        </div>
      </div>
    );
  };

export function NycMap({ currentLocation, onTravel, fetchHeadlinesForLocation, isLoading: isGameLoading }: NycMapProps) {
  const [hoveredBorough, setHoveredBorough] = useState<string | null>(null);
  const [headlines, setHeadlines] = useState<LocalHeadline[]>([]);
  const [isLoadingHeadlines, setIsLoadingHeadlines] = useState(false);

  const handleMouseEnter = useCallback(async (boroughName: string) => {
    setHoveredBorough(boroughName);
    if (boroughName === currentLocation) {
        setHeadlines([]); // Don't fetch for current location immediately or show stale
        return;
    }
    setIsLoadingHeadlines(true);
    try {
      const fetchedHeadlines = await fetchHeadlinesForLocation(boroughName);
      setHeadlines(fetchedHeadlines);
    } catch (error) {
      console.error(`Failed to fetch headlines for ${boroughName}:`, error);
      setHeadlines([]);
    } finally {
      setIsLoadingHeadlines(false);
    }
  }, [fetchHeadlinesForLocation, currentLocation]);

  const handleMouseLeave = () => {
    setHoveredBorough(null);
    setHeadlines([]);
  };

  const handleTravelClick = (boroughName: string) => {
    if (boroughName !== currentLocation) {
      onTravel(boroughName);
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full aspect-[4/3] bg-muted rounded-md overflow-hidden shadow-lg">
        <Image
          src="https://picsum.photos/seed/nycmap/800/600"
          alt="Stylized Map of New York City"
          layout="fill"
          objectFit="cover"
          data-ai-hint="stylized map New York City"
          className="opacity-70"
        />
        {boroughs.map((borough) => (
          <button
            key={borough.name}
            className={`absolute p-2 border-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring
              ${currentLocation === borough.name 
                ? 'bg-accent/80 border-accent text-accent-foreground shadow-xl' 
                : 'bg-card/70 border-card hover:bg-primary/70 hover:border-primary'}
            `}
            style={{ top: borough.top, left: borough.left, width: borough.width, height: borough.height }}
            onMouseEnter={() => handleMouseEnter(borough.name)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleTravelClick(borough.name)}
            disabled={isGameLoading || currentLocation === borough.name}
            aria-label={`Travel to ${borough.name}`}
          >
            <span className="text-xs sm:text-sm font-semibold">{borough.name}</span>
            {currentLocation === borough.name && <Pin className="absolute top-1 right-1 h-4 w-4" />}
          </button>
        ))}
      </div>

      <div className="p-3 border rounded-md bg-card min-h-[120px]">
        <h4 className="text-sm font-semibold mb-2 text-primary-foreground">
          {hoveredBorough ? `Headlines in ${hoveredBorough}:` : 'Hover over a borough to see headlines'}
        </h4>
        {isLoadingHeadlines ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="ml-2 text-sm">Loading headlines...</span>
          </div>
        ) : headlines.length > 0 ? (
          <ScrollArea className="h-24 pr-2">
            <div className="space-y-1">
              {headlines.map((headline, index) => (
                <HeadlineItem key={index} headline={headline} />
              ))}
            </div>
          </ScrollArea>
        ) : hoveredBorough && hoveredBorough !== currentLocation ? (
          <p className="text-xs text-muted-foreground">No specific headlines for {hoveredBorough} right now, or already there.</p>
        ) : hoveredBorough && hoveredBorough === currentLocation ? (
             <div className="flex items-center text-sm text-accent">
                <CheckCircle className="h-4 w-4 mr-2"/> You are currently in {currentLocation}.
             </div>
        ) : (
          <p className="text-xs text-muted-foreground">Travel to a new borough to expand your empire.</p>
        )}
      </div>
    </div>
  );
}
