import { PlayerState } from "./types";
import { EQUIPMENT } from "./data";
import { computeEffectiveStats } from "./state";
import { sfx } from "./audio";

interface Props {
  player: PlayerState;
  onEquip: (slot: "weapon" | "head" | "body" | "acc1" | "acc2", id: string | undefined) => void;
  onClose: () => void;
}

const SLOTS: { key: "weapon" | "head" | "body" | "acc1" | "acc2"; name: string; filter: "weapon" | "head" | "body" | "acc" }[] = [
  { key: "weapon", name: "武器", filter: "weapon" },
  { key: "head", name: "頭", filter: "head" },
  { key: "body", name: "胴", filter: "body" },
  { key: "acc1", name: "装飾1", filter: "acc" },
  { key: "acc2", name: "装飾2", filter: "acc" },
];

export function EquipScreen({ player, onEquip, onClose }: Props) {
  const eff = computeEffectiveStats(player);
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-abyss via-void to-black scanlines vignette overflow-y-auto p-3">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-[9px] text-gold pixel-font">EQUIPMENT</div>
          <h2 className="text-xl jp-font text-blood text-glow-blood">装備</h2>
        </div>
        <button className="pixel-btn text-[10px] px-3 py-1" onClick={() => { sfx.click(); onClose(); }}>閉じる</button>
      </div>

      <div className="pixel-panel p-2 mb-3 grid grid-cols-3 gap-1 text-[10px] jp-font text-bone">
        <div>HP <span className="text-gold">{eff.stats.maxHp}</span></div>
        <div>MP <span className="text-gold">{eff.stats.maxMp}</span></div>
        <div>SPD <span className="text-gold">{eff.stats.spd}</span></div>
        <div>ATK <span className="text-gold">{eff.stats.atk}</span></div>
        <div>DEF <span className="text-gold">{eff.stats.def}</span></div>
        <div>MAG <span className="text-gold">{eff.stats.mag}</span></div>
      </div>

      {SLOTS.map(s => {
        const equipped = player.equipment[s.key];
        const options = player.inventory.filter(id => EQUIPMENT[id]?.slot === s.filter);
        return (
          <div key={s.key} className="pixel-panel p-2 mb-2">
            <div className="flex justify-between items-center mb-1">
              <div className="text-[10px] text-gold pixel-font">{s.name}</div>
              <div className="text-[10px] text-bone jp-font">{equipped ? EQUIPMENT[equipped]?.name : "なし"}</div>
            </div>
            <div className="flex flex-wrap gap-1">
              <button className={`pixel-btn text-[10px] px-2 py-1 ${!equipped ? "pixel-btn-blood" : ""}`} onClick={() => { sfx.click(); onEquip(s.key, undefined); }}>外す</button>
              {options.map(id => {
                const eq = EQUIPMENT[id]!;
                const isOn = equipped === id;
                return (
                  <button key={id} className={`pixel-btn text-[10px] px-2 py-1 ${isOn ? "pixel-btn-gold" : ""} ${eq.cursed ? "pixel-btn-blood" : ""}`}
                    onClick={() => { sfx.click(); onEquip(s.key, id); }}
                    title={eq.desc}>
                    {eq.name}{eq.cursed ? "†" : ""}
                  </button>
                );
              })}
            </div>
            {equipped && <div className="text-[9px] text-muted-foreground jp-font mt-1">{EQUIPMENT[equipped]?.desc}</div>}
          </div>
        );
      })}
    </div>
  );
}
