
"use client";

import React, { useState, useCallback } from 'react';
import type { GameEvent } from '@/types/events';
import { Loader2, TrendingUp, AlertTriangle, Pin, CheckCircle, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NycMapProps {
  currentLocation: string;
  onTravel: (location: string) => void;
  dailyEvents: Record<string, GameEvent | null>; // Events for all boroughs
  isLoading: boolean;
}

// Simplified SVG path data for NYC boroughs
// viewBox="0 0 350 300"
const boroughs = [
  {
    name: 'Manhattan',
    pathData: "M135,40 L125,150 L130,220 L140,220 L145,150 L135,40 Z", // Tall and thin
    fillColorClass: 'fill-green-500/70', // Semi-transparent fill
    strokeColorClass: 'stroke-green-700',
    labelPosition: { x: 135, y: 130 },
  },
  {
    name: 'Brooklyn',
    pathData: "M140,180 L135,230 L160,260 L190,240 L180,210 L140,180 Z", // Southeast of Manhattan
    fillColorClass: 'fill-yellow-400/70',
    strokeColorClass: 'stroke-yellow-600',
    labelPosition: { x: 160, y: 220 },
  },
  {
    name: 'Queens',
    pathData: "M180,120 L175,200 L190,235 L240,220 L250,150 L220,110 L180,120 Z", // East of Manhattan, North of Brooklyn
    fillColorClass: 'fill-orange-500/70',
    strokeColorClass: 'stroke-orange-700',
    labelPosition: { x: 215, y: 170 },
  },
  {
    name: 'The Bronx',
    pathData: "M140,10 L145,60 L190,70 L200,30 L170,5 L140,10 Z", // North of Manhattan
    fillColorClass: 'fill-red-500/70',
    strokeColorClass: 'stroke-red-700',
    labelPosition: { x: 170, y: 40 },
  },
  {
    name: 'Staten Island',
    pathData: "M70,220 L60,250 L90,280 L110,260 L100,230 L70,220 Z", // Southwest, separated
    fillColorClass: 'fill-purple-500/70',
    strokeColorClass: 'stroke-purple-700',
    labelPosition: { x: 85, y: 250 },
  },
];

const HeadlineItem: React.FC<{ event: GameEvent }> = ({ event }) => {
    const impactColor = event.effects?.priceModifier ? 'text-accent' : event.effects?.categoryPriceModifiers ? 'text-destructive' : 'text-muted-foreground';
    const ImpactIcon = event.effects?.priceModifier ? TrendingUp : event.effects?.categoryPriceModifiers ? AlertTriangle : TrendingUp;
    return (
      <div className="flex items-start space-x-2 py-1.5 border-b border-border/30 last:border-b-0 text-xs">
        <ImpactIcon className={`h-3 w-3 mt-0.5 shrink-0 ${impactColor}`} />
        <div>
          <p>{event.name}</p>
          <p className={`text-[0.7rem] text-muted-foreground`}>{event.text}</p>
        </div>
      </div>
    );
  };

export function NycMap({ currentLocation, onTravel, dailyEvents, isLoading: isGameLoading }: NycMapProps) {
  const [hoveredBorough, setHoveredBorough] = useState<string | null>(null);

  const handleTravelClick = (boroughName: string) => {
    if (boroughName !== currentLocation && !isGameLoading) {
      onTravel(boroughName);
    }
  };

  const handleMouseEnter = useCallback((boroughName: string) => {
    setHoveredBorough(boroughName);
  }, []);

  const handleMouseLeave = () => {
    setHoveredBorough(null);
  };

  return (
    <div className="space-y-4">
      <div 
        className="relative w-full aspect-[350/300] bg-blue-900/30 rounded-md overflow-hidden shadow-lg border-2 border-blue-400/30"
        data-ai-hint="new york city map"
      >
        <svg 
            viewBox="0 0 300 300" 
            className="w-full h-full" 
            aria-labelledby="nyc-map-title"
            preserveAspectRatio="xMidYMid meet"
        >
          <title id="nyc-map-title">Map of New York City Boroughs</title>
          {boroughs.map((borough) => {
            const isCurrent = currentLocation === borough.name;
            const isHovered = hoveredBorough === borough.name;

            return (
              <g key={borough.name}>
                <path
                  d={borough.pathData}
                  className={cn(
                    borough.fillColorClass,
                    borough.strokeColorClass,
                    'stroke-[2px]', 
                    'transition-all duration-200 ease-in-out',
                    'cursor-pointer',
                    isCurrent ? 'opacity-100 scale-[1.02] stroke-white' : 'opacity-70 hover:opacity-90', 
                    isHovered && !isCurrent ? 'opacity-95 scale-[1.03] stroke-yellow-300' : '', 
                    isGameLoading && !isCurrent ? 'cursor-not-allowed opacity-50' : '',
                    isCurrent && isGameLoading ? 'cursor-not-allowed' : ''
                  )}
                  style={{
                    filter: isHovered || isCurrent ? 'drop-shadow(0px 0px 8px rgba(255,255,255,0.6))' : 'drop-shadow(0px 1px 2px rgba(0,0,0,0.5))',
                  }}
                  onMouseEnter={() => handleMouseEnter(borough.name)}
                  onMouseLeave={handleMouseLeave}
                  onClick={() => handleTravelClick(borough.name)}
                  aria-label={`Travel to ${borough.name}`}
                  tabIndex={0}
                />
                <text
                  x={borough.labelPosition.x}
                  y={borough.labelPosition.y}
                  className="text-[8px] sm:text-[10px] font-bold fill-white pointer-events-none select-none"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{ filter: 'drop-shadow(0px 0px 2px rgba(0,0,0,0.8)) drop-shadow(0px 0px 4px rgba(0,0,0,0.5))' }}
                >
                  {borough.name}
                </text>
                {isCurrent && (
                  <MapPin 
                    className="text-yellow-300 animate-pulse" 
                    size={18} 
                    x={borough.labelPosition.x - 9} 
                    y={borough.labelPosition.y - 22} 
                    strokeWidth={2.5}
                    style={{ filter: 'drop-shadow(0px 0px 3px rgba(0,0,0,1))' }}
                  />
                )}
              </g>
            );
          })}
        </svg>
      </div>

      <div className="p-3 border rounded-md bg-card min-h-[120px]">
        <h4 className="text-sm font-semibold mb-2 text-primary-foreground">
          {hoveredBorough ? `Events in ${hoveredBorough}:` : 'Hover over a borough to see current events'}
        </h4>
        {isGameLoading ? (
          <div className="flex items-center justify-center h-24">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <span className="ml-2 text-sm">Loading game day...</span>
          </div>
        ) : hoveredBorough && dailyEvents && dailyEvents[hoveredBorough] ? (
          <div className="max-h-24 overflow-y-auto pr-2 space-y-1">
            <HeadlineItem event={dailyEvents[hoveredBorough]!} />
          </div>
        ) : hoveredBorough && hoveredBorough !== currentLocation ? (
          <p className="text-xs text-muted-foreground pt-2">Nothing major in {hoveredBorough} today.</p>
        ) : hoveredBorough && hoveredBorough === currentLocation ? (
             <div className="flex items-center text-sm text-accent pt-2">
                <CheckCircle className="h-4 w-4 mr-2"/> You are currently in {currentLocation}.
             </div>
        ) : (
          <p className="text-xs text-muted-foreground pt-2">Travel to a new borough to expand your empire, or hover to see today's events.</p>
        )}
      </div>
    </div>
  );
}

