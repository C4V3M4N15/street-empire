
"use client";

import type { PlayerStats } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Heart, DollarSign, Star, CalendarDays, MapPin, Award, Package, Briefcase } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface PlayerStatsCardProps {
  playerStats: PlayerStats;
}

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number; iconColor?: string }> = ({ icon: Icon, label, value, iconColor }) => (
  <div className="flex items-center justify-between py-2 border-b border-border/50 last:border-b-0">
    <div className="flex items-center space-x-3">
      <Icon className={`h-5 w-5 ${iconColor || 'text-accent'}`} />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
  </div>
);

export function PlayerStatsCard({ playerStats }: PlayerStatsCardProps) {
  const inventoryEntries = Object.entries(playerStats.inventory);
  const hasInventory = inventoryEntries.length > 0;
  const totalInventoryUnits = inventoryEntries.reduce((sum, [, item]) => sum + item.quantity, 0);

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <User className="mr-2 h-7 w-7 text-primary-foreground" /> {playerStats.name}'s Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <StatItem icon={Heart} label="Health" value={playerStats.health} iconColor="text-red-500" />
        <StatItem icon={DollarSign} label="Cash" value={`$${playerStats.cash.toLocaleString()}`} />
        <StatItem icon={Star} label="Reputation" value={playerStats.reputation} iconColor="text-yellow-500" />
        <StatItem icon={CalendarDays} label="Days Passed" value={playerStats.daysPassed} />
        <StatItem icon={MapPin} label="Location" value={playerStats.currentLocation} />
        <StatItem icon={Award} label="Rank" value={playerStats.rank} />

        {hasInventory && (
          <Accordion type="single" collapsible className="w-full pt-2">
            <AccordionItem value="inventory" className="border-b-0">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline text-muted-foreground hover:text-accent [&[data-state=open]>svg]:text-accent">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-5 w-5 text-accent" />
                  <span>Inventory ({totalInventoryUnits.toLocaleString()} units)</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-0">
                <div className="pl-3 pr-1 space-y-0.5 max-h-40 overflow-y-auto">
                {inventoryEntries.map(([drugName, { quantity, totalCost }]) => {
                  const avgCost = quantity > 0 ? (totalCost / quantity) : 0;
                  return (
                    <div key={drugName} className="grid grid-cols-2 gap-x-2 py-1.5 border-b border-border/30 last:border-b-0 text-xs">
                      <div className="flex items-center space-x-2 col-span-2 mb-0.5">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{drugName}</span>
                      </div>
                      <div className="pl-6">
                        <p><span className="text-muted-foreground">Qty:</span> {quantity.toLocaleString()}</p>
                         <p><span className="text-muted-foreground">Avg Cost:</span> ${avgCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                      <div className="text-right pr-1">
                       
                        <p><span className="text-muted-foreground">Total Spent:</span> ${totalCost.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  );
                })}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        )}
         {!hasInventory && (
            <div className="py-2 text-sm text-muted-foreground flex items-center space-x-3 border-t border-border/50 mt-2 pt-3">
                 <Briefcase className="h-5 w-5 text-accent" />
                <span>Inventory is empty.</span>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
