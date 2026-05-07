import { sfx } from "./audio";

export type EndingKind = "TRUE" | "DARK" | "HUMAN" | "SECRET";

const ENDINGS: Record<EndingKind, { name: string; jp: string; color: string; text: string }> = {
  TRUE: {
    name: "TRUE END", jp: "灰冠を戴かぬ王",
    color: "hsl(45 85% 55%)",
    text: "勇者を討ち果たした魔王は、灰の玉座に剣を突き立てた。\n──支配は、ここで終わる。\n人と魔の境界が崩れ、エレディア大陸に新しい灰色の朝が来る。",
  },
  DARK: {
    name: "DARK END", jp: "深淵に堕ちた王",
    color: "hsl(270 60% 50%)",
    text: "吸収と呪詛を重ねたヴァルゼインは、魔王ですらなくなった。\n灰冠は黒く焦げ、王座から這い出るのは──ただの飢えた怪物。\nエレディアは新たな支配者の名を、まだ知らない。",
  },
  HUMAN: {
    name: "HUMAN END", jp: "光と影の和解",
    color: "hsl(50 90% 80%)",
    text: "聖女を救い、勇者の凶刃を止めた魔王。\nアルディオンは膝をつき、生まれて初めて人として涙した。\n聖王国は崩壊するが、その灰の中から、最初の対話が始まる。",
  },
  SECRET: {
    name: "SECRET END", jp: "黒星鉱の真実",
    color: "hsl(280 70% 60%)",
    text: "集めた黒星片が共鳴し、地の底で何かが目覚めた。\n勇者も魔王も、王国も魔界も──全ては『黒星鉱』に踊らされていた。\n真の戦いは、これから始まる。\n\n──灰深宮に挑め。",
  },
};

export function EndingScreen({ kind, onRestart, onAbyss }: { kind: EndingKind; onRestart: () => void; onAbyss?: () => void }) {
  const e = ENDINGS[kind];
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-black via-abyss to-black scanlines vignette flex flex-col items-center p-6">
      <div className="text-[10px] pixel-font tracking-widest opacity-80 mt-6" style={{ color: e.color }}>{e.name}</div>
      <h1 className="text-3xl jp-font mt-2 text-glow-blood" style={{ color: e.color }}>{e.jp}</h1>

      <div className="flex-1 mt-8 pixel-panel p-4 w-full overflow-y-auto">
        <p className="jp-font text-bone text-[12px] leading-relaxed whitespace-pre-line">{e.text}</p>
      </div>

      <div className="text-[9px] text-muted-foreground mt-4 pixel-font">FIN</div>

      <div className="flex flex-col gap-2 w-full mt-4">
        {onAbyss && kind === "SECRET" && (
          <button className="pixel-btn pixel-btn-blood text-[11px] py-2 jp-font" onClick={() => { sfx.boss(); onAbyss(); }}>灰深宮へ</button>
        )}
        <button className="pixel-btn pixel-btn-gold text-[11px] py-2 jp-font" onClick={() => { sfx.click(); onRestart(); }}>タイトルへ</button>
      </div>
    </div>
  );
}
