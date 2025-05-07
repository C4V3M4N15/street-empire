"use client";

import type { DrugPrice, LocalHeadline } from '@/services/market';
import type { Weapon, Armor, HealingItem, CapacityUpgrade } from '@/types/game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { LineChart, Newspaper, TrendingUp, AlertTriangle, Loader2, Package, DollarSign, ShoppingCart, Coins, Map, Store, ShieldPlus, Sword, ShieldCheck, PackagePlus, BriefcaseMedical, Megaphone, Zap, Info, Percent, ArrowUpCircle, ArrowDownCircle, MinusCircle, CreditCard, Target } from 'lucide-react'; // Added Target
import type { PlayerStats, GameState } from '@/types/game';
import { Separator } from '@/components/ui/separator';
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { NycMap } from './NycMap';
import { ReferencePanel } from './ReferencePanel';
import { cn } from '@/lib/utils';

interface MarketInfoCardProps {
  marketPrices: DrugPrice[];
  localHeadlines: LocalHeadline[];
  isLoading: boolean;
  playerStats: PlayerStats;
  activeBoroughEvents: GameState['activeBoroughEvents'];
  availableWeapons: Weapon[];
  availableArmor: Armor[];
  availableHealingItems: HealingItem[];
  availableCapacityUpgrades: CapacityUpgrade[];
  buyDrug: (drugName: string, quantity: number, price: number) => void;
  sellDrug: (drugName: string, quantity: number, price: number) => void;
  buyWeapon: (weapon: Weapon) => void;
  buyAmmoForEquippedWeapon: () => void; // New prop for buying ammo
  buyArmor: (armor: Armor) => void;
  buyHealingItem: (item: HealingItem) => void;
  buyCapacityUpgrade: (upgrade: CapacityUpgrade) => void;
  travelToLocation: (location: string) => void;
  fetchHeadlinesForLocation: (location: string) => Promise<LocalHeadline[]>;
}

const HeadlineItem: React.FC<{ headline: string; isEvent?: boolean }> = ({ headline, isEvent }) => {
  const IconToUse = isEvent ? Megaphone : Newspaper;
  const iconColor = isEvent ? 'text-yellow-400' : 'text-muted-foreground';

  return (
    <div className={cn("flex items-start space-x-2 py-1.5 border-b border-border/30 last:border-b-0", isEvent && "bg-yellow-500/10 border-yellow-500/50 rounded-sm px-2")}>
      <IconToUse className={cn("h-4 w-4 mt-0.5 shrink-0", iconColor)} />
      <div>
        <p className={cn("text-xs", isEvent && "text-yellow-200 font-semibold")}>{headline}</p>
      </div>
    </div>
  );
};

const MAX_PLAYER_HEALTH = 100;

export function MarketInfoCard({
  marketPrices,
  localHeadlines,
  isLoading,
  playerStats,
  activeBoroughEvents,
  availableWeapons,
  availableArmor,
  availableHealingItems,
  availableCapacityUpgrades,
  buyDrug,
  sellDrug,
  buyWeapon,
  buyAmmoForEquippedWeapon,
  buyArmor,
  buyHealingItem,
  buyCapacityUpgrade,
  travelToLocation,
  fetchHeadlinesForLocation
}: MarketInfoCardProps) {
  const [transactionQuantities, setTransactionQuantities] = React.useState<{ [drugName: string]: string }>({});
  const currentEventInLocation = activeBoroughEvents[playerStats.currentLocation];

  const handleQuantityChange = (drugName: string, value: string) => {
    const numValue = parseInt(value, 10);
    if (value === "" || (numValue >= 0 && !isNaN(numValue))) {
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    } else if (isNaN(numValue) && value !== "") {
      // Allow non-numeric input for immediate feedback if desired, but getNumericQuantity handles parsing
      setTransactionQuantities(prev => ({ ...prev, [drugName]: value }));
    }
  };

  const getNumericQuantity = (drugName: string): number => {
    const valStr = transactionQuantities[drugName] || "";
    if (valStr === "") return 0; // Treat empty string as 0 for calculation
    const val = parseInt(valStr, 10);
    return isNaN(val) || val < 0 ? 0 : val; // Ensure non-negative, valid number
  };

  const getPriceChangeIcon = (direction?: DrugPrice['priceChangeDirection']) => {
    if (direction === 'up') return <ArrowUpCircle className="h-3 w-3 mr-0.5 text-red-500" />;
    if (direction === 'down') return <ArrowDownCircle className="h-3 w-3 mr-0.5 text-green-500" />;
    return <MinusCircle className="h-3 w-3 mr-0.5 text-muted-foreground" />;
  }

  const renderSkeletons = () => (
    <>
      <div className="mb-4">
        <Skeleton className="h-5 w-1/2 mb-2" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b border-border/30">
            <div className="w-1/3">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2 mt-1" />
            </div>
            <Skeleton className="h-4 w-1/6" />
            <div className="flex items-center space-x-1 w-2/5 justify-end">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-8 w-12" />
            </div>
          </div>
        ))}
      </div>
      <div>
        <Skeleton className="h-5 w-1/3 mb-2" />
        {[...Array(2)].map((_, i) => (
          <div key={i} className="py-2 border-b border-border/30">
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        ))}
      </div>
    </>
  );

  return (
    <Card className="shadow-md">
      <Tabs defaultValue="market" className="w-full">
        <CardHeader className="pb-0 pt-4 px-4">
            <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="market" className="flex items-center">
                    <LineChart className="mr-2 h-4 w-4" /> Market
                </TabsTrigger>
                <TabsTrigger value="travel" className="flex items-center">
                    <Map className="mr-2 h-4 w-4" /> Travel
                </TabsTrigger>
                <TabsTrigger value="shop" className="flex items-center">
                    <Store className="mr-2 h-4 w-4" /> The Git'n Place
                </TabsTrigger>
                <TabsTrigger value="reference" className="flex items-center">
                    <Info className="mr-2 h-4 w-4" /> Reference
                </TabsTrigger>
            </TabsList>
        </CardHeader>
        <TabsContent value="market">
          <CardContent className="p-4 pt-3">
            {(isLoading && marketPrices.length === 0) ? (
              renderSkeletons()
            ) : (
              <div className="relative">
                {(isLoading && marketPrices.length > 0) && (
                  <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-lg z-10 -m-4">
                    <Loader2 className="h-8 w-8 animate-spin text-accent" />
                  </div>
                )}

                <h3 className="text-md font-semibold mb-2 flex items-center">
                  <DollarSign className="mr-2 h-4 w-4 text-accent" /> Drug Prices & Inventory ({playerStats.currentLocation})
                </h3>

                {marketPrices.length > 0 ? (
                  <div className="space-y-1 max-h-80 overflow-y-auto pr-1">
                    {marketPrices.map((drug, index) => {
                      const playerHoldings = playerStats.inventory[drug.drug]?.quantity || 0;
                      const currentQuantityInput = getNumericQuantity(drug.drug);
                      const costForBuy = currentQuantityInput * drug.price;
                      const canBuy = playerStats.cash >= costForBuy && currentQuantityInput > 0;
                      const canSell = playerHoldings >= currentQuantityInput && currentQuantityInput > 0;
                      const currentTotalUnits = Object.values(playerStats.inventory).reduce((sum, item) => sum + item.quantity, 0);
                      const canFit = currentTotalUnits + currentQuantityInput <= playerStats.maxInventoryCapacity;

                      const priceChangeColor = drug.priceChangeDirection === 'up' ? 'text-red-500' :
                                               drug.priceChangeDirection === 'down' ? 'text-green-500' :
                                               'text-muted-foreground';

                      return (
                        <React.Fragment key={drug.drug}>
                        <div className="py-2.5">
                          <div className="grid grid-cols-3 sm:grid-cols-4 items-center gap-2 mb-1.5">
                            <div className="col-span-1 sm:col-span-1">
                              <p className={cn("text-sm font-medium truncate", priceChangeColor)} title={drug.drug}>
                                {getPriceChangeIcon(drug.priceChangeDirection)}
                                {drug.drug}
                              </p>
                              <p className="text-xs text-muted-foreground">Have: {playerHoldings.toLocaleString()}</p>
                               <p className="text-xs text-muted-foreground flex items-center">
                                <Percent className="h-3 w-3 mr-0.5 text-blue-400" />
                                Volatility: {typeof drug.volatility === 'number' ? `${(drug.volatility * 100).toFixed(0)}%` : 'N/A'}
                              </p>
                            </div>
                            <p className={cn("text-sm font-semibold text-right sm:text-center", priceChangeColor)}>${drug.price.toLocaleString()}</p>
                            <div className="col-span-3 sm:col-span-2 flex items-center space-x-1.5 justify-end">
                              <Input
                                type="number"
                                placeholder="Qty"
                                value={transactionQuantities[drug.drug] || ""}
                                onChange={(e) => handleQuantityChange(drug.drug, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className="h-8 text-xs w-16 flex-grow-0"
                                min="0"
                                disabled={isLoading}
                              />
                              <Button
                                size="sm"
                                variant="default"
                                onClick={() => {
                                  if (currentQuantityInput > 0) buyDrug(drug.drug, currentQuantityInput, drug.price);
                                }}
                                disabled={isLoading || !canBuy || !canFit}
                                className="h-8 px-2.5 text-xs bg-accent hover:bg-accent/90 text-accent-foreground"
                              >
                                <ShoppingCart className="h-3 w-3 mr-1 sm:mr-0" /> <span className="hidden sm:inline">Buy</span>
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (currentQuantityInput > 0) sellDrug(drug.drug, currentQuantityInput, drug.price);
                                }}
                                disabled={isLoading || !canSell}
                                className="h-8 px-2.5 text-xs"
                              >
                                <Coins className="h-3 w-3 mr-1 sm:mr-0" /> <span className="hidden sm:inline">Sell</span>
                              </Button>
                            </div>
                          </div>
                          {currentQuantityInput > 0 && (
                            <div className="text-xs text-muted-foreground h-3.5">
                              {costForBuy > 0 && canBuy && !canFit && <p className="text-destructive">Not enough space</p>}
                              {costForBuy > 0 && canBuy && canFit && <p>Cost: ${costForBuy.toLocaleString()}</p>}
                              {costForBuy > 0 && !canBuy && playerStats.cash < costForBuy && <p className="text-destructive">Need: ${costForBuy.toLocaleString()}</p>}
                            </div>
                          )}
                          {currentQuantityInput === 0 && <div className="h-3.5"></div>}
                        </div>
                        {index < marketPrices.length -1 && <Separator className="bg-border/50"/>}
                        </React.Fragment>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground py-3">No price data available for {playerStats.currentLocation}.</p>
                )}

                <h3 className="text-md font-semibold mt-4 mb-1.5 flex items-center">
                  <Newspaper className="mr-2 h-4 w-4 text-accent" /> News & Events ({playerStats.currentLocation})
                </h3>
                <div className="max-h-36 overflow-y-auto pr-1 space-y-0.5">
                  {currentEventInLocation ? (
                      <HeadlineItem
                        headline={`${currentEventInLocation.name}: ${currentEventInLocation.text}`}
                        isEvent={true}
                      />
                  ) : (
                     <p className="text-xs text-muted-foreground italic py-1">No major events in {playerStats.currentLocation} today.</p>
                  )}
                  {localHeadlines.length > 0 ? (
                    localHeadlines.map((headline, index) => <HeadlineItem key={index} headline={headline.headline} />)
                  ) : (
                     <p className="text-xs text-muted-foreground italic py-1">No local news updates.</p>
                  )}
                   {localHeadlines.length === 0 && !currentEventInLocation && (
                     <p className="text-xs text-muted-foreground py-3">All quiet on the streets of {playerStats.currentLocation} today.</p>
                   )}
                </div>

              </div>
            )}
          </CardContent>
        </TabsContent>
        <TabsContent value="travel">
          <CardContent className="p-4 pt-3">
            <NycMap
              currentLocation={playerStats.currentLocation}
              onTravel={travelToLocation}
              fetchHeadlinesForLocation={fetchHeadlinesForLocation}
              isLoading={isLoading}
            />
          </CardContent>
        </TabsContent>
         <TabsContent value="shop" className="p-0">
           <CardContent className="p-4 pt-3">
            <h3 className="text-lg font-semibold mb-1 flex items-center">
              <Store className="mr-2 h-5 w-5 text-primary-foreground" /> The Git'n Place
            </h3>
            <p className="text-xs text-muted-foreground mb-3">All your less-than-legal needs, in one shady spot.</p>

            <Tabs defaultValue="weapons" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-3">
                    <TabsTrigger value="weapons" className="flex items-center text-xs sm:text-sm">
                        <Sword className="mr-1 sm:mr-2 h-4 w-4" /> Weapons
                    </TabsTrigger>
                    <TabsTrigger value="armor" className="flex items-center text-xs sm:text-sm">
                        <ShieldCheck className="mr-1 sm:mr-2 h-4 w-4" /> Armor
                    </TabsTrigger>
                    <TabsTrigger value="healing" className="flex items-center text-xs sm:text-sm">
                        <BriefcaseMedical className="mr-1 sm:mr-2 h-4 w-4" /> Healing
                    </TabsTrigger>
                    <TabsTrigger value="capacity" className="flex items-center text-xs sm:text-sm">
                        <PackagePlus className="mr-1 sm:mr-2 h-4 w-4" /> Capacity
                    </TabsTrigger>
                    <TabsTrigger value="iap" className="flex items-center text-xs sm:text-sm">
                        <CreditCard className="mr-1 sm:mr-2 h-4 w-4" /> IAP
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="weapons" className="mt-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {availableWeapons.length > 0 ? (
                        availableWeapons.map(weapon => {
                          const isEquipped = playerStats.equippedWeapon?.name === weapon.name;
                          const ammoStatus = weapon.isFirearm && playerStats.equippedWeaponAmmo && isEquipped
                            ? `(${playerStats.equippedWeaponAmmo.currentInClip}/${playerStats.equippedWeaponAmmo.reserveAmmo})`
                            : "";
                          const ammoCost = weapon.isFirearm ? Math.round(weapon.price * 0.10) : 0;
                          const canAffordAmmo = playerStats.cash >= ammoCost;
                          const isMaxAmmo = weapon.isFirearm && weapon.clipSize && playerStats.equippedWeaponAmmo && isEquipped &&
                                            playerStats.equippedWeaponAmmo.currentInClip === weapon.clipSize &&
                                            playerStats.equippedWeaponAmmo.reserveAmmo === weapon.clipSize * 2;


                          return (
                            <div key={weapon.name} className="flex items-center justify-between p-2.5 border border-border/50 rounded-md bg-card/50">
                              <div>
                                <p className="text-sm font-medium">{weapon.name} {isEquipped && ammoStatus}</p>
                                <p className="text-xs text-muted-foreground">DMG: +{weapon.damageBonus} | Cost: ${weapon.price.toLocaleString()}</p>
                                {weapon.isFirearm && <p className="text-xs text-muted-foreground">Clip Size: {weapon.clipSize} | Ammo Cost: ${ammoCost.toLocaleString()}</p>}
                              </div>
                              <div className="flex flex-col sm:flex-row items-center gap-1">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => buyWeapon(weapon)}
                                  disabled={isLoading || playerStats.cash < weapon.price || isEquipped}
                                  className="text-xs px-3 w-full sm:w-auto"
                                >
                                  {isEquipped ? 'Equipped' : 'Buy'}
                                </Button>
                                {weapon.isFirearm && isEquipped && (
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    onClick={buyAmmoForEquippedWeapon}
                                    disabled={isLoading || !canAffordAmmo || isMaxAmmo}
                                    className="text-xs px-2 w-full sm:w-auto"
                                  >
                                    <Target className="h-3 w-3 mr-1" />
                                    {isMaxAmmo ? 'Max Ammo' : `Buy Clip ($${ammoCost.toLocaleString()})`}
                                  </Button>
                                )}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                         <p className="text-xs text-muted-foreground py-3 text-center">No weapons currently in stock.</p>
                      )}
                    </div>
                </TabsContent>

                <TabsContent value="armor" className="mt-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {availableArmor.length > 0 ? (
                        availableArmor.map(armorItem => (
                          <div key={armorItem.id} className="flex items-center justify-between p-2.5 border border-border/50 rounded-md bg-card/50">
                            <div>
                              <p className="text-sm font-medium">{armorItem.name}</p>
                              <p className="text-xs text-muted-foreground">DEF: +{armorItem.protectionBonus} | Cost: ${armorItem.price.toLocaleString()}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => buyArmor(armorItem)}
                              disabled={isLoading || playerStats.cash < armorItem.price || playerStats.purchasedArmorIds.includes(armorItem.id)}
                              className="text-xs px-3"
                            >
                              {playerStats.purchasedArmorIds.includes(armorItem.id) ? (playerStats.equippedArmor?.id === armorItem.id ? 'Equipped' : 'Owned') : 'Buy'}
                            </Button>
                          </div>
                        ))
                      ) : (
                         <p className="text-xs text-muted-foreground py-3 text-center">No armor currently in stock.</p>
                      )}
                    </div>
                </TabsContent>

                <TabsContent value="healing" className="mt-0">
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {availableHealingItems.length > 0 ? (
                        availableHealingItems.map(item => (
                          <div key={item.id} className="flex items-center justify-between p-2.5 border border-border/50 rounded-md bg-card/50">
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.description} | Cost: ${item.price.toLocaleString()}</p>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => buyHealingItem(item)}
                              disabled={isLoading || playerStats.cash < item.price || playerStats.health >= MAX_PLAYER_HEALTH}
                              className="text-xs px-3"
                            >
                              {playerStats.health >= MAX_PLAYER_HEALTH ? 'Full HP' : 'Use'}
                            </Button>
                          </div>
                        ))
                      ) : (
                         <p className="text-xs text-muted-foreground py-3 text-center">No healing services available.</p>
                      )}
                    </div>
                </TabsContent>

                <TabsContent value="capacity" className="mt-0">
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {availableCapacityUpgrades.length > 0 ? (
                      availableCapacityUpgrades.map(upgrade => (
                        <div key={upgrade.id} className="flex items-center justify-between p-2.5 border border-border/50 rounded-md bg-card/50">
                          <div>
                            <p className="text-sm font-medium">{upgrade.name}</p>
                            <p className="text-xs text-muted-foreground">Capacity: +{upgrade.capacityIncrease} | Cost: ${upgrade.price.toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground/80 italic">{upgrade.description}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => buyCapacityUpgrade(upgrade)}
                            disabled={isLoading || playerStats.cash < upgrade.price || playerStats.purchasedUpgradeIds.includes(upgrade.id)}
                            className="text-xs px-3"
                          >
                            {playerStats.purchasedUpgradeIds.includes(upgrade.id) ? 'Owned' : 'Buy'}
                          </Button>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-muted-foreground py-3 text-center">No capacity upgrades currently available.</p>
                    )}
                  </div>
                </TabsContent>
                <TabsContent value="iap" className="mt-0">
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1 p-2.5">
                    <p className="text-sm font-medium text-center py-4 text-muted-foreground">
                      In-App Purchases - Coming Soon!
                    </p>
                    <p className="text-xs text-muted-foreground text-center">
                      Enhance your empire with exclusive boosts and items.
                    </p>
                  </div>
                </TabsContent>
            </Tabs>
          </CardContent>
        </TabsContent>
        <TabsContent value="reference" className="p-0">
          <CardContent className="p-4 pt-3">
            <ReferencePanel />
          </CardContent>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

