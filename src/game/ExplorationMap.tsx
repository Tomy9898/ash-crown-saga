import { useEffect, useRef, useState } from "react";
import { PixelSprite, getLordSpriteId } from "./sprites";
import { sfx } from "./audio";

interface Props {
  stageName: string;
  stageId: number;
  encounterCount: number;
  encounterIndex: number;
  hasBoss: boolean;
  hasShard: boolean;
  shardTaken: boolean;
  onEncounter: () => void;
  onBoss: () => void;
  onShard: () => void;
  onMenu: (m: "equip" | "title") => void;
}

interface Touch { x: number; y: number; id: number; }

export function ExplorationMap({ stageName, stageId, encounterCount, encounterIndex, hasBoss, hasShard, shardTaken, onEncounter, onBoss, onShard, onMenu }: Props) {
  const [pos, setPos] = useState({ x: 50, y: 80 });
  const [stick, setStick] = useState<{ active: boolean; dx: number; dy: number }>({ active: false, dx: 0, dy: 0 });
  const stickRef = useRef<HTMLDivElement>(null);
  const stickId = useRef<number | null>(null);
  const mapRef = useRef<HTMLDivElement>(null);

  // Encounter nodes positions
  const nodes = Array.from({ length: encounterCount }, (_, i) => ({
    x: 25 + (i % 2) * 50,
    y: 60 - i * 14,
    done: i < encounterIndex,
    isCurrent: i === encounterIndex,
  }));
  const allEncDone = encounterIndex >= encounterCount;
  const bossPos = { x: 50, y: 8 };
  const shardPos = { x: 80, y: 30 };

  // movement loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (!stick.active) return;
      setPos(p => {
        const nx = Math.max(5, Math.min(95, p.x + stick.dx * 1.5));
        const ny = Math.max(5, Math.min(95, p.y + stick.dy * 1.5));
        return { x: nx, y: ny };
      });
    }, 33);
    return () => clearInterval(interval);
  }, [stick]);

  // collision check
  useEffect(() => {
    const next = nodes.find(n => n.isCurrent);
    if (next && dist(pos, next) < 7) { sfx.click(); onEncounter(); }
    if (allEncDone && hasBoss && dist(pos, bossPos) < 8) { sfx.boss(); onBoss(); }
    if (hasShard && !shardTaken && dist(pos, shardPos) < 6) { sfx.win(); onShard(); }
  }, [pos]);

  function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function onStickStart(e: React.PointerEvent) {
    e.preventDefault();
    stickId.current = e.pointerId;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    updateStick(e);
  }
  function updateStick(e: React.PointerEvent) {
    if (stickId.current !== e.pointerId || !stickRef.current) return;
    const r = stickRef.current.getBoundingClientRect();
    const cx = r.left + r.width / 2; const cy = r.top + r.height / 2;
    let dx = (e.clientX - cx) / (r.width / 2);
    let dy = (e.clientY - cy) / (r.height / 2);
    const m = Math.hypot(dx, dy);
    if (m > 1) { dx /= m; dy /= m; }
    setStick({ active: true, dx, dy });
  }
  function onStickEnd(e: React.PointerEvent) {
    if (stickId.current === e.pointerId) {
      stickId.current = null;
      setStick({ active: false, dx: 0, dy: 0 });
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-abyss via-void to-stone-950 scanlines vignette">
      {/* upper 60% map */}
      <div ref={mapRef} className="relative h-[60%] w-full">
        {/* atmospheric embers */}
        {Array.from({ length: 8 }).map((_, i) => (
          <span key={i} className="ember" style={{ left: `${10 + i * 11}%`, top: "100%", animationDelay: `${i * 0.5}s` }} />
        ))}

        {/* HUD top bar */}
        <div className="absolute top-1 left-1 right-1 flex justify-between items-center pixel-panel px-2 py-1">
          <div>
            <div className="text-[8px] text-muted-foreground pixel-font">STAGE {stageId + 1}</div>
            <div className="text-[11px] text-gold jp-font text-glow-gold">{stageName}</div>
          </div>
          <button className="pixel-btn text-[9px] px-2 py-1" onClick={() => onMenu("equip")}>装備</button>
        </div>

        {/* path */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 100">
          <path d={`M ${pos.x} ${pos.y} ` + nodes.map(n => `L ${n.x} ${n.y}`).join(" ") + (hasBoss && allEncDone ? ` L ${bossPos.x} ${bossPos.y}` : "")}
            stroke="hsl(var(--gold) / 0.3)" strokeDasharray="2,2" strokeWidth="0.5" fill="none" />
        </svg>

        {/* nodes */}
        {nodes.map((n, i) => (
          <div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${n.x}%`, top: `${n.y}%` }}>
            <div className={`w-4 h-4 ${n.done ? "bg-muted" : n.isCurrent ? "bg-blood anim-pulse" : "bg-secondary"} border-2 border-gold`} />
            {n.isCurrent && <div className="text-[8px] text-blood mt-0.5 text-center pixel-font">!</div>}
          </div>
        ))}

        {/* shard */}
        {hasShard && !shardTaken && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 anim-pulse" style={{ left: `${shardPos.x}%`, top: `${shardPos.y}%` }}>
            <div className="w-4 h-4 bg-purple-600 rotate-45 border-2 border-purple-300" />
            <div className="text-[7px] text-purple-300 text-center mt-1">黒星片</div>
          </div>
        )}

        {/* boss */}
        {hasBoss && allEncDone && (
          <div className="absolute -translate-x-1/2 -translate-y-1/2 anim-pulse" style={{ left: `${bossPos.x}%`, top: `${bossPos.y}%` }}>
            <div className="w-6 h-6 bg-blood border-2 border-gold" />
            <div className="text-[8px] text-blood text-glow-blood pixel-font text-center">BOSS</div>
          </div>
        )}

        {/* player */}
        <div className="absolute -translate-x-1/2 -translate-y-1/2 transition-none" style={{ left: `${pos.x}%`, top: `${pos.y}%` }}>
          <PixelSprite id={getLordSpriteId(stageId)} color="blood" scale={4} glow="hsl(var(--blood))" />
        </div>
      </div>

      {/* lower 40% controls */}
      <div className="relative h-[40%] w-full pixel-panel border-t-2 flex items-stretch">
        {/* virtual stick */}
        <div className="flex-1 flex items-center justify-center">
          <div ref={stickRef}
            onPointerDown={onStickStart}
            onPointerMove={(e) => stick.active && updateStick(e)}
            onPointerUp={onStickEnd}
            onPointerCancel={onStickEnd}
            className="relative w-32 h-32 rounded-full border-4 border-gold/60 bg-abyss/80 touch-none">
            <div className="absolute left-1/2 top-1/2 w-12 h-12 rounded-full bg-blood border-2 border-gold pointer-events-none transition-transform"
              style={{ transform: `translate(-50%,-50%) translate(${stick.dx * 30}px, ${stick.dy * 30}px)` }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-[8px] text-gold pixel-font opacity-60">MOVE</div>
          </div>
        </div>

        {/* Right side info */}
        <div className="flex-1 flex flex-col justify-center gap-2 p-3">
          <div className="text-[10px] text-gold pixel-font">PROGRESS</div>
          <div className="text-[10px] text-bone jp-font">
            戦闘 {Math.min(encounterIndex, encounterCount)}/{encounterCount}
          </div>
          {hasBoss && <div className="text-[10px] text-blood jp-font">{allEncDone ? "ボスへ進め" : "残敵を倒せ"}</div>}
          <div className="text-[9px] text-muted-foreground jp-font leading-tight">
            ・スティックで魔王を移動<br/>
            ・赤い印に触れて戦闘<br/>
            ・紫の片＝黒星片
          </div>
        </div>
      </div>
    </div>
  );
}
