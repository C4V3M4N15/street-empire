
"use client";

import type { PlayerStats, EnemyStats, LogEntry } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Sword, Heart, User, Skull, Zap, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { format, parseISO } from 'date-fns';

interface BattleScreenProps {
  playerStats: PlayerStats;
  enemyStats: EnemyStats;
  battleLog: LogEntry[];
  battleMessage: string | null;
  onPlayerAction: (action: 'attack' /* | 'item' | 'flee' */) => void;
  onEndBattle: () => void; // To return to main game UI after victory/defeat message
  isLoading: boolean; // To disable actions during processing
}

const StatDisplay: React.FC<{ icon: React.ElementType; label: string; value: string | number; iconColor?: string }> = ({ icon: Icon, label, value, iconColor }) => (
  <div className="flex items-center space-x-2 text-sm">
    <Icon className={`h-4 w-4 ${iconColor || 'text-muted-foreground'}`} />
    <span>{label}:</span>
    <span className="font-semibold">{value}</span>
  </div>
);

const PLAYER_BASE_ATTACK = 5; 
const PLAYER_BASE_DEFENSE = 2;
const MAX_PLAYER_HEALTH = 100;

export function BattleScreen({
  playerStats,
  enemyStats,
  battleLog,
  battleMessage,
  onPlayerAction,
  onEndBattle,
  isLoading,
}: BattleScreenProps) {

  const playerEffectiveAttack = PLAYER_BASE_ATTACK + (playerStats.equippedWeapon?.damageBonus || 0);
  const playerEffectiveDefense = PLAYER_BASE_DEFENSE + (playerStats.equippedArmor?.protectionBonus || 0);

  return (
    <div className="fixed inset-0 bg-background/90 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-50 overflow-y-auto">
      <Card className="w-full max-w-2xl shadow-2xl border-2 border-destructive/50">
        <CardHeader className="text-center pb-2 pt-4">
          <CardTitle className="text-3xl font-bold text-destructive-foreground flex items-center justify-center">
            <Zap className="mr-2 h-8 w-8 animate-pulse" /> BATTLE! <Zap className="ml-2 h-8 w-8 animate-pulse" />
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-4">
          {/* Player and Enemy Stats Side-by-Side */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
            {/* Player Card */}
            <Card className="bg-card/80 border-primary/50">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-xl flex items-center"><User className="mr-2 h-5 w-5 text-primary" />{playerStats.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                <div className="w-full h-20 relative mb-2 rounded overflow-hidden border border-primary/30">
                  <Image 
                    src={`https://picsum.photos/seed/${playerStats.name.replace(/\s/g, '')}/200/100`} 
                    alt="Player Avatar" 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="player character" 
                  />
                </div>
                <Progress value={ (playerStats.health / MAX_PLAYER_HEALTH) * 100 } aria-label="Player health" className="h-3 bg-red-700/50 [&>div]:bg-red-500" />
                <StatDisplay icon={Heart} label="Health" value={`${playerStats.health} / ${MAX_PLAYER_HEALTH}`} iconColor="text-red-500" />
                <StatDisplay icon={Sword} label="Attack" value={playerEffectiveAttack} />
                <StatDisplay icon={Shield} label="Defense" value={playerEffectiveDefense} />
              </CardContent>
            </Card>

            {/* Enemy Card */}
            <Card className="bg-card/80 border-destructive/50">
              <CardHeader className="pb-2 pt-3">
                <CardTitle className="text-xl flex items-center"><Skull className="mr-2 h-5 w-5 text-destructive" />{enemyStats.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs">
                 <div className="w-full h-20 relative mb-2 rounded overflow-hidden border border-destructive/30">
                   <Image 
                    src={`https://picsum.photos/seed/${enemyStats.spriteSeed || enemyStats.name.replace(/\s/g, '')}/200/100`} 
                    alt={`${enemyStats.name} Avatar`} 
                    layout="fill" 
                    objectFit="cover"
                    data-ai-hint="enemy character"
                  />
                 </div>
                <Progress value={(enemyStats.health / enemyStats.maxHealth) * 100} aria-label={`${enemyStats.name} health`} className="h-3 bg-orange-700/50 [&>div]:bg-orange-500"/>
                <StatDisplay icon={Heart} label="Health" value={`${enemyStats.health} / ${enemyStats.maxHealth}`} iconColor="text-orange-500" />
                <StatDisplay icon={Sword} label="Attack" value={enemyStats.attack} />
                <StatDisplay icon={Shield} label="Defense" value={enemyStats.defense} />
              </CardContent>
            </Card>
          </div>

          {/* Battle Log */}
          <Card className="bg-muted/30">
            <CardHeader className="p-2">
              <CardTitle className="text-sm font-medium">Battle Log</CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              <ScrollArea className="h-24 w-full pr-3">
                {battleLog.length === 0 && <p className="text-xs text-muted-foreground italic text-center">The air is tense...</p>}
                {battleLog.map(entry => (
                  <p key={entry.id} className="text-xs py-0.5 border-b border-border/20 last:border-b-0">
                    <span className="text-muted-foreground/80 mr-1">{format(parseISO(entry.timestamp), "HH:mm:ss")}:</span>
                    {entry.message}
                  </p>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions / Battle Message */}
          {battleMessage ? (
            <div className="text-center space-y-3 py-2">
              <p className={`text-xl font-bold ${playerStats.health > 0 && enemyStats.health <= 0 ? 'text-accent' : 'text-destructive'}`}>
                {battleMessage}
              </p>
              <Button onClick={onEndBattle} className="w-1/2" variant={playerStats.health > 0 && enemyStats.health <= 0  ? "default" : "destructive"}>
                Continue
              </Button>
            </div>
          ) : (
            <div className="flex justify-around items-center pt-2">
              <Button 
                onClick={() => onPlayerAction('attack')} 
                disabled={isLoading}
                className="w-1/3 py-3 text-base bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Sword className="mr-2 h-5 w-5" /> Attack</>}
              </Button>
              {/* 
              <Button onClick={() => onPlayerAction('item')} disabled={isLoading || true} className="w-1/4 py-3 text-base">Use Item</Button>
              <Button onClick={() => onPlayerAction('flee')} disabled={isLoading || true} className="w-1/4 py-3 text-base">Flee</Button> 
              */}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
