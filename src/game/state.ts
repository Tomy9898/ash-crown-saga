import { PlayerState } from "./types";
import { EQUIPMENT } from "./data";

export const STORAGE_KEY = "ash-crowned-lord-save-v1";

export function createInitialPlayer(): PlayerState {
  return {
    stats: { hp: 80, maxHp: 80, mp: 30, maxMp: 30, atk: 10, def: 4, mag: 14, spd: 8 },
    level: 1,
    shards: 0,
    hiddenShards: 0,
    darkAffinity: 0,
    drainCount: 0,
    curseCount: 0,
    equipment: { weapon: "rustyClaw" },
    inventory: ["rustyClaw"],
    potions: 3,
    ethers: 2,
    flagSavedSaint: false,
    flagStoppedHero: false,
    stage: 0,
    encounterIndex: 0,
    bossDefeated: Array(9).fill(false),
  };
}

export function computeEffectiveStats(p: PlayerState) {
  const s = { ...p.stats };
  let darkBoost = 0;
  let mpDrain = 0;
  for (const slot of ["weapon", "head", "body", "acc1", "acc2"] as const) {
    const id = p.equipment[slot]; if (!id) continue;
    const eq = EQUIPMENT[id]; if (!eq) continue;
    s.atk += eq.atk || 0; s.def += eq.def || 0; s.mag += eq.mag || 0; s.spd += eq.spd || 0;
    s.maxHp += eq.hp || 0; s.maxMp += eq.mp || 0;
    darkBoost += eq.darkBoost || 0;
    if (eq.cursed?.mpDrain) mpDrain += eq.cursed.mpDrain;
    if (eq.cursed?.hpPenalty) s.maxHp -= eq.cursed.hpPenalty;
  }
  s.hp = Math.min(s.hp, s.maxHp);
  s.mp = Math.min(s.mp, s.maxMp);
  return { stats: s, darkBoost, mpDrain };
}

export function save(p: PlayerState) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(p)); } catch {}
}
export function load(): PlayerState | null {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}
export function clearSave() { try { localStorage.removeItem(STORAGE_KEY); } catch {} }
