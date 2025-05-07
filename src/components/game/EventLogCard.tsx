
"use client";

import type { LogEntry, LogEventType } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BookText, ShoppingCart, Coins, Plane, ShieldAlert, ShieldCheck, HeartPulse, Award, Info, AlertCircle, Sword } from 'lucide-react'; // Added Sword
import { format, parseISO } from 'date-fns';

interface EventLogCardProps {
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
    case 'info':
    default: return <Info className="h-4 w-4 text-gray-500" />;
  }
};

export function EventLogCard({ eventLog }: EventLogCardProps) {
  return (
    <Card className="shadow-md">
      <CardHeader className="pb-3 pt-4 px-4">
        <CardTitle className="flex items-center text-xl">
          <BookText className="mr-2 h-6 w-6 text-primary-foreground" /> Event Log
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {eventLog.length === 0 ? (
          <p className="text-sm text-muted-foreground py-3 text-center">No events yet.</p>
        ) : (
          <ScrollArea className="h-48 pr-3"> {/* Adjust height as needed */}
            <div className="space-y-2">
              {eventLog.map((entry) => (
                <div key={entry.id} className="flex items-start space-x-2 text-xs p-1.5 border-b border-border/30 last:border-b-0">
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
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
