import { sfx } from "./audio";
import { PixelSprite } from "./sprites";

interface Props {
  hasSave: boolean;
  onStart: () => void;
  onContinue: () => void;
}

export function TitleScreen({ hasSave, onStart, onContinue }: Props) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-black via-abyss to-blood scanlines vignette flex flex-col">
      {/* embers */}
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className="ember" style={{ left: `${(i * 7) % 100}%`, top: "100%", animationDelay: `${(i * 0.3) % 4}s` }} />
      ))}

      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
        <div className="text-[10px] text-gold pixel-font tracking-widest opacity-80">THE ASH-CROWNED LORD</div>
        <h1 className="text-4xl jp-font text-blood text-glow-blood leading-tight">灰冠の<br/>魔王</h1>

        <div className="my-4 anim-pulse">
          <PixelSprite id="lordDemon" color="blood" scale={10} glow="hsl(var(--blood))" />
        </div>

        <p className="text-[11px] jp-font text-bone leading-relaxed max-w-xs">
          魔界は焼かれ、民は灰となった。<br/>
          滅ぼされた王、ヴァルゼインは目覚める。<br/>
          灰の冠を戴き、聖王国へ──逆侵攻を始めよ。
        </p>
      </div>

      <div className="px-6 pb-8 flex flex-col gap-2">
        {hasSave && (
          <button className="pixel-btn pixel-btn-gold text-sm py-3 jp-font" onClick={() => { sfx.click(); onContinue(); }}>続きから</button>
        )}
        <button className="pixel-btn pixel-btn-blood text-sm py-3 jp-font" onClick={() => { sfx.boss(); onStart(); }}>新たなる侵攻</button>
        <div className="text-[8px] text-muted-foreground text-center mt-2 pixel-font">© ELEDIA - 8BIT RPG</div>
      </div>
    </div>
  );
}
