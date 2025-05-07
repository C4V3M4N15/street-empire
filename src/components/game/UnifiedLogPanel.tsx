
"use client";

import type { LogEntry, LogEventType } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { History, Megaphone, Activity, Plane, ShoppingCart, Coins, ShieldAlert, ShieldCheck, HeartPulse, Award, Info, AlertCircle, Sword, ShieldHalf, BriefcaseMedical, Zap, PackagePlus } from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface UnifiedLogPanelProps {
  eventLog: LogEntry[];
}

const getIconForType = (type: LogEventType) => {
  switch (type) {
    case 'buy': return <ShoppingCart className="h-4 w-4 text-green-500" />;
    case 'sell': return <Coins className="h-4 w-4 text-blue-500" />;
    case 'travel': return <Plane className="h-4 w-4 text-purple-500" />;
    case 'combat_win': return <ShieldCheck className="h-4 w-4 text-green-600" />;
    case 'combat_loss': return <ShieldAlert className="h-4 w-4 text-red-600" />;
    case 'health_update': return <HeartPulse className="h-4 w-4 text-pink-500" />;
    case 'rank_up': return <Award className="h-4 w-4 text-yellow-500" />;
    case 'game_over': return <AlertCircle className="h-4 w-4 text-red-700" />;
    case 'shop_weapon_purchase': return <Sword className="h-4 w-4 text-orange-500" />;
    case 'shop_armor_purchase': return <ShieldHalf className="h-4 w-4 text-blue-600" />;
    case 'shop_healing_purchase': return <BriefcaseMedical className="h-4 w-4 text-teal-500" />;
    case 'shop_capacity_upgrade': return <PackagePlus className="h-4 w-4 text-indigo-400" />;
    case 'event_trigger': return <Megaphone className="h-4 w-4 text-indigo-500" />;
    case 'event_player_impact': return <Zap className="h-4 w-4 text-yellow-600" />;
    case 'info':
    default: return <Info className="h-4 w-4 text-gray-500" />;
  }
};

const LogItemDisplay: React.FC<{ entry: LogEntry }> = ({ entry }) => (
  <div className="flex items-start space-x-2 text-xs p-1.5 border-b border-border/30 last:border-b-0">
    <div className="flex-shrink-0 mt-0.5">
      {getIconForType(entry.type)}
    </div>
    <div className="flex-grow">
      <p className="text-muted-foreground">
        {format(parseISO(entry.timestamp), "MMM d, HH:mm:ss")}
      </p>
      <p>{entry.message}</p>
    </div>
  </div>
);

export function UnifiedLogPanel({ eventLog }: UnifiedLogPanelProps) {
  const eventLogs = eventLog.filter(entry => entry.type === 'event_trigger');
  const actionLogs = eventLog.filter(entry => ['combat_win', 'combat_loss', 'health_update', 'rank_up', 'game_over', 'event_player_impact', 'info'].includes(entry.type));
  const travelLogs = eventLog.filter(entry => entry.type === 'travel');
  const dealLogs = eventLog.filter(entry => ['buy', 'sell', 'shop_weapon_purchase', 'shop_armor_purchase', 'shop_healing_purchase', 'shop_capacity_upgrade'].includes(entry.type));

  const renderLogList = (logs: LogEntry[], categoryName: string) => {
    if (logs.length === 0) {
      return <p className="text-sm text-muted-foreground py-3 text-center">No {categoryName.toLowerCase()} logged yet.</p>;
    }
    return (
      <ScrollArea className="h-[calc(100vh-25rem)] pr-3"> {/* Adjusted height */}
        <div className="space-y-2">
          {logs.map((entry) => (
            <LogItemDisplay key={entry.id} entry={entry} />
          ))}
        </div>
      </ScrollArea>
    );
  };

  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center text-xl">
          <History className="mr-2 h-6 w-6 text-primary-foreground" /> Log Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <Tabs defaultValue="events" className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-3">
            <TabsTrigger value="events" className="flex items-center text-xs sm:text-sm">
              <Megaphone className="mr-1 h-4 w-4" /> Events
            </TabsTrigger>
            <TabsTrigger value="actions" className="flex items-center text-xs sm:text-sm">
              <Activity className="mr-1 h-4 w-4" /> Actions
            </TabsTrigger>
            <TabsTrigger value="travel" className="flex items-center text-xs sm:text-sm">
              <Plane className="mr-1 h-4 w-4" /> Travel
            </TabsTrigger>
            <TabsTrigger value="deals" className="flex items-center text-xs sm:text-sm">
              <ShoppingCart className="mr-1 h-4 w-4" /> Deals
            </TabsTrigger>
          </TabsList>
          <TabsContent value="events">
            {renderLogList(eventLogs, "Events")}
          </TabsContent>
          <TabsContent value="actions">
            {renderLogList(actionLogs, "Actions")}
          </TabsContent>
          <TabsContent value="travel">
            {renderLogList(travelLogs, "Travel")}
          </TabsContent>
          <TabsContent value="deals">
            {renderLogList(dealLogs, "Deals")}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
