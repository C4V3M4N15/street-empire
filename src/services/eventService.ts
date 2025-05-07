
import type { GameEvent, EventType, EventEffect } from '@/types/events';

export const NYC_BOROUGHS_EVENTS = ["Manhattan", "Brooklyn", "Queens", "The Bronx", "Staten Island"];

// Define drug categories for event effects based on the new 8-drug list
export const drugCategories = {
  all: [] as string[], // Populated dynamically below
  stimulants_hard: ['Meth', 'Crack'],
  stimulants_cheap: ['Crack'],
  opioids_hard: ['Heroin', 'Dilaudid'],
  opioids_pharma: ['OxyContin', 'Dilaudid'],
  psychedelics_strong: ['LSD'],
  psychedelics_soft: ['Weed', 'Mushrooms'],
  relaxants: ['Weed'],
  party_hard: ['Meth', 'LSD'], // Could add Crack for some parties
  party_soft: ['Weed', 'Mushrooms', 'LSD'],
  expensive: ['Heroin', 'Dilaudid', 'OxyContin', 'Meth', 'LSD'],
  cheap: ['Weed', 'Mushrooms', 'Crack'],
};

const allDrugNamesForCategory = [
    'Weed', 'Mushrooms', 'LSD', 'Meth', 'Crack', 'Heroin', 'OxyContin', 'Dilaudid'
];
drugCategories.all = allDrugNamesForCategory;


// --- Event Pools --- //
// Events are reviewed and adjusted for the new 8-drug list.

const genericEvents: GameEvent[] = [
  {
    id: 'generic_light_rain',
    name: 'Light Rain',
    text: 'Light rain falls over the city, making streets slick.',
    type: 'weather',
    description: 'A light drizzle is making the rounds. Not much impact, but the city looks grimier.',
    effects: { heatChange: 0, priceModifier: { 'Weed': 1.02 } }
  },
  {
    id: 'generic_economic_uptick',
    name: 'Economic Uptick',
    text: 'Positive economic news has people spending a bit more freely.',
    type: 'economy',
    description: 'Good times are rolling, or so they say. More cash flowing around.',
    effects: { priceModifier: { 'Meth': 1.03, 'LSD': 1.02 } } // Adjusted from Cocaine/MDMA
  },
  {
    id: 'generic_undercover_op_rumor',
    name: 'Undercover Op Rumor',
    text: "Whispers of undercover cops are making dealers nervous city-wide.",
    type: 'police',
    description: "There's a buzz about plainclothes officers. Everyone's a bit more cautious.",
    effects: {
        heatChange: 1,
        priceModifier: { 'Heroin': 1.03, 'Meth': 1.03 }
    }
  },
  {
    id: 'generic_pharmaceutical_shortage', // More relevant now with Oxy/Dilaudid
    name: 'Pharmaceutical Shortage',
    text: "A major pharmaceutical supplier reports production issues. Prescription drugs (OxyContin, Dilaudid) are harder to find.",
    type: 'economy',
    description: "Legit pharmacies are running low on some meds, which means the street value for alternatives is up.",
    durationInDays: 3,
    effects: { categoryPriceModifiers: [{ categoryKey: 'opioids_pharma', factor: 1.15 }] }
  },
  {
    id: 'generic_global_shipping_delay',
    name: 'Global Shipping Delays',
    text: "International shipping disruptions are affecting import of all illicit goods.",
    type: 'economy',
    description: "Boats are stuck at sea, and so is a lot of product. Everything's a bit pricier.",
    durationInDays: 5,
    effects: { categoryPriceModifiers: [{ categoryKey: 'all', factor: 1.08 }] }
  },
];

const manhattanEvents: GameEvent[] = [
  {
    id: 'manhattan_wallstreet_raid_major',
    name: 'Major Wall Street Raid',
    text: 'SWAT teams hit multiple financial institutions in a massive crackdown on high-end drug use.',
    type: 'police',
    description: 'The Financial District is crawling with feds. High-end drugs are risky business.',
    effects: { priceModifier: { 'Meth': 1.25, 'OxyContin': 1.20, 'LSD': 1.15 }, heatChange: 2 } // Adjusted from Cocaine/Adderall/Oxy
  },
  {
    id: 'manhattan_celebrity_party_overdose',
    name: 'Celebrity Overdose Scandal',
    text: 'A-list celebrity overdose at a SoHo party. Media frenzy ensues.',
    type: 'celebrity',
    description: 'Paparazzi are everywhere after a celebrity OD. Party drugs are under scrutiny.',
    effects: { priceModifier: { 'LSD': 1.1, 'Meth': 0.9 }, heatChange: 1 } // Adjusted from MDMA/Ketamine
  },
  {
    id: 'manhattan_un_summit_security',
    name: 'UN Summit Security',
    text: 'Midtown locked down for a UN summit. Police presence is overwhelming.',
    type: 'civil',
    description: 'Good luck moving anything through Midtown with this level of security for the UN summit.',
    durationInDays: 3,
    effects: { heatChange: 2, priceModifier: { 'Weed': 1.1, 'Meth': 1.15, 'Heroin': 1.12 } }
  },
  {
    id: 'manhattan_fashion_week_demand',
    name: 'Fashion Week Frenzy',
    text: 'Fashion Week hits Manhattan. Models and designers fuel demand for stimulants.',
    type: 'celebrity',
    description: 'The glitterati are in town for Fashion Week. They want to party and stay sharp.',
    durationInDays: 7,
    effects: { priceModifier: { 'Meth': 1.25, 'LSD': 1.15 }, heatChange: 1 } // Adjusted from Cocaine/Adderall/MDMA
  },
  {
    id: 'manhattan_new_luxury_rehab_opens',
    name: 'Luxury Rehab Opens',
    text: 'A high-profile luxury rehab facility opens on the Upper East Side, attracting wealthy clientele... and scrutiny on opioids.',
    type: 'civil',
    description: 'The new rehab is making waves. Some rich folks are trying to get clean, making certain markets tighter.',
    effects: { priceModifier: { 'OxyContin': 1.10, 'Dilaudid': 1.08 }, heatChange: 0 } // Adjusted from Xanax
  },
  {
    id: 'manhattan_tech_bro_burnout', // Changed from "Nootropics" to general psychedelics
    name: 'Tech Bro Burnout',
    text: 'Reports of widespread burnout in Silicon Alley. Psychedelics see a surge for "mind expansion".',
    type: 'economy',
    description: 'Techies in Flatiron are looking for an escape or an edge. Mind-benders are in.',
    effects: { priceModifier: { 'LSD': 1.12, 'Mushrooms': 1.10 } } // Adjusted from Adderall
  },
  {
    id: 'manhattan_art_gallery_heist',
    name: 'Art Gallery Heist',
    text: 'Major art heist in Chelsea. Police are distracted, focusing resources on the theft.',
    type: 'police',
    description: 'Cops are busy chasing stolen paintings. Might be a good time to lay low or make a quick move.',
    effects: { heatChange: -1 }
  },
  {
    id: 'manhattan_times_square_crackdown',
    name: 'Times Square Tourist Crackdown',
    text: 'NYPD launches a "Quality of Life" crackdown in Times Square. Low-level dealing of Weed and Crack becomes very risky.',
    type: 'police',
    description: 'Times Square is a no-go zone for small-time hustles. Uniforms everywhere.',
    durationInDays: 4,
    effects: { heatChange: 2, priceModifier: { 'Weed': 1.15, 'Crack': 1.20 }, playerImpact: { message: "Times Square is hot! Selling cheap stuff there is asking for trouble."} }
  },
  {
    id: 'manhattan_underground_poker_ring_busted',
    name: 'Poker Ring Busted',
    text: 'An exclusive high-stakes poker ring with ties to organized crime is busted in a penthouse. Stimulant use suspected.',
    type: 'gang',
    description: 'The cops took down a major poker game. Mob guys are pissed, and cash flow for certain vices is disrupted.',
    effects: { heatChange: 1, priceModifier: { 'Meth': 1.08 } } // Was Cocaine
  },
  {
    id: 'manhattan_subway_system_shutdown',
    name: 'Subway System Shutdown',
    text: 'Major signal failure cripples the Manhattan subway system. Movement is a nightmare.',
    type: 'civil',
    description: 'Getting around Manhattan is impossible with the subways down. Surface streets are jammed.',
    durationInDays: 2,
    effects: { heatChange: 0, categoryPriceModifiers: [{ categoryKey: 'all', factor: 1.05}] }
  },
  {
    id: 'manhattan_film_shoot_lockdown',
    name: 'Major Film Shoot',
    text: 'A blockbuster movie is filming, locking down several city blocks. Heightened security and disruption.',
    type: 'civil',
    description: 'Hollywood has taken over parts of Manhattan. Lots of temporary security and street closures.',
    effects: { heatChange: 1 }
  },
  {
    id: 'manhattan_diplomat_scandal',
    name: 'Diplomat Drug Scandal',
    text: 'A foreign diplomat caught in an opioid-related incident. Heightened scrutiny on international connections for Heroin/Dilaudid.',
    type: 'celebrity',
    description: 'International incident! The Feds are looking closely at anything coming in from overseas.',
    effects: { heatChange: 1, priceModifier: { 'Heroin': 1.12, 'Dilaudid': 1.15 } } // Was Opium
  },
  {
    id: 'manhattan_protest_march',
    name: 'Large Protest March',
    text: 'A major protest march is scheduled, drawing thousands and a heavy police presence.',
    type: 'civil',
    description: 'Thousands are marching today. Police are on high alert, and many areas are difficult to access.',
    durationInDays: 1,
    effects: { heatChange: 1, playerImpact: { message: "Massive protest today. Movement restricted, police everywhere." } }
  }
];

const brooklynEvents: GameEvent[] = [
  {
    id: 'brooklyn_warehouse_fire',
    name: 'Warehouse Fire in Bushwick',
    text: 'Massive warehouse fire in Bushwick destroys suspected Meth lab. Certain supplies affected.',
    type: 'civil',
    description: 'A huge fire in Bushwick is making headlines. Rumor has it a major lab went up.',
    effects: { priceModifier: { 'Meth': 1.25, 'Crack': 1.15 }, heatChange: 1 } // Adjusted from Spice/MDMA
  },
  {
    id: 'brooklyn_hipster_festival',
    name: 'Hipster Music Festival',
    text: 'Williamsburg overrun by a massive indie music festival. Demand for "boutique" psychedelics spikes.',
    type: 'civil',
    description: 'Thousands of hipsters in Williamsburg for a music fest. They want the good stuff.',
    durationInDays: 3,
    effects: { priceModifier: { 'Weed': 1.15, 'Mushrooms': 1.20, 'LSD': 1.18 }, heatChange: -1 } // Removed Ketamine
  },
  {
    id: 'brooklyn_gang_truce_meeting',
    name: 'Gang Truce Meeting',
    text: 'Rival Brooklyn gangs reportedly holding a truce meeting. Streets unusually quiet.',
    type: 'gang',
    description: 'Word is the big gangs in BK are talking peace. Might be easier to operate for a bit.',
    durationInDays: 5,
    effects: { heatChange: -2, priceModifier: { 'Crack': 0.95, 'Heroin': 0.97 } }
  },
  {
    id: 'brooklyn_diy_venue_raid',
    name: 'DIY Venue Raid',
    text: 'Police raid a popular DIY music venue in East Williamsburg, citing psychedelic substance use.',
    type: 'police',
    description: 'The cops shut down a big party spot. Heat is up in the area for small-time party drug sales.',
    effects: { heatChange: 1, priceModifier: { 'LSD': 1.10, 'Mushrooms': 1.08 } } // Was MDMA
  },
  {
    id: 'brooklyn_gentrification_protests',
    name: 'Gentrification Protests',
    text: 'Anti-gentrification protests flare up in Bed-Stuy, leading to clashes with police.',
    type: 'civil',
    description: 'Tensions are high in Bed-Stuy. Unrest in the streets and a heavier police presence.',
    durationInDays: 2,
    effects: { heatChange: 1 }
  },
  {
    id: 'brooklyn_new_ferry_route_opens',
    name: 'New Ferry Route',
    text: 'A new ferry route connects Brooklyn to a previously underserved area. New smuggling opportunities for Weed?',
    type: 'civil',
    description: 'The new ferry could be a game changer for moving product, or a new way for cops to watch.',
    effects: { priceModifier: { 'Weed': 0.98 } }
  },
  {
    id: 'brooklyn_food_blogger_craze_weed_edibles',
    name: 'Food Blogger Weed Edible Craze',
    text: 'A popular food blogger highlights artisanal weed edibles from Brooklyn. Demand skyrockets.',
    type: 'celebrity',
    description: 'Suddenly everyone wants gourmet edibles from Brooklyn. If you got the connections, you could make bank.',
    effects: { priceModifier: { 'Weed': 1.20 } }
  },
  {
    id: 'brooklyn_artist_collective_uses_psychedelics',
    name: 'Artist Collective Psychedelic Use',
    text: 'A prominent Brooklyn artist collective is publicly discussing their use of psychedelics for creativity.',
    type: 'celebrity',
    description: 'Psychedelics are the talk of the art scene. Demand for mushrooms and LSD is up among the creative types.',
    effects: { priceModifier: { 'Mushrooms': 1.15, 'LSD': 1.12 } } // Removed DMT
  },
  {
    id: 'brooklyn_bike_gang_turf_war',
    name: 'Bike Gang Turf War',
    text: 'Rival bicycle courier gangs are fighting over delivery turf, some rumored to be moving small packages of Meth.',
    type: 'gang',
    description: 'The bike messengers are at war. It might disrupt small, quick deliveries or create openings.',
    effects: { heatChange: 0, priceModifier: { 'Meth': 1.03 } } // Was Cocaine/MDMA
  },
  {
    id: 'brooklyn_brownstone_renovation_boom',
    name: 'Brownstone Renovation Boom',
    text: 'Construction crews are everywhere as brownstone renovations hit a peak. Lots of cash flowing, and workers looking to unwind with Weed.',
    type: 'economy',
    description: 'New money flooding into Brooklyn brownstones. Construction workers and new owners have cash to spend.',
    effects: { priceModifier: { 'Weed': 1.05, 'Crack': 1.08 } } // Was Cocaine
  },
  {
    id: 'brooklyn_community_garden_drug_bust',
    name: 'Community Garden Drug Bust',
    text: 'Police find a Weed and Mushroom growing operation hidden in a community garden. Locally grown supply hit.',
    type: 'police',
    description: 'Turns out that prize-winning tomato patch was hiding something else. Local green is scarce.',
    effects: { heatChange: 1, priceModifier: { 'Weed': 1.18, 'Mushrooms': 1.10 } }
  },
  {
    id: 'brooklyn_bridge_jumper_scare',
    name: 'Brooklyn Bridge Jumper Scare',
    text: 'Emergency services respond to a jumper threat on the Brooklyn Bridge, causing massive traffic and police diversion.',
    type: 'civil',
    description: 'The Brooklyn Bridge is shut down. Cops are tied up, but so is traffic.',
    effects: { heatChange: -1 }
  },
  {
    id: 'brooklyn_underground_rave_series',
    name: 'Underground Rave Series',
    text: 'A series of secret, high-energy raves are happening across Brooklyn warehouses, fueling demand for LSD and Meth.',
    type: 'civil',
    description: 'If you can find them, the raves are wild. Massive demand for party drugs all week.',
    durationInDays: 4,
    effects: { categoryPriceModifiers: [{ categoryKey: 'party_hard', factor: 1.22 }], heatChange: 1 }
  }
];

const queensEvents: GameEvent[] = [
  {
    id: 'queens_airport_security_tech',
    name: 'New Airport Security Tech',
    text: 'JFK and LaGuardia roll out advanced new scanners. Smuggling routes for Heroin and Dilaudid hit hard.',
    type: 'police',
    description: 'Getting anything through the airports in Queens just got a lot harder thanks to new tech.',
    durationInDays: 7,
    effects: { priceModifier: { 'Heroin': 1.20, 'Dilaudid': 1.25 }, heatChange: 2 } // Adjusted from Cocaine/Fentanyl
  },
  {
    id: 'queens_cultural_festival',
    name: 'Large Cultural Festival',
    text: 'A major ethnic cultural festival in Flushing draws huge crowds. Specific demands for traditional relaxants up.',
    type: 'civil',
    description: 'Flushing is packed for a cultural fest. Some niche markets are buzzing.',
    durationInDays: 3,
    effects: { priceModifier: { 'Weed': 1.15, 'Mushrooms': 1.10 } } // Adjusted from Opium/Ketamine
  },
  {
    id: 'queens_night_market_raid',
    name: 'Night Market Raid',
    text: 'Police raid a popular Queens night market, suspecting illicit goods (Weed) being sold among food stalls.',
    type: 'police',
    description: 'The night market got hit. Cops are shaking down vendors and looking for more than just fake bags.',
    effects: { heatChange: 1, priceModifier: { 'Weed': 1.10 } } // Was Xanax
  },
  {
    id: 'queens_new_casino_opens_near_jfk',
    name: 'New Casino Near JFK',
    text: 'A new casino resort opens near JFK, attracting high rollers. Demand for Meth and OxyContin rises.',
    type: 'economy',
    description: 'The new casino is a magnet for cash and vices. High-end party drugs and stimulants are in demand.',
    effects: { priceModifier: { 'Meth': 1.18, 'OxyContin': 1.15 }, heatChange: 1 } // Adjusted from Cocaine/MDMA
  },
  {
    id: 'queens_ethnic_gang_conflict_flares_up',
    name: 'Ethnic Gang Conflict',
    text: 'Tensions between two ethnic gangs in Jackson Heights flare up over Heroin territory disputes.',
    type: 'gang',
    description: 'It\'s getting ugly in Jackson Heights. Certain supply lines might be disrupted or more dangerous.',
    effects: { heatChange: 1, priceModifier: { 'Heroin': 1.10 } } // Was Opium
  },
  {
    id: 'queens_film_industry_tax_breaks',
    name: 'Film Industry Tax Breaks',
    text: 'Astoria sees a surge in film and TV production thanks to new tax breaks. Lots of crew with cash looking for Weed and Meth.',
    type: 'economy',
    description: 'Movie money is flowing in Astoria. Production crews are working hard and partying hard.',
    effects: { priceModifier: { 'Weed': 1.07, 'Meth': 1.10 } } // Adjusted from Cocaine/Adderall
  },
  {
    id: 'queens_unmarked_vans_patrolling_residential',
    name: 'Unmarked Vans Patrolling',
    text: 'Residents report seeing unmarked vans slowly patrolling quiet residential streets in Flushing, suspected narcs.',
    type: 'police',
    description: 'Be careful making house calls in Flushing. Word is there are spooks in unmarked cars.',
    effects: { heatChange: 1, playerImpact: { message: "Keep an eye out for unmarked vans in Flushing. Could be trouble." } }
  },
  {
    id: 'queens_counterfeit_goods_crackdown',
    name: 'Counterfeit Goods Crackdown',
    text: 'Police are cracking down on counterfeit luxury goods in Jamaica, which often have ties to drug money.',
    type: 'police',
    description: 'The cops are hitting the counterfeit markets hard. This often leads them to other illicit operations.',
    effects: { heatChange: 1 }
  },
  {
    id: 'queens_international_food_expo_security',
    name: 'International Food Expo',
    text: 'A massive international food expo in Queens brings global attention and security.',
    type: 'civil',
    description: 'The world is here for the food expo. Security is tight, but there are also a lot of new faces.',
    durationInDays: 4,
    effects: { heatChange: 1 }
  },
  {
    id: 'queens_abandoned_hospital_rave_bust',
    name: 'Abandoned Hospital Rave Bust',
    text: 'A legendary rave in an abandoned Queens hospital finally gets busted. Major blow to the underground scene for LSD.',
    type: 'police',
    description: 'The party is over at the old Creedmoor site. Cops cleared it out, tons of arrests.',
    effects: { heatChange: 2, priceModifier: { 'LSD': 1.20, 'Mushrooms': 1.15 } } // Was MDMA/Ketamine
  },
  {
    id: 'queens_botanica_raid_for_illegal_herbs', // Changed to Mushrooms/LSD context
    name: 'Botanica Raids for Psychedelics',
    text: 'Several botanicas raided for selling "spiritual" psychedelics like Mushrooms and LSD.',
    type: 'police',
    description: 'The cops are hitting the botanicas. Some of those "special" herbs are now hard to find.',
    effects: { priceModifier: { 'Mushrooms': 1.10, 'LSD': 1.25 } } // Was Ayahuasca/Mescaline
  },
  {
    id: 'queens_airport_worker_strike',
    name: 'Airport Worker Strike',
    text: 'Baggage handlers and ground crew at JFK/LaGuardia go on strike. Chaos at the airports.',
    type: 'civil',
    description: 'The airports are a mess with the strike. Might be easier OR harder to move things, depending on who you know.',
    durationInDays: 3,
    effects: { heatChange: 0, playerImpact: { message: "Airport strike causing chaos! Could be an opportunity or a trap."} }
  }
];

const bronxEvents: GameEvent[] = [
  {
    id: 'bronx_gang_leader_arrested',
    name: 'Major Gang Leader Arrested',
    text: 'High-profile Bronx gang leader busted in a pre-dawn raid. Power vacuum emerging for Crack and Heroin.',
    type: 'gang',
    description: 'The arrest of a top gang figure in The Bronx has thrown the underworld into chaos.',
    effects: {
      priceModifier: { 'Crack': 1.10, 'Heroin': 1.05 }, // Was PCP
      heatChange: 1,
      playerImpact: { message: 'Streets in The Bronx are tense after a big arrest. Could be dangerous, could be opportunity.', triggerCombat: 'gang_activity' }
    }
  },
  {
    id: 'bronx_community_watch_boost',
    name: 'Community Watch Expansion',
    text: 'Several Bronx neighborhoods receive funding to expand community watch programs. Affects Weed and Crack sales.',
    type: 'civil',
    description: 'More eyes on the street in The Bronx as community watch groups get a boost.',
    effects: { heatChange: 1, priceModifier: { 'Weed': 1.05, 'Crack': 1.07 } }
  },
  {
    id: 'bronx_chop_shop_ring_busted',
    name: 'Chop Shop Ring Busted',
    text: 'Massive chop shop operation with ties to local gangs busted in the South Bronx.',
    type: 'police',
    description: 'The cops took down a huge car theft ring. Gangs that relied on it are feeling the heat.',
    effects: { heatChange: 1 }
  },
  {
    id: 'bronx_new_youth_center_opens',
    name: 'New Youth Center Opens',
    text: 'A new youth center opens in a troubled neighborhood, aiming to provide alternatives to street life and Crack use.',
    type: 'civil',
    description: 'The new youth center is getting a lot of positive press. Might make it harder for crews to recruit.',
    effects: { heatChange: -1, priceModifier: { 'Crack': 0.98 } }
  },
  {
    id: 'bronx_illegal_fireworks_factory_explosion',
    name: 'Illegal Fireworks Factory Explosion',
    text: 'An illegal fireworks factory explodes, causing a massive fire and police response.',
    type: 'civil',
    description: 'Big boom in The Bronx! Cops and firefighters are everywhere. Good cover for some things, bad for others.',
    effects: { heatChange: 0 }
  },
  {
    id: 'bronx_hip_hop_block_party_series',
    name: 'Hip Hop Block Party Series',
    text: 'A series of legendary old-school hip hop block parties are happening throughout the summer. Weed demand up.',
    type: 'civil',
    description: 'The block parties are epic. Lots of people, music, and a relaxed vibe, but also attracts some attention.',
    durationInDays: 7,
    effects: { priceModifier: { 'Weed': 1.10 }, heatChange: 0 } // Was MDMA
  },
  {
    id: 'bronx_zoo_escape_scare',
    name: 'Bronx Zoo Escape Scare',
    text: 'Rumors of an animal escape from the Bronx Zoo cause localized panic and heavy police presence near the zoo.',
    type: 'civil',
    description: 'Is that a tiger on the loose? Cops are swarming the area around the Bronx Zoo.',
    effects: { heatChange: 1, playerImpact: { message: "Avoid the Bronx Zoo area! Heavy police presence due to an escape rumor." } }
  },
  {
    id: 'bronx_rival_graffiti_crews_beefing',
    name: 'Rival Graffiti Crews Beefing',
    text: 'Tensions escalate between two notorious graffiti crews, leading to public vandalism and police attention.',
    type: 'gang',
    description: 'The taggers are going at it. Lots of fresh paint, but also more cops looking for vandals.',
    effects: { heatChange: 1 }
  },
  {
    id: 'bronx_undefeated_boxing_prospect_hometown_fight', // Changed from Steroids to Meth
    name: 'Boxing Prospect Hometown Fight',
    text: 'A rising undefeated boxing star from The Bronx has a major hometown fight. Neighborhood pride and heavy betting. Meth use rumored in training camps.',
    type: 'celebrity',
    description: 'The whole borough is backing their local hero. Big money changing hands on bets, and people are celebrating.',
    effects: { priceModifier: { 'Meth': 1.15 }, heatChange: 0 } // Was Steroids/Cocaine
  },
  {
    id: 'bronx_abandoned_rail_line_homeless_encampment_cleared',
    name: 'Rail Line Encampment Cleared',
    text: 'Police clear out a large homeless encampment along an abandoned rail line, displacing many and finding Crack and Heroin.',
    type: 'police',
    description: 'The cops swept the old rail line. Fiends are scattered, and some stashes were likely found.',
    effects: { heatChange: 1, priceModifier: { 'Crack': 1.12, 'Heroin': 1.07 } } // Was Spice
  },
  {
    id: 'bronx_river_cleanup_initiative_finds_evidence',
    name: 'Bronx River Cleanup Finds Evidence',
    text: 'Volunteers cleaning the Bronx River discover discarded weapons and drug paraphernalia, prompting investigation.',
    type: 'civil',
    description: 'The do-gooders found more than just trash in the river. Cops are now poking around.',
    effects: { heatChange: 1 }
  },
  {
    id: 'bronx_major_power_outage',
    name: 'Major Power Outage',
    text: 'A significant power outage hits several Bronx neighborhoods. Dark streets, opportunities and dangers.',
    type: 'civil',
    description: 'Lights out in parts of The Bronx. Good for staying unseen, bad if you need to see what you\'re doing.',
    durationInDays: 1,
    effects: { heatChange: 0, playerImpact: { message: "Power's out in your area of The Bronx. Watch your back." }, triggerCombat: 'fiend_encounter' }
  }
];

const statenIslandEvents: GameEvent[] = [
  {
    id: 'staten_ferry_drug_dog_patrols',
    name: 'Ferry Drug Dog Patrols',
    text: 'Increased K9 units patrolling Staten Island Ferry. Smuggling Weed, Heroin and Meth significantly harder.',
    type: 'police',
    description: 'Drug dogs are all over the S.I. Ferry terminals. Moving anything by boat is risky.',
    durationInDays: 4,
    effects: { heatChange: 2, priceModifier: { 'Weed': 1.15, 'Heroin': 1.12, 'Meth': 1.10 } } // Was Cocaine
  },
  {
    id: 'staten_island_storm_surge', // Adjusted from Fentanyl/Meth
    name: 'Coastal Storm Surge',
    text: 'Coastal storm surge warnings for Staten Island. Ferry services disrupted, some roads flooded. Harder to move Dilaudid.',
    type: 'weather',
    description: 'Bad weather hitting Staten Island. Transport is a mess.',
    effects: { priceModifier: { 'Dilaudid': 1.08, 'Heroin': 1.05 } }
  },
  {
    id: 'staten_island_mob_family_wedding',
    name: 'Mob Family Wedding',
    text: 'A prominent Staten Island mob family is hosting a lavish wedding. Lots of "connected" guests and a temporary truce. Demand for Meth high.',
    type: 'gang',
    description: 'Big mob wedding on the island. Everyone important is there. Cops are watching, but underworld is "behaved".',
    durationInDays: 2,
    effects: { heatChange: -1, priceModifier: { 'Meth': 1.05 } } // Was Cocaine
  },
  {
    id: 'staten_island_ferry_hawk_sighting',
    name: 'Ferry "Hawk" Sighting',
    text: 'The famous Staten Island Ferry "Hawk" (a plainclothes cop) is reportedly very active, spooking dealers.',
    type: 'police',
    description: 'Word is "The Hawk" is out on the prowl on the ferry. Not a good time to be moving product that way.',
    effects: { heatChange: 1 }
  },
  {
    id: 'staten_island_greenbelt_body_found',
    name: 'Body Found in Greenbelt',
    text: 'A body is discovered in the Staten Island Greenbelt, prompting a major police investigation in the parklands.',
    type: 'police',
    description: 'Cops are all over the Greenbelt after a body was found. Not a good place to be stashing or meeting.',
    effects: { heatChange: 2, playerImpact: { message: "Stay out of the Greenbelt. Major police investigation ongoing." } }
  },
  {
    id: 'staten_island_youth_joyriding_crackdown',
    name: 'Youth Joyriding Crackdown',
    text: 'Police are cracking down on youth joyriding in stolen cars, increasing patrols in suburban areas.',
    type: 'police',
    description: 'More cops cruising the quiet streets looking for stolen cars and any other trouble.',
    effects: { heatChange: 1 }
  },
  {
    id: 'staten_island_local_politician_corruption_scandal',
    name: 'Local Politician Corruption Scandal',
    text: 'A Staten Island politician is indicted for corruption, some allegations linked to organized crime.',
    type: 'gang',
    description: 'Big scandal rocking SI politics. Feds are digging, and it might shake up some established "arrangements".',
    effects: { heatChange: 1 }
  },
  {
    id: 'staten_island_new_waterfront_development_displaces_old_businesses',
    name: 'Waterfront Development',
    text: 'New luxury waterfront development plans announced, threatening to displace old, sometimes shady, businesses.',
    type: 'economy',
    description: 'The yuppies are coming. Old waterfront haunts are being bulldozed. Disrupts some established networks.',
    effects: { }
  },
  {
    id: 'staten_island_secret_beach_party_location_leaked',
    name: 'Secret Beach Party Leaked',
    text: 'Location of a popular, secluded beach party (Weed, Mushrooms, LSD focus) gets leaked online. Expecting crowds and possibly police.',
    type: 'civil',
    description: 'That hidden beach spot isn\'t so hidden anymore. Might be a last big blowout before it gets shut down.',
    effects: { heatChange: 1, categoryPriceModifiers: [{ categoryKey: 'party_soft', factor: 1.10 }] }
  },
  {
    id: 'staten_island_ferry_mechanical_issues_long_delays',
    name: 'Ferry Mechanical Issues',
    text: 'The Staten Island Ferry is experiencing major mechanical issues, leading to long delays and cancellations.',
    type: 'civil',
    description: 'Good luck getting on or off the island by ferry today. It\'s a parking lot.',
    durationInDays: 2,
    effects: { priceModifier: { 'Weed': 1.03, 'Heroin': 1.04 } }
  },
  {
    id: 'staten_island_rare_bird_sighting_attracts_crowds',
    name: 'Rare Bird Sighting',
    text: 'A rare bird sighting in a Staten Island park attracts hordes of birdwatchers and media, plus park rangers.',
    type: 'civil',
    description: 'Bird nerds from all over are flocking to SI. Parks are more crowded and patrolled.',
    effects: { heatChange: 0 }
  },
  {
    id: 'staten_island_motorcycle_club_rally', // Changed from Steroids to Meth
    name: 'Motorcycle Club Rally',
    text: 'A large motorcycle club is holding a rally on Staten Island. Expect noise, parties, and a watchful police eye. Meth is popular.',
    type: 'gang',
    description: 'Bikers are taking over parts of SI for a rally. Could mean more access to certain things, or more trouble.',
    durationInDays: 3,
    effects: { heatChange: 1, priceModifier: { 'Meth': 1.10 } }
  }
];


// Combine generic events with borough-specific ones for the final pools
const boroughEventPools: Record<string, GameEvent[]> = {
  "Manhattan": [...genericEvents, ...manhattanEvents],
  "Brooklyn": [...genericEvents, ...brooklynEvents],
  "Queens": [...genericEvents, ...queensEvents],
  "The Bronx": [...genericEvents, ...bronxEvents],
  "Staten Island": [...genericEvents, ...statenIslandEvents],
};

const occurredUniqueEvents = new Set<string>();

export async function getTodaysEvents(daysPassed: number, currentPlayerHeat: Record<string, number>): Promise<Record<string, GameEvent | null>> {
  await new Promise(resolve => setTimeout(resolve, Math.random() * 50 + 20));
  const dailyEvents: Record<string, GameEvent | null> = {};

  for (const borough of NYC_BOROUGHS_EVENTS) {
    const pool = boroughEventPools[borough] || [];
    let potentialEvents = pool.filter(event => {
      if (event.isUnique && occurredUniqueEvents.has(event.id)) return false;
      if (event.triggerConditions) {
        if (event.triggerConditions.minDaysPassed && daysPassed < event.triggerConditions.minDaysPassed) return false;
        if (event.triggerConditions.minHeat && (currentPlayerHeat[borough] || 0) < event.triggerConditions.minHeat) return false;
        if (event.triggerConditions.maxHeat && (currentPlayerHeat[borough] || 0) > event.triggerConditions.maxHeat) return false;
      }
      return true;
    });

    if (potentialEvents.length > 0) {
      if (Math.random() < 0.70) {
        const randomIndex = Math.floor(Math.random() * potentialEvents.length);
        const selectedEvent = potentialEvents[randomIndex];
        dailyEvents[borough] = selectedEvent;
        if (selectedEvent.isUnique) occurredUniqueEvents.add(selectedEvent.id);
      } else {
        const genericPotential = genericEvents.filter(event => !(event.isUnique && occurredUniqueEvents.has(event.id)));
        if (genericPotential.length > 0 && Math.random() < 0.66) {
             const randomIndex = Math.floor(Math.random() * genericPotential.length);
             const selectedGenericEvent = genericPotential[randomIndex];
             dailyEvents[borough] = selectedGenericEvent;
             if (selectedGenericEvent.isUnique) occurredUniqueEvents.add(selectedGenericEvent.id);
        } else {
            dailyEvents[borough] = null;
        }
      }
    } else {
        const genericPotential = genericEvents.filter(event => !(event.isUnique && occurredUniqueEvents.has(event.id)));
        if (genericPotential.length > 0 && Math.random() < 0.5) {
             const randomIndex = Math.floor(Math.random() * genericPotential.length);
             const selectedGenericEvent = genericPotential[randomIndex];
             dailyEvents[borough] = selectedGenericEvent;
             if (selectedGenericEvent.isUnique) occurredUniqueEvents.add(selectedGenericEvent.id);
        } else {
            dailyEvents[borough] = null;
        }
    }
  }
  return dailyEvents;
}

export function resetUniqueEvents(): void {
  occurredUniqueEvents.clear();
}
