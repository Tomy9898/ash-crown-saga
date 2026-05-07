import { PlayerState } from "./types";
import { sfx } from "./audio";

interface Props {
  player: PlayerState;
  onChoose: (key: string) => void;
}

const OPTIONS = [
  { key: "hp", name: "最大HP増加", desc: "+25 最大HP・現HP全回復", icon: "♥" },
  { key: "mp", name: "最大MP増加", desc: "+15 最大MP・現MP全回復", icon: "✦" },
  { key: "dark", name: "闇属性威力増加", desc: "闇威力+10%", icon: "✷" },
  { key: "drain", name: "吸収量増加", desc: "ドレイン効果+15%", icon: "♺" },
  { key: "spd", name: "敏捷増加", desc: "+3 SPD", icon: "≫" },
  { key: "def", name: "防御力増加", desc: "+3 DEF", icon: "▣" },
];

export function UpgradeScreen({ player, onChoose }: Props) {
  return (
    <div className="relative h-full w-full bg-gradient-to-b from-abyss via-void to-black scanlines vignette overflow-hidden flex flex-col">
      <div className="text-center pt-6 pb-3">
        <div className="text-[10px] text-gold pixel-font">BLACK STAR FACTOR</div>
        <h2 className="text-2xl jp-font text-blood text-glow-blood mt-1">黒星因子を捧げよ</h2>
        <div className="text-[10px] text-muted-foreground mt-1">所持: {player.shards}（1つ消費）</div>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pb-4 grid gap-2">
        {OPTIONS.map(o => (
          <button key={o.key} className="pixel-btn pixel-btn-gold text-left p-3"
            onClick={() => { sfx.cast(); onChoose(o.key); }}>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-blood">{o.icon}</span>
              <div>
                <div className="text-[12px] text-gold jp-font">{o.name}</div>
                <div className="text-[10px] text-bone jp-font">{o.desc}</div>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
