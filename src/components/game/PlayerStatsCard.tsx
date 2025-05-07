
"use client";

import type { PlayerStats } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Heart, DollarSign, Star, CalendarDays, MapPin, Award, TrendingUp, Activity } from 'lucide-react';

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
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center text-2xl">
          <User className="mr-2 h-7 w-7 text-primary-foreground" /> {playerStats.name}'s Status
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <StatItem icon={Heart} label="Health" value={playerStats.health} iconColor="text-red-500" />
        <StatItem icon={DollarSign} label="Cash" value={`$${playerStats.cash}`} />
        <StatItem icon={Star} label="Reputation" value={playerStats.reputation} iconColor="text-yellow-500" />
        <StatItem icon={CalendarDays} label="Days Passed" value={playerStats.daysPassed} />
        <StatItem icon={MapPin} label="Location" value={playerStats.currentLocation} />
        <StatItem icon={Award} label="Rank" value={playerStats.rank} />
      </CardContent>
    </Card>
  );
}
