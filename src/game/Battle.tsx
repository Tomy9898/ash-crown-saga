import { useEffect, useRef, useState } from "react";
import { Enemy, Element, PlayerState, Status } from "./types";
import { ENEMIES, SKILLS } from "./data";
import { computeEffectiveStats } from "./state";
import { sfx } from "./audio";
import { PixelSprite, getLordSpriteId } from "./sprites";

interface Combatant {
  key: string;
  name: string;
  isPlayer: boolean;
  enemyId?: string;
  hp: number; maxHp: number; mp: number; maxMp: number;
  atk: number; def: number; mag: number; spd: number;
  weak: Element[]; resist: Element[];
  status: Partial<Record<Status, number>>;
  buffs: { wolf?: number; knight?: number; defending?: boolean };
  sprite: string; color: string;
  alive: boolean;
}

interface Props {
  player: PlayerState;
  enemyIds: string[];
  isBoss: boolean;
  stageId: number;
  onWin: (drainCount: number, curseCount: number) => void;
  onLose: () => void;
}

interface FloatNum { id: number; x: number; y: number; text: string; color: string; }

const ELEM_COLOR: Record<Element, string> = {
  dark: "text-purple-400", fire: "text-orange-400", ice: "text-cyan-300",
  thunder: "text-yellow-300", light: "text-yellow-100", blood: "text-red-400", phys: "text-stone-200",
};

export function Battle({ player, enemyIds, isBoss, stageId, onWin, onLose }: Props) {
  const eff = computeEffectiveStats(player);
  const [combatants, setCombatants] = useState<Combatant[]>(() => {
    const playerC: Combatant = {
      key: "p", name: "ヴァルゼイン", isPlayer: true,
      hp: eff.stats.hp, maxHp: eff.stats.maxHp, mp: eff.stats.mp, maxMp: eff.stats.maxMp,
      atk: eff.stats.atk, def: eff.stats.def, mag: eff.stats.mag, spd: eff.stats.spd,
      weak: ["light"], resist: ["dark"], status: {}, buffs: {},
      sprite: getLordSpriteId(stageId), color: "blood", alive: true,
    };
    const enemies: Combatant[] = enemyIds.map((id, i) => {
      const e = ENEMIES[id];
      return {
        key: `e${i}`, name: e.name, isPlayer: false, enemyId: id,
        hp: e.stats.hp, maxHp: e.stats.maxHp, mp: e.stats.mp, maxMp: e.stats.maxMp,
        atk: e.stats.atk, def: e.stats.def, mag: e.stats.mag, spd: e.stats.spd,
        weak: e.weak, resist: e.resist, status: {}, buffs: {},
        sprite: e.sprite, color: e.color, alive: true,
      };
    });
    return [playerC, ...enemies];
  });

  const [log, setLog] = useState<string[]>([
    isBoss ? `★ボス戦 ${combatants.find(c => !c.isPlayer)?.name}！` : "敵が現れた！",
  ]);
  const [turnOrder, setTurnOrder] = useState<string[]>([]);
  const [turnIdx, setTurnIdx] = useState(0);
  const [phase, setPhase] = useState<"start" | "select" | "skills" | "target" | "anim" | "end">("start");
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [targetMode, setTargetMode] = useState<"enemy" | "item" | null>(null);
  const [pendingItem, setPendingItem] = useState<"potion" | "ether" | null>(null);
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const [shakeKey, setShakeKey] = useState<string | null>(null);
  const [bossPhase, setBossPhase] = useState(1);
  const [glitch, setGlitch] = useState(false);
  const [drainCount, setDrainCount] = useState(0);
  const [curseCount, setCurseCount] = useState(0);
  const [potions, setPotions] = useState(player.potions);
  const [ethers, setEthers] = useState(player.ethers);
  const floatId = useRef(0);

  const playerC = combatants[0];
  const aliveEnemies = combatants.filter(c => !c.isPlayer && c.alive);

  function addFloat(text: string, color: string, isPlayer: boolean) {
    const id = ++floatId.current;
    setFloats(f => [...f, { id, x: isPlayer ? 30 : 70, y: 50, text, color }]);
    setTimeout(() => setFloats(f => f.filter(x => x.id !== id)), 900);
  }
  function pushLog(line: string) { setLog(l => [...l.slice(-5), line]); }

  // Build turn order
  useEffect(() => {
    if (phase === "start") {
      const order = [...combatants].filter(c => c.alive).sort((a, b) => b.spd - a.spd).map(c => c.key);
      setTurnOrder(order);
      setTurnIdx(0);
      setPhase("select");
    }
  }, [phase]);

  // Handle current actor
  useEffect(() => {
    if (phase !== "select") return;
    const actor = combatants.find(c => c.key === turnOrder[turnIdx]);
    if (!actor || !actor.alive) { advanceTurn(); return; }

    // Status tick
    if (actor.status.bleed) {
      const dmg = Math.max(2, Math.floor(actor.maxHp * 0.05));
      damageDirect(actor.key, dmg, "出血", "text-red-500");
    }
    if (actor.isPlayer && actor.status.curse) {
      actor.mp = Math.max(0, actor.mp - 3);
      pushLog("呪いがMPを蝕む…");
    }
    if (actor.isPlayer && eff.mpDrain) {
      actor.mp = Math.max(0, actor.mp - eff.mpDrain);
    }
    if (actor.status.fear && Math.random() < 0.3) {
      pushLog(`${actor.name}は恐怖で動けない！`);
      setTimeout(advanceTurn, 600);
      return;
    }
    if (actor.status.silence && !actor.isPlayer) {/* silence mostly affects player */}

    if (!actor.isPlayer) {
      setTimeout(() => enemyAct(actor), 500);
    }
  }, [phase, turnIdx]);

  function advanceTurn() {
    setSelectedSkill(null); setTargetMode(null); setPendingItem(null);
    // decrement statuses & buffs on actor
    setCombatants(cs => cs.map(c => {
      if (c.key !== turnOrder[turnIdx]) return c;
      const ns = { ...c.status };
      (Object.keys(ns) as Status[]).forEach(k => { ns[k] = (ns[k]! - 1); if (ns[k]! <= 0) delete ns[k]; });
      const nb = { ...c.buffs };
      if (nb.wolf) { nb.wolf--; if (nb.wolf <= 0) delete nb.wolf; }
      if (nb.knight) { nb.knight--; if (nb.knight <= 0) delete nb.knight; }
      nb.defending = false;
      return { ...c, status: ns, buffs: nb };
    }));

    // check end
    const aliveE = combatants.filter(c => !c.isPlayer && c.alive).length;
    if (aliveE === 0) { setPhase("end"); sfx.win(); setTimeout(() => onWin(drainCount, curseCount), 800); return; }
    if (!combatants[0].alive) { setPhase("end"); sfx.lose(); setTimeout(onLose, 800); return; }

    let next = (turnIdx + 1) % turnOrder.length;
    if (next === 0) {
      // new round
      const order = combatants.filter(c => c.alive).sort((a, b) => b.spd - a.spd).map(c => c.key);
      setTurnOrder(order); setTurnIdx(0);
    } else {
      setTurnIdx(next);
    }
    setPhase("select");
  }

  function damageDirect(key: string, dmg: number, label: string, color: string) {
    setCombatants(cs => cs.map(c => c.key === key ? { ...c, hp: Math.max(0, c.hp - dmg), alive: c.hp - dmg > 0 } : c));
    addFloat(`${label} ${dmg}`, color, key === "p");
    setShakeKey(key); setTimeout(() => setShakeKey(null), 300);
  }

  function calcDamage(attacker: Combatant, target: Combatant, power: number, element: Element, magic: boolean) {
    const base = magic ? attacker.mag : attacker.atk;
    let dmg = Math.max(1, Math.floor(base * power - target.def * (magic ? 0.4 : 0.7)));
    const isWeak = target.weak.includes(element);
    const isResist = target.resist.includes(element);
    if (isWeak) dmg = Math.floor(dmg * 1.6);
    if (isResist) dmg = Math.floor(dmg * 0.5);
    if (target.buffs.defending) dmg = Math.floor(dmg * 0.5);
    if (attacker.isPlayer && element === "dark") dmg = Math.floor(dmg * (1 + eff.darkBoost));
    if (attacker.isPlayer && element === "blood") {
      const ratio = 1 - attacker.hp / attacker.maxHp;
      dmg = Math.floor(dmg * (1 + ratio));
    }
    return { dmg, isWeak, isResist };
  }

  function applySkill(skillId: string, targetKey?: string) {
    const sk = SKILLS[skillId];
    const attacker = combatants[0];
    if (sk.mp > attacker.mp) { pushLog("MPが足りない！"); setPhase("select"); return; }
    sfx.cast();
    setPhase("anim");

    let weakHit = false;
    setCombatants(cs => {
      const next = cs.map(c => ({ ...c }));
      next[0].mp -= sk.mp;
      const targets = sk.target === "all" ? next.filter(c => !c.isPlayer && c.alive) :
                      sk.target === "self" ? [next[0]] :
                      [next.find(c => c.key === targetKey)!].filter(Boolean);
      const isPhys = sk.element === "phys";
      for (const t of targets) {
        if (sk.target === "self") {
          if (sk.effect?.summon === "wolf") { next[0].buffs.wolf = 2; pushLog("魔狼が現れた！"); }
          if (sk.effect?.summon === "knight") { next[0].buffs.knight = 3; pushLog("黒騎士が守護する！"); }
          continue;
        }
        const { dmg, isWeak, isResist } = calcDamage(next[0], t, sk.power, sk.element, !isPhys);
        t.hp = Math.max(0, t.hp - dmg);
        if (t.hp <= 0) t.alive = false;
        addFloat(`${dmg}${isWeak ? " WEAK!" : isResist ? " resist" : ""}`, isWeak ? "text-yellow-300" : "text-red-300", false);
        if (isWeak) weakHit = true;
        if (sk.effect?.status && Math.random() < (sk.effect.statusChance || 1)) {
          t.status[sk.effect.status] = 3;
          pushLog(`${t.name}は${statusJp(sk.effect.status)}状態！`);
          if (sk.effect.status === "curse") setCurseCount(x => x + 1);
        }
        if (sk.effect?.drain) {
          const heal = Math.floor(dmg * sk.effect.drain);
          next[0].hp = Math.min(next[0].maxHp, next[0].hp + heal);
          addFloat(`+${heal}`, "text-green-300", true);
          setDrainCount(x => x + 1);
        }
      }
      return next;
    });

    pushLog(`ヴァルゼイン: ${sk.name}！`);
    setShakeKey("all"); setTimeout(() => setShakeKey(null), 300);

    setTimeout(() => {
      // wolf bonus attack
      if (combatants[0].buffs.wolf && sk.target !== "self") {
        const tgt = combatants.find(c => c.key === targetKey);
        if (tgt && tgt.alive) {
          const dmg = Math.max(1, Math.floor(combatants[0].atk * 0.6));
          damageDirect(tgt.key, dmg, "魔狼", "text-purple-300");
        }
      }
      if (weakHit && sk.effect?.breakBonus) {
        sfx.break();
        pushLog("★弱点ブレイク！追加ターン！");
        setPhase("select");
      } else {
        advanceTurn();
      }
    }, 450);
  }

  function basicAttack(targetKey: string) {
    const a = combatants[0]; const t = combatants.find(c => c.key === targetKey)!;
    sfx.hit();
    setPhase("anim");
    const { dmg, isWeak, isResist } = calcDamage(a, t, 1.0, "phys", false);
    setCombatants(cs => cs.map(c => c.key === targetKey ? { ...c, hp: Math.max(0, c.hp - dmg), alive: c.hp - dmg > 0 } : c));
    addFloat(`${dmg}${isWeak ? " WEAK!" : isResist ? " resist" : ""}`, isWeak ? "text-yellow-300" : "text-red-300", false);
    pushLog(`ヴァルゼインの攻撃！ ${dmg}ダメージ`);
    setShakeKey(targetKey); setTimeout(() => setShakeKey(null), 300);
    setTimeout(advanceTurn, 450);
  }

  function defend() {
    setCombatants(cs => cs.map(c => c.key === "p" ? { ...c, buffs: { ...c.buffs, defending: true }, mp: Math.min(c.maxMp, c.mp + 5) } : c));
    pushLog("ヴァルゼインは防御の構え。MPを少し回復。");
    sfx.click();
    advanceTurn();
  }

  function useItem(kind: "potion" | "ether") {
    if (kind === "potion") {
      if (potions <= 0) { pushLog("ポーションが無い"); return; }
      setPotions(potions - 1);
      setCombatants(cs => cs.map(c => c.key === "p" ? { ...c, hp: Math.min(c.maxHp, c.hp + 60) } : c));
      addFloat("+60", "text-green-300", true); sfx.heal(); pushLog("HPを60回復した！");
    } else {
      if (ethers <= 0) { pushLog("エーテルが無い"); return; }
      setEthers(ethers - 1);
      setCombatants(cs => cs.map(c => c.key === "p" ? { ...c, mp: Math.min(c.maxMp, c.mp + 30) } : c));
      addFloat("+30 MP", "text-blue-300", true); sfx.heal(); pushLog("MPを30回復した！");
    }
    advanceTurn();
  }

  function enemyAct(actor: Combatant) {
    const e = ENEMIES[actor.enemyId!];
    const target = combatants[0];
    if (!target.alive) { advanceTurn(); return; }

    // Boss phase changes
    if (e.id === "ardion") {
      const ratio = actor.hp / actor.maxHp;
      const ph = ratio > 0.7 ? 1 : ratio > 0.4 ? 2 : ratio > 0.15 ? 3 : 4;
      if (ph !== bossPhase) {
        setBossPhase(ph);
        setGlitch(ph >= 3);
        pushLog(["", "Phase1: 聖剣戦", "Phase2: 光覚醒…！", "Phase3: 光暴走！！", "Final: 自己崩壊モード"][ph]);
      }
    }

    // healer
    if (e.ai === "heal") {
      const lowAlly = combatants.find(c => !c.isPlayer && c.alive && c.hp < c.maxHp * 0.6);
      if (lowAlly && Math.random() < 0.6 && actor.mp >= 10) {
        actor.mp -= 10;
        const heal = Math.floor(actor.mag * 1.4);
        setCombatants(cs => cs.map(c => c.key === lowAlly.key ? { ...c, hp: Math.min(c.maxHp, c.hp + heal) } : c));
        addFloat(`+${heal}`, "text-green-300", false); sfx.heal();
        pushLog(`${actor.name}は${lowAlly.name}を癒した！`);
        setTimeout(advanceTurn, 450);
        return;
      }
    }

    // pick skill
    let chosen = e.skills?.find(s => Math.random() < s.chance);
    if (!chosen && e.skills?.length) chosen = e.skills[0];
    const power = chosen?.power ?? 1.0;
    const element = chosen?.element ?? "phys";
    const skillName = chosen?.name ?? "攻撃";

    if (chosen?.power === 0) {
      // buff like 鉄壁の構え
      setCombatants(cs => cs.map(c => c.key === actor.key ? { ...c, buffs: { ...c.buffs, defending: true } } : c));
      pushLog(`${actor.name}は${skillName}！`);
      sfx.click();
      setTimeout(advanceTurn, 400);
      return;
    }

    sfx.hit();
    const { dmg, isWeak } = calcDamage(actor, target, power, element, element !== "phys");
    let finalDmg = dmg;
    if (combatants[0].buffs.knight) finalDmg = Math.floor(finalDmg * 0.6);
    setCombatants(cs => cs.map(c => c.key === "p" ? { ...c, hp: Math.max(0, c.hp - finalDmg), alive: c.hp - finalDmg > 0 } : c));
    addFloat(`${finalDmg}${isWeak ? " WEAK" : ""}`, "text-red-400", true);
    pushLog(`${actor.name}の${skillName}！ ${finalDmg}ダメージ`);
    setShakeKey("p"); setTimeout(() => setShakeKey(null), 300);

    if (chosen?.status && Math.random() < 0.4) {
      setCombatants(cs => cs.map(c => c.key === "p" ? { ...c, status: { ...c.status, [chosen!.status!]: 3 } } : c));
      pushLog(`ヴァルゼインは${statusJp(chosen.status)}状態！`);
    }
    if (combatants[0].buffs.knight) {
      const counter = Math.max(1, Math.floor(combatants[0].atk * 0.7));
      damageDirect(actor.key, counter, "黒騎士", "text-purple-300");
    }
    setTimeout(advanceTurn, 500);
  }

  // --- Render ---
  const allSkills = ["darkBolt", "abyssWave", "lifeRot", "blackSeal", "wolfCall", "knightCall", "soulDrain", "bloodAbsorb"];
  const bgClass = isBoss ? "from-blood via-abyss to-black" : "from-abyss via-void to-stone-950";

  return (
    <div className={`relative h-full w-full overflow-hidden bg-gradient-to-b ${bgClass} scanlines vignette ${glitch ? "anim-glitch" : ""}`}>
      {/* upper 60% battle stage */}
      <div className="relative h-[60%] w-full">
        {isBoss && <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,hsl(var(--blood)/0.3),transparent_60%)] anim-pulse" />}

        {/* Enemies */}
        <div className="absolute top-6 left-0 right-0 flex justify-around px-2">
          {combatants.filter(c => !c.isPlayer).map((c) => (
            <div key={c.key} className={`flex flex-col items-center ${shakeKey === c.key || shakeKey === "all" ? "anim-shake" : ""} ${!c.alive ? "opacity-20 grayscale" : ""}`}>
              <PixelSprite id={c.sprite} color={c.color} scale={isBoss ? 7 : 5} glow={isBoss ? "hsl(var(--blood))" : undefined} />
              <div className="mt-1 w-20 text-center">
                <div className="text-[9px] text-bone truncate">{c.name}</div>
                <div className="hp-bar"><span style={{ width: `${(c.hp / c.maxHp) * 100}%`, background: "hsl(var(--blood))" }} /></div>
                {c.weak.length > 0 && (
                  <div className="text-[8px] text-yellow-300 mt-0.5">弱:{c.weak.map(elemJp).join("")}</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Player sprite */}
        <div className={`absolute bottom-4 left-6 ${shakeKey === "p" || shakeKey === "all" ? "anim-shake" : ""}`}>
          <PixelSprite id={playerC.sprite} color="blood" scale={6} glow="hsl(var(--blood))" />
        </div>

        {/* Floats */}
        {floats.map(f => (
          <div key={f.id} className={`absolute pixel-font text-sm ${f.color} anim-float`} style={{ left: `${f.x}%`, top: `${f.y}%` }}>{f.text}</div>
        ))}

        {/* Battle log */}
        <div className="absolute bottom-1 left-1 right-1 pixel-panel p-1.5 max-h-20 overflow-hidden">
          {log.slice(-3).map((l, i) => <div key={i} className="text-[10px] jp-font text-bone leading-tight">{l}</div>)}
        </div>
      </div>

      {/* lower 40% command UI */}
      <div className="relative h-[40%] w-full pixel-panel border-t-2 p-2 flex flex-col gap-2">
        {/* Player status */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <div className="text-[10px] text-gold pixel-font">VALZEIN</div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-bone w-6">HP</span>
              <div className="hp-bar flex-1"><span style={{ width: `${(playerC.hp / playerC.maxHp) * 100}%`, background: "hsl(var(--blood))" }} /></div>
              <span className="text-[9px] text-bone w-12 text-right">{playerC.hp}/{playerC.maxHp}</span>
            </div>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-[9px] text-bone w-6">MP</span>
              <div className="hp-bar flex-1"><span style={{ width: `${(playerC.mp / playerC.maxMp) * 100}%`, background: "hsl(220 80% 55%)" }} /></div>
              <span className="text-[9px] text-bone w-12 text-right">{playerC.mp}/{playerC.maxMp}</span>
            </div>
          </div>
        </div>

        {/* Command area */}
        {phase === "select" && combatants[0].alive && turnOrder[turnIdx] === "p" && (
          <div className="grid grid-cols-2 gap-2 flex-1">
            <button className="pixel-btn pixel-btn-blood text-xs" onClick={() => { sfx.click(); setTargetMode("enemy"); setSelectedSkill("attack"); }}>⚔ 攻撃</button>
            <button className="pixel-btn pixel-btn-gold text-xs" onClick={() => { sfx.click(); setPhase("skills"); }}>✦ スキル</button>
            <button className="pixel-btn text-xs" onClick={() => defend()}>🛡 防御</button>
            <button className="pixel-btn text-xs" onClick={() => { sfx.click(); setTargetMode("item"); }}>⚱ アイテム</button>
          </div>
        )}

        {phase === "skills" && (
          <div className="flex-1 overflow-y-auto grid grid-cols-2 gap-1">
            {allSkills.map(id => {
              const s = SKILLS[id]; const enough = playerC.mp >= s.mp;
              return (
                <button key={id} disabled={!enough} className={`pixel-btn text-[10px] py-1 px-1 ${!enough ? "opacity-40" : ""}`}
                  onClick={() => { sfx.click(); setSelectedSkill(id); if (s.target === "self" || s.target === "all") applySkill(id); else { setTargetMode("enemy"); } }}>
                  <div className="text-bone">{s.name}</div>
                  <div className="text-[8px] text-gold">MP{s.mp} {elemJp(s.element)}</div>
                </button>
              );
            })}
            <button className="pixel-btn col-span-2 text-[10px] py-1" onClick={() => setPhase("select")}>← 戻る</button>
          </div>
        )}

        {targetMode === "enemy" && (
          <div className="flex-1 flex flex-col gap-1">
            <div className="text-[10px] text-gold pixel-font">対象を選択</div>
            <div className="flex flex-wrap gap-1">
              {aliveEnemies.map(e => (
                <button key={e.key} className="pixel-btn pixel-btn-blood text-[10px] px-2 py-1"
                  onClick={() => {
                    if (selectedSkill === "attack") basicAttack(e.key);
                    else if (selectedSkill) applySkill(selectedSkill, e.key);
                    setTargetMode(null);
                  }}>{e.name}</button>
              ))}
              <button className="pixel-btn text-[10px] px-2 py-1" onClick={() => { setTargetMode(null); setSelectedSkill(null); }}>戻る</button>
            </div>
          </div>
        )}

        {targetMode === "item" && (
          <div className="flex-1 flex flex-col gap-1">
            <div className="text-[10px] text-gold pixel-font">アイテム</div>
            <div className="flex gap-1">
              <button className="pixel-btn text-[10px] px-2 py-1" onClick={() => useItem("potion")}>HPポーション×{potions}</button>
              <button className="pixel-btn text-[10px] px-2 py-1" onClick={() => useItem("ether")}>エーテル×{ethers}</button>
              <button className="pixel-btn text-[10px] px-2 py-1" onClick={() => setTargetMode(null)}>戻る</button>
            </div>
          </div>
        )}

        {phase !== "select" && phase !== "skills" && !targetMode && (
          <div className="flex-1 flex items-center justify-center text-[10px] text-muted-foreground jp-font">…</div>
        )}
      </div>
    </div>
  );
}

function elemJp(e: Element) {
  return ({ dark: "闇", fire: "火", ice: "氷", thunder: "雷", light: "光", blood: "血", phys: "物" } as Record<Element, string>)[e];
}
function statusJp(s: Status) {
  return ({ curse: "呪い", bleed: "出血", frenzy: "狂乱", silence: "沈黙", fear: "恐怖", seal: "聖印" } as Record<Status, string>)[s];
}
