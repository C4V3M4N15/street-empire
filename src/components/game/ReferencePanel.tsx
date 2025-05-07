// src/components/game/ReferencePanel.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, Library, DollarSign, BarChart3, Thermometer, Zap as EventZapIcon, Info } from 'lucide-react'; // Renamed Zap to EventZapIcon to avoid conflict
import type { DrugReference, BoroughReference } from '@/services/referenceData';
import { getDrugReferenceData, getBoroughReferenceData } from '@/services/referenceData';
import { Separator } from '../ui/separator';

const ReferenceItem: React.FC<{ title: string; value?: string | number; icon?: React.ElementType; children?: React.ReactNode }> = ({ title, value, icon: Icon, children }) => (
  <div className="py-1.5 text-xs">
    <div className="flex items-center font-medium text-muted-foreground">
      {Icon && <Icon className="h-3.5 w-3.5 mr-1.5 text-accent" />}
      {title}:
    </div>
    {value && <p className="pl-5">{value}</p>}
    {children && <div className="pl-5">{children}</div>}
  </div>
);


export function ReferencePanel() {
  const [drugData, setDrugData] = useState<DrugReference[]>([]);
  const [boroughData, setBoroughData] = useState<BoroughReference[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const [drugs, boroughs] = await Promise.all([
          getDrugReferenceData(),
          getBoroughReferenceData(),
        ]);
        setDrugData(drugs);
        setBoroughData(boroughs);
      } catch (error) {
        console.error("Failed to load reference data:", error);
        // Potentially set an error state here
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-8 w-1/4 mb-2" />
        <Skeleton className="h-6 w-1/2 mb-1" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="space-y-1 py-2 border-b border-border/30">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="drugs" className="w-full">
      <CardHeader className="pb-2 pt-2 px-0"> 
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="drugs" className="flex items-center text-xs sm:text-sm">
            <BookOpen className="mr-1 sm:mr-2 h-4 w-4" /> Drugs
          </TabsTrigger>
          <TabsTrigger value="boroughs" className="flex items-center text-xs sm:text-sm">
            <Library className="mr-1 sm:mr-2 h-4 w-4" /> Boroughs
          </TabsTrigger>
        </TabsList>
      </CardHeader>
      <TabsContent value="drugs" className="mt-0">
        <ScrollArea className="h-[calc(24rem+40px)] sm:h-[calc(27rem+40px)] pr-3"> 
          {drugData.map((drug, index) => (
            <React.Fragment key={drug.name}>
              <Card className="mb-2 bg-card/30 p-3">
                <CardTitle className="text-sm font-semibold mb-1 text-primary-foreground">{drug.name}</CardTitle>
                <ReferenceItem title="Category" value={drug.category} icon={BookOpen} />
                <ReferenceItem title="Avg. Base Price" value={`$${drug.basePrice.toLocaleString()}`} icon={DollarSign} />
                {drug.volatility !== undefined && <ReferenceItem title="Price Volatility" value={`${(drug.volatility * 100).toFixed(0)}%`} icon={BarChart3} />}
                <ReferenceItem title="Description" value={drug.description} icon={Info}/>
              </Card>
             {index < drugData.length - 1 && <Separator className="my-2 bg-border/40"/>}
            </React.Fragment>
          ))}
        </ScrollArea>
      </TabsContent>
      <TabsContent value="boroughs" className="mt-0">
        <ScrollArea className="h-[calc(24rem+40px)] sm:h-[calc(27rem+40px)] pr-3"> 
           {boroughData.map((borough, index) => (
            <React.Fragment key={borough.name}>
            <Card className="mb-2 bg-card/30 p-3">
              <CardTitle className="text-sm font-semibold mb-1 text-primary-foreground">{borough.name}</CardTitle>
              <ReferenceItem title="Overview" value={borough.description} icon={Info} />
              {borough.typicalHeat && <ReferenceItem title="Typical Heat" value={borough.typicalHeat} icon={Thermometer} />}
              {borough.commonEvents && <ReferenceItem title="Common Events" value={borough.commonEvents} icon={EventZapIcon} />}
              {borough.priceProfile && <ReferenceItem title="Price Profile" value={borough.priceProfile} icon={DollarSign} />}
            </Card>
            {index < boroughData.length - 1 && <Separator className="my-2 bg-border/40"/>}
            </React.Fragment>
          ))}
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
