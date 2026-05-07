import { useEffect, useMemo, useState } from "react";
import { TitleScreen } from "./TitleScreen";
import { StoryScreen } from "./StoryScreen";
import { ExplorationMap } from "./ExplorationMap";
import { Battle } from "./Battle";
import { UpgradeScreen } from "./UpgradeScreen";
import { EquipScreen } from "./EquipScreen";
import { EndingScreen, EndingKind } from "./EndingScreen";
import { ABYSS_STAGE, EQUIPMENT, STAGES } from "./data";
import { clearSave, createInitialPlayer, load, save } from "./state";
import { PlayerState } from "./types";
import { sfx } from "./audio";

type Mode =
  | { type: "title" }
  | { type: "story"; stageId: number; afterBoss?: boolean }
  | { type: "map" }
  | { type: "battle"; isBoss: boolean; enemyIds: string[] }
  | { type: "upgrade" }
  | { type: "equip" }
  | { type: "victory" }
  | { type: "choice"; question: string; choices: { label: string; value: string }[]; onChoose: (v: string) => void }
  | { type: "ending"; kind: EndingKind }
  | { type: "abyss-intro" };

export function Game() {
  const [player, setPlayer] = useState<PlayerState | null>(null);
  const [mode, setMode] = useState<Mode>({ type: "title" });
  const [shardTakenStage, setShardTakenStage] = useState<Record<number, boolean>>({});
  const [inAbyss, setInAbyss] = useState(false);

  const hasSave = useMemo(() => !!load(), [mode.type === "title"]);

  useEffect(() => { if (player) save(player); }, [player]);

  const stage = inAbyss ? ABYSS_STAGE : (player ? STAGES[player.stage] : STAGES[0]);

  function startNew() {
    const p = createInitialPlayer();
    setPlayer(p); setShardTakenStage({}); setInAbyss(false);
    setMode({ type: "story", stageId: 0 });
  }
  function continueGame() {
    const p = load(); if (!p) return;
    setPlayer(p); setMode({ type: "map" });
  }

  function onStoryDone() {
    if (!player) return;
    if (mode.type === "story" && mode.afterBoss) {
      // after boss story: go to upgrade or next stage
      afterBossFlow();
    } else {
      setMode({ type: "map" });
    }
  }

  function afterBossFlow() {
    if (!player) return;
    // give shard
    const np = { ...player, shards: player.shards + 1 };
    setPlayer(np);
    setMode({ type: "upgrade" });
  }

  function onChooseUpgrade(key: string) {
    if (!player) return;
    const p = { ...player, stats: { ...player.stats } };
    p.shards = Math.max(0, p.shards - 1);
    switch (key) {
      case "hp": p.stats.maxHp += 25; p.stats.hp = p.stats.maxHp; break;
      case "mp": p.stats.maxMp += 15; p.stats.mp = p.stats.maxMp; break;
      case "dark": p.darkAffinity += 0.1; break;
      case "drain": p.darkAffinity += 0; break; // simplified — drain handled in battle as constant; treat as +mag
      case "spd": p.stats.spd += 3; break;
      case "def": p.stats.def += 3; break;
    }
    p.level += 1;
    if (inAbyss) {
      // after abyss boss → secret ending continuation
      setPlayer(p);
      setMode({ type: "ending", kind: "TRUE" });
      return;
    }
    // advance stage
    const nextStageId = p.stage + 1;
    if (nextStageId >= STAGES.length) {
      // Already finished last stage (Ardion). Should be handled separately.
      setPlayer(p); setMode({ type: "title" });
      return;
    }
    p.stage = nextStageId;
    p.encounterIndex = 0;
    p.stats.hp = p.stats.maxHp; p.stats.mp = p.stats.maxMp;
    setPlayer(p);
    setMode({ type: "story", stageId: nextStageId });
  }

  function onEncounter() {
    if (!player) return;
    const enemies = stage.encounters[player.encounterIndex];
    if (!enemies) return;
    setMode({ type: "battle", isBoss: false, enemyIds: enemies });
  }
  function onBossEnter() {
    if (!player || !stage.boss) return;
    // Story prompt for stage 7 (saint) and 8 (hero)
    if (!inAbyss && player.stage === 7) {
      setMode({
        type: "choice", question: "聖女セラフィナ。彼女をどうする？",
        choices: [
          { label: "救う（戦わずして連れ帰る）", value: "save" },
          { label: "討つ", value: "kill" },
        ],
        onChoose: (v) => {
          if (v === "save") {
            const np = { ...player, flagSavedSaint: true, encounterIndex: stage.encounters.length, bossDefeated: [...player.bossDefeated] };
            np.bossDefeated[player.stage] = true;
            np.shards += 1;
            np.inventory = [...new Set([...player.inventory, "saintTear"])];
            setPlayer(np);
            sfx.heal();
            setMode({ type: "story", stageId: player.stage, afterBoss: true });
          } else {
            setMode({ type: "battle", isBoss: true, enemyIds: stage.boss! });
          }
        }
      });
      return;
    }
    if (!inAbyss && player.stage === 8) {
      setMode({
        type: "choice", question: "勇者アルディオン、最後の戦い。",
        choices: [
          { label: "止める（説得を試みる）", value: "stop" },
          { label: "滅ぼす", value: "kill" },
        ],
        onChoose: (v) => {
          const np = { ...player, flagStoppedHero: v === "stop" };
          setPlayer(np);
          setMode({ type: "battle", isBoss: true, enemyIds: stage.boss! });
        }
      });
      return;
    }
    setMode({ type: "battle", isBoss: true, enemyIds: stage.boss });
  }
  function onShard() {
    if (!player) return;
    setShardTakenStage(s => ({ ...s, [player.stage]: true }));
    setPlayer({ ...player, hiddenShards: player.hiddenShards + 1, shards: player.shards + 1 });
  }

  function onWin(drainCount: number, curseCount: number) {
    if (!player) return;
    const isBoss = mode.type === "battle" && mode.isBoss;
    const np: PlayerState = {
      ...player,
      drainCount: player.drainCount + drainCount,
      curseCount: player.curseCount + curseCount,
      stats: { ...player.stats, mp: Math.min(player.stats.maxMp, player.stats.mp + 10) },
    };
    if (!isBoss) {
      np.encounterIndex = player.encounterIndex + 1;
      np.shards = player.shards + 1;
      setPlayer(np);
      setMode({ type: "map" });
    } else {
      // boss win
      np.bossDefeated = [...player.bossDefeated];
      np.bossDefeated[inAbyss ? 99 % player.bossDefeated.length : player.stage] = true;
      np.shards = player.shards + 2;
      // loot
      if (stage.boss) {
        const lootId = (stage.boss[0] && (require_loot(stage.boss[0])));
        if (lootId) np.inventory = [...new Set([...player.inventory, lootId])];
      }
      // Final boss path
      if (!inAbyss && player.stage === 8) {
        // determine ending
        const totalShards = np.hiddenShards;
        const allShards = totalShards >= STAGES.filter(s => s.shard).length;
        let kind: EndingKind = "TRUE";
        if (allShards) kind = "SECRET";
        else if (np.flagSavedSaint && np.flagStoppedHero) kind = "HUMAN";
        else if (np.drainCount >= 10 || np.curseCount >= 6) kind = "DARK";
        setPlayer(np);
        setMode({ type: "ending", kind });
        return;
      }
      if (inAbyss) {
        setPlayer(np);
        setMode({ type: "ending", kind: "SECRET" });
        return;
      }
      setPlayer(np);
      // boss story → upgrade → next stage
      setMode({ type: "story", stageId: player.stage, afterBoss: true });
    }
  }
  function onLose() {
    setMode({ type: "title" });
    if (player) {
      // reset HP for retry
      const p = { ...player, stats: { ...player.stats, hp: player.stats.maxHp, mp: player.stats.maxMp } };
      setPlayer(p); save(p);
    }
  }

  function require_loot(bossId: string): string | undefined {
    const map: Record<string, string> = {
      garm: "ashPlate", elysia: "voidCloak", bald: "emberRing",
      marshal: "marshalCrown", remPriest: "silentSeal", saint: "saintTear",
      ardion: "heroFragment", blackDragon: "bloodCrown",
    };
    return map[bossId];
  }

  function onEquip(slot: any, id: string | undefined) {
    if (!player) return;
    setPlayer({ ...player, equipment: { ...player.equipment, [slot]: id } });
  }

  // ---- Render ----
  if (mode.type === "title") {
    return <TitleScreen hasSave={hasSave} onStart={() => { clearSave(); startNew(); }} onContinue={continueGame} />;
  }
  if (!player) return null;

  if (mode.type === "story") {
    const s = STAGES[mode.stageId];
    const text = mode.afterBoss
      ? `${s.name}を制圧した。\n灰の中から、黒星因子が結晶化する。\n\nヴァルゼインの力が、また一段、戻ってきた。`
      : s.story;
    return <StoryScreen title={s.name} subtitle={s.subtitle} text={text} onContinue={onStoryDone} />;
  }
  if (mode.type === "abyss-intro") {
    return <StoryScreen title={ABYSS_STAGE.name} subtitle={ABYSS_STAGE.subtitle} text={ABYSS_STAGE.story} onContinue={() => setMode({ type: "map" })} />;
  }
  if (mode.type === "choice") {
    return <StoryScreen text={mode.question} choices={mode.choices} onContinue={(v) => mode.onChoose(v!)} />;
  }
  if (mode.type === "map") {
    return <ExplorationMap
      stageName={stage.name}
      stageId={inAbyss ? 8 : player.stage}
      encounterCount={stage.encounters.length}
      encounterIndex={player.encounterIndex}
      hasBoss={!!stage.boss}
      hasShard={!!stage.shard}
      shardTaken={!!shardTakenStage[player.stage]}
      onEncounter={onEncounter}
      onBoss={onBossEnter}
      onShard={onShard}
      onMenu={(m) => m === "equip" ? setMode({ type: "equip" }) : setMode({ type: "title" })}
    />;
  }
  if (mode.type === "battle") {
    return <Battle
      player={player}
      enemyIds={mode.enemyIds}
      isBoss={mode.isBoss}
      stageId={inAbyss ? 8 : player.stage}
      onWin={onWin}
      onLose={onLose}
    />;
  }
  if (mode.type === "upgrade") {
    return <UpgradeScreen player={player} onChoose={onChooseUpgrade} />;
  }
  if (mode.type === "equip") {
    return <EquipScreen player={player} onEquip={onEquip} onClose={() => setMode({ type: "map" })} />;
  }
  if (mode.type === "ending") {
    const showAbyss = mode.kind === "SECRET" && !inAbyss;
    return <EndingScreen kind={mode.kind}
      onRestart={() => { clearSave(); setPlayer(null); setMode({ type: "title" }); }}
      onAbyss={showAbyss ? () => {
        setInAbyss(true);
        const p = { ...player, encounterIndex: 0, stats: { ...player.stats, hp: player.stats.maxHp, mp: player.stats.maxMp } };
        setPlayer(p);
        setMode({ type: "abyss-intro" });
      } : undefined}
    />;
  }
  return null;
}
