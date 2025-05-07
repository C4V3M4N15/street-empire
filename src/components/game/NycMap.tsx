
"use client";

import React, { useState, useEffect, useCallback } from 'react';
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
  // Coordinates and dimensions adjusted to approximate the provided map
  // 1: Manhattan (Green)
  { name: 'Manhattan', top: '15%', left: '42%', width: '12%', height: '55%', bgColor: 'bg-green-500/70', hoverBgColor: 'hover:bg-green-600/90', borderColor: 'border-green-700' },
  // 2: Brooklyn (Yellow)
  { name: 'Brooklyn', top: '50%', left: '48%', width: '20%', height: '30%', bgColor: 'bg-yellow-400/70', hoverBgColor: 'hover:bg-yellow-500/90', borderColor: 'border-yellow-600' },
  // 3: Queens (Orange)
  { name: 'Queens', top: '30%', left: '60%', width: '30%', height: '45%', bgColor: 'bg-orange-500/70', hoverBgColor: 'hover:bg-orange-600/90', borderColor: 'border-orange-700' },
  // 4: The Bronx (Red)
  { name: 'The Bronx', top: '5%', left: '48%', width: '22%', height: '25%', bgColor: 'bg-red-500/70', hoverBgColor: 'hover:bg-red-600/90', borderColor: 'border-red-700' },
  // 5: Staten Island (Purple)
  { name: 'Staten Island', top: '60%', left: '22%', width: '18%', height: '28%', bgColor: 'bg-purple-500/70', hoverBgColor: 'hover:bg-purple-600/90', borderColor: 'border-purple-700' },
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
        setHeadlines([]); 
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
      <div 
        className="relative w-full aspect-[4/3] bg-blue-300/30 rounded-md overflow-hidden shadow-lg border-2 border-blue-400/50"
        data-ai-hint="new york city map" // Water background color
      >
        {boroughs.map((borough) => (
          <button
            key={borough.name}
            className={`absolute p-1 sm:p-2 border-2 rounded-md transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-ring
              ${currentLocation === borough.name 
                ? `${borough.bgColor.replace('/70', '/90')} ${borough.borderColor} text-white shadow-xl z-10 ring-2 ring-offset-2 ring-white` 
                : `${borough.bgColor} ${borough.borderColor} text-white ${borough.hoverBgColor}`}
            `}
            style={{ top: borough.top, left: borough.left, width: borough.width, height: borough.height }}
            onMouseEnter={() => handleMouseEnter(borough.name)}
            onMouseLeave={handleMouseLeave}
            onClick={() => handleTravelClick(borough.name)}
            disabled={isGameLoading || currentLocation === borough.name}
            aria-label={`Travel to ${borough.name}`}
          >
            <span className="text-[10px] sm:text-xs font-bold drop-shadow-sm">{borough.name}</span>
            {currentLocation === borough.name && <Pin className="absolute top-1 right-1 h-3 w-3 sm:h-4 sm:w-4 text-white" />}
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
          <p className="text-xs text-muted-foreground">No specific headlines for {hoveredBorough} right now.</p>
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

