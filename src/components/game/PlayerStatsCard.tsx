"use client";

import type { PlayerStats } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Heart, DollarSign, Star, CalendarDays, MapPin, Award, Package, Briefcase, ShoppingBag, Sword, Zap, ShieldHalf, ShieldCheck, PackagePlus, Target } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext'; 

interface PlayerStatsCardProps {
  playerStats: PlayerStats;
}

const PLAYER_BASE_ATTACK = 5; 
const PLAYER_BASE_PROTECTION = 2; 

const StatItem: React.FC<{ icon: React.ElementType; label: string; value: string | number; iconColor?: string; className?: string }> = ({ icon: Icon, label, value, iconColor, className }) => (
  <div className={cn("flex items-center justify-between py-2 border-b border-border/50 last:border-b-0", className)}>
    <div className="flex items-center space-x-3">
      <Icon className={`h-5 w-5 ${iconColor || 'text-accent'}`} />
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
    </div>
    <span className="text-sm font-semibold">{typeof value === 'number' ? value.toLocaleString() : value}</span>
  </div>
);

export function PlayerStatsCard({ playerStats }: PlayerStatsCardProps) {
  const { user } = useAuth(); 
  const playerName = user?.displayName || playerStats.name; 

  const inventoryEntries = Object.entries(playerStats.inventory);
  const hasInventory = inventoryEntries.length > 0;
  const totalInventoryUnits = inventoryEntries.reduce((sum, [, item]) => sum + item.quantity, 0);

  const currentWeaponName = playerStats.equippedWeapon ? playerStats.equippedWeapon.name : 'Fists';
  const weaponDamageBonus = playerStats.equippedWeapon?.damageBonus || 0;
  // Corrected totalDamage calculation for display: Base attack + weapon bonus
  const totalDamageToDisplay = PLAYER_BASE_ATTACK + weaponDamageBonus;


  const currentArmorName = playerStats.equippedArmor ? playerStats.equippedArmor.name : 'None';
  const armorProtectionBonus = playerStats.equippedArmor?.protectionBonus || 0;
  const totalProtection = PLAYER_BASE_PROTECTION + armorProtectionBonus;

  const ammoDisplay = playerStats.equippedWeapon?.isFirearm && playerStats.equippedWeaponAmmo && playerStats.equippedWeapon.clipSize
    ? `${playerStats.equippedWeaponAmmo.currentInClip}/${playerStats.equippedWeaponAmmo.reserveAmmo} (Clip: ${playerStats.equippedWeapon.clipSize})`
    : 'N/A';


  return (
    <Card className="shadow-lg">
      <CardHeader className="pb-3 pt-4">
        <CardTitle className="flex items-center text-2xl">
          <User className="mr-2 h-7 w-7 text-primary-foreground" /> {playerName}'s Status 
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-0.5 p-4 pt-0">
        <StatItem icon={Heart} label="Health" value={playerStats.health} iconColor="text-red-500" />
        <StatItem icon={DollarSign} label="Cash" value={`$${playerStats.cash.toLocaleString()}`} />
        <StatItem icon={CalendarDays} label="Days Passed" value={playerStats.daysPassed} />
        <StatItem icon={MapPin} label="Location" value={playerStats.currentLocation} />
        <StatItem icon={Award} label="Rank" value={playerStats.rank} />
        <StatItem icon={ShoppingBag} label="Capacity" value={`${totalInventoryUnits.toLocaleString()} / ${playerStats.maxInventoryCapacity.toLocaleString()} units`} />


        <Accordion type="single" collapsible className="w-full pt-1">
          <AccordionItem value="combat-status" className="border-t border-border/50">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline text-muted-foreground hover:text-accent [&[data-state=open]>svg]:text-accent">
              <div className="flex items-center space-x-3">
                <ShieldCheck className="h-5 w-5 text-accent" />
                <span>Combat & Status</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-0 pl-1 pr-1">
              <StatItem icon={Sword} label="Weapon" value={`${currentWeaponName} (DMG: ${playerStats.equippedWeapon ? `+${weaponDamageBonus}` : PLAYER_BASE_ATTACK})`} iconColor="text-orange-500" className="border-t-0" />
              {playerStats.equippedWeapon?.isFirearm && (
                <StatItem icon={Target} label="Ammo" value={ammoDisplay} iconColor="text-yellow-600" />
              )}
              <StatItem icon={Zap} label="Total Damage" value={totalDamageToDisplay} iconColor="text-yellow-400" />
              <StatItem icon={ShieldHalf} label="Armor" value={`${currentArmorName} (DEF: +${armorProtectionBonus})`} iconColor="text-blue-500" />
              <StatItem icon={Zap} label="Total Protection" value={totalProtection} iconColor="text-sky-400" />
              <StatItem icon={Star} label="Reputation" value={playerStats.reputation} iconColor="text-yellow-500" />
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="inventory">
            <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline text-muted-foreground hover:text-accent [&[data-state=open]>svg]:text-accent">
              <div className="flex items-center space-x-3">
                <Briefcase className="h-5 w-5 text-accent" />
                <span>Drug Stash ({totalInventoryUnits.toLocaleString()} units)</span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-0 pb-0">
              {hasInventory ? (
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
              ) : (
                <p className="py-2.5 pl-4 text-xs text-muted-foreground">Stash is empty.</p>
              )}
            </AccordionContent>
          </AccordionItem>

          {playerStats.purchasedUpgradeIds.length > 0 && (
            <AccordionItem value="upgrades">
              <AccordionTrigger className="py-2.5 text-sm font-medium hover:no-underline text-muted-foreground hover:text-accent [&[data-state=open]>svg]:text-accent">
                <div className="flex items-center space-x-3">
                  <PackagePlus className="h-5 w-5 text-accent" />
                  <span>Owned Upgrades</span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-0 pb-0 pl-3 pr-1">
                {playerStats.purchasedUpgradeIds.map(upgradeId => (
                   <p key={upgradeId} className="text-xs py-1 border-b border-border/30 last:border-b-0">
                     {/* Attempt to pretty-print upgrade ID */}
                     {upgradeId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                   </p>
                ))}
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>
      </CardContent>
    </Card>
  );
}
