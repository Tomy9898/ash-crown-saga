export type Element = "dark" | "fire" | "ice" | "thunder" | "light" | "blood" | "phys";
export type Status = "curse" | "bleed" | "frenzy" | "silence" | "fear" | "seal";

export interface Stats {
  hp: number; maxHp: number;
  mp: number; maxMp: number;
  atk: number; def: number; mag: number; spd: number;
}

export interface Skill {
  id: string;
  name: string;
  desc: string;
  mp: number;
  power: number;
  element: Element;
  target: "one" | "all" | "self";
  effect?: { drain?: number; status?: Status; statusChance?: number; breakBonus?: boolean; hpScale?: boolean; summon?: "wolf" | "knight" };
}

export interface Equipment {
  id: string; name: string; slot: "weapon" | "head" | "body" | "acc";
  atk?: number; def?: number; mag?: number; spd?: number; hp?: number; mp?: number;
  darkBoost?: number; cursed?: { mpDrain?: number; hpPenalty?: number };
  desc: string;
}

export interface Enemy {
  id: string; name: string; sprite: string; color: string;
  stats: Stats;
  weak: Element[]; resist: Element[];
  ai: "basic" | "heal" | "buff" | "berserk" | "boss";
  skills?: { name: string; power: number; element: Element; chance: number; status?: Status }[];
  xp: number; loot?: string;
}

export interface Stage {
  id: number; name: string; subtitle: string;
  bg: string; // gradient class
  encounters: string[][]; // each fight = list of enemy ids
  boss?: string[];
  story: string;
  loot?: string; // equipment id reward
  shard?: boolean;
}

export interface PlayerState {
  stats: Stats;
  level: number;
  shards: number;
  hiddenShards: number;
  darkAffinity: number;
  drainCount: number;
  curseCount: number;
  equipment: { weapon?: string; head?: string; body?: string; acc1?: string; acc2?: string };
  inventory: string[]; // equipment ids
  potions: number;
  ethers: number;
  flagSavedSaint: boolean;
  flagStoppedHero: boolean;
  stage: number;
  encounterIndex: number;
  bossDefeated: boolean[];
}

export type Screen = "title" | "story" | "map" | "battle" | "upgrade" | "equip" | "ending" | "shop";
