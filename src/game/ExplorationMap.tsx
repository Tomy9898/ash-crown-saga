import { useEffect, useMemo, useRef, useState } from "react";
import { PixelSprite, getLordSpriteId } from "./sprites";
import { sfx } from "./audio";

// ---------- Tile system ----------
// f = floor, w = wall, d = decoration (passable), x = blocking decoration
// e = encounter, b = boss, s = shard, t = treasure (item), o = exit (next stage)
type TileChar = "f" | "w" | "d" | "x" | "e" | "b" | "s" | "t" | "o";

interface StageTheme {
  floor: string; // base background color (CSS var or hsl)
  floorAlt: string; // subtle alt
  wall: string; // wall color top
  wallShadow: string;
  deco: string; // decoration color
  decoAccent: string;
  ambient: "ember" | "holy" | "blood" | "frost" | "void";
  decoIcon: string; // text glyph for decoration
  wallIcon?: string; // optional small motif on walls
  exitLabel: string;
}

const THEMES: Record<number, StageTheme> = {
  0: { floor: "hsl(40 6% 22%)", floorAlt: "hsl(40 6% 18%)", wall: "hsl(40 4% 32%)", wallShadow: "hsl(40 4% 14%)", deco: "hsl(0 0% 8%)", decoAccent: "hsl(18 90% 55%)", ambient: "ember", decoIcon: "♨", wallIcon: "▲", exitLabel: "砦へ" },
  1: { floor: "hsl(35 8% 35%)", floorAlt: "hsl(35 8% 30%)", wall: "hsl(35 10% 50%)", wallShadow: "hsl(35 10% 22%)", deco: "hsl(45 70% 45%)", decoAccent: "hsl(350 70% 45%)", ambient: "void", decoIcon: "▮", wallIcon: "▢", exitLabel: "村へ" },
  2: { floor: "hsl(25 15% 22%)", floorAlt: "hsl(25 15% 18%)", wall: "hsl(25 12% 30%)", wallShadow: "hsl(25 12% 12%)", deco: "hsl(350 70% 28%)", decoAccent: "hsl(40 30% 70%)", ambient: "blood", decoIcon: "✕", wallIcon: "◰", exitLabel: "墓地へ" },
  3: { floor: "hsl(260 15% 14%)", floorAlt: "hsl(260 15% 10%)", wall: "hsl(260 12% 24%)", wallShadow: "hsl(260 12% 6%)", deco: "hsl(260 10% 50%)", decoAccent: "hsl(280 60% 60%)", ambient: "void", decoIcon: "†", wallIcon: "◇", exitLabel: "都市へ" },
  4: { floor: "hsl(45 25% 78%)", floorAlt: "hsl(45 20% 70%)", wall: "hsl(45 30% 55%)", wallShadow: "hsl(45 25% 30%)", deco: "hsl(45 90% 60%)", decoAccent: "hsl(50 100% 90%)", ambient: "holy", decoIcon: "✦", wallIcon: "◈", exitLabel: "外郭へ" },
  5: { floor: "hsl(20 20% 35%)", floorAlt: "hsl(20 20% 30%)", wall: "hsl(20 18% 45%)", wallShadow: "hsl(20 18% 18%)", deco: "hsl(45 80% 55%)", decoAccent: "hsl(350 70% 45%)", ambient: "ember", decoIcon: "▮", wallIcon: "▣", exitLabel: "城へ" },
  6: { floor: "hsl(350 50% 22%)", floorAlt: "hsl(350 50% 18%)", wall: "hsl(45 30% 35%)", wallShadow: "hsl(45 25% 14%)", deco: "hsl(45 90% 55%)", decoAccent: "hsl(50 100% 85%)", ambient: "void", decoIcon: "❖", wallIcon: "▮", exitLabel: "聖堂へ" },
  7: { floor: "hsl(50 60% 80%)", floorAlt: "hsl(50 50% 72%)", wall: "hsl(45 50% 50%)", wallShadow: "hsl(45 30% 25%)", deco: "hsl(50 100% 92%)", decoAccent: "hsl(45 90% 60%)", ambient: "holy", decoIcon: "✚", wallIcon: "◈", exitLabel: "勇者の間へ" },
  8: { floor: "hsl(260 30% 12%)", floorAlt: "hsl(0 60% 12%)", wall: "hsl(280 40% 22%)", wallShadow: "hsl(280 40% 6%)", deco: "hsl(50 100% 80%)", decoAccent: "hsl(280 70% 60%)", ambient: "void", decoIcon: "✦", wallIcon: "★", exitLabel: "──" },
};

// 11 wide x 13 tall grid. Player spawns near bottom center.
const COLS = 11;
const ROWS = 13;

function buildMap(stageId: number, encounterCount: number, hasBoss: boolean, hasShard: boolean): TileChar[][] {
  // base: walls border, floor inside
  const m: TileChar[][] = Array.from({ length: ROWS }, (_, y) =>
    Array.from({ length: COLS }, (_, x) => {
      if (y === 0 || y === ROWS - 1 || x === 0 || x === COLS - 1) return "w";
      return "f";
    })
  );
  // interior walls per stage (procedural-ish, deterministic)
  const seed = stageId * 7 + 3;
  const rand = (n: number) => ((seed * (n + 1) * 9301 + 49297) % 233280) / 233280;
  // some pillars/walls
  const interior: [number, number][] = [
    [3, 3], [7, 3], [5, 5], [3, 8], [7, 8], [2, 6], [8, 6],
  ];
  interior.forEach(([x, y], i) => { if (rand(i) > 0.25) m[y][x] = "x"; });
  // scatter decorations
  for (let i = 0; i < 10; i++) {
    const x = 1 + Math.floor(rand(i + 20) * (COLS - 2));
    const y = 2 + Math.floor(rand(i + 30) * (ROWS - 4));
    if (m[y][x] === "f") m[y][x] = "d";
  }
  // place encounter nodes (vertical zigzag)
  const slots = [
    [2, 10], [8, 9], [4, 7], [7, 6], [3, 5], [6, 4],
  ];
  for (let i = 0; i < Math.min(encounterCount, slots.length); i++) {
    const [x, y] = slots[i];
    m[y][x] = "e";
  }
  // shard
  if (hasShard) {
    m[6][9] = "s";
    if (m[6][8] === "x") m[6][8] = "f";
  }
  // treasure (always one item pile)
  m[10][8] = "t";
  // boss / exit at top center
  if (hasBoss) {
    m[1][5] = "b";
  } else {
    m[1][5] = "o";
  }
  // ensure path tiles from spawn (bottom center) upward are clear
  for (let y = ROWS - 2; y >= 1; y--) m[y][5] = m[y][5] === "w" || m[y][5] === "x" ? "f" : m[y][5];
  return m;
}

interface Props {
  stageName: string;
  stageId: number;
  encounterCount: number;
  encounterIndex: number;
  hasBoss: boolean;
  hasShard: boolean;
  shardTaken: boolean;
  treasureTaken: boolean;
  onEncounter: () => void;
  onBoss: () => void;
  onShard: () => void;
  onTreasure: () => void;
  onExit: () => void;
  onMenu: (m: "equip" | "upgrade" | "title") => void;
}

type Dir = "up" | "down" | "left" | "right";
const DIRS: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] };

export function ExplorationMap(props: Props) {
  const { stageName, stageId, encounterCount, encounterIndex, hasBoss, hasShard, shardTaken, treasureTaken } = props;
  const theme = THEMES[stageId] || THEMES[0];

  const grid = useMemo(() => buildMap(stageId, encounterCount, hasBoss, hasShard), [stageId, encounterCount, hasBoss, hasShard]);

  const [pos, setPos] = useState<{ x: number; y: number }>({ x: 5, y: ROWS - 2 });
  const [facing, setFacing] = useState<Dir>("up");
  const [flash, setFlash] = useState<string | null>(null);
  const heldDirs = useRef<Set<Dir>>(new Set());
  const lastMoveAt = useRef(0);

  // Reset spawn when stage changes
  useEffect(() => { setPos({ x: 5, y: ROWS - 2 }); }, [stageId]);

  function passable(x: number, y: number) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return false;
    const t = grid[y][x];
    return t !== "w" && t !== "x";
  }

  function tryMove(dir: Dir) {
    setFacing(dir);
    const [dx, dy] = DIRS[dir];
    const nx = pos.x + dx, ny = pos.y + dy;
    if (!passable(nx, ny)) { sfx.click(); return; }
    setPos({ x: nx, y: ny });
    sfx.click();
    handleEnter(nx, ny);
  }

  function handleEnter(x: number, y: number) {
    const t = grid[y][x];
    if (t === "e") { sfx.boss(); props.onEncounter(); return; }
    if (t === "b") { sfx.boss(); props.onBoss(); return; }
    if (t === "s" && !shardTaken) { sfx.win(); setFlash("黒星片を手に入れた"); props.onShard(); return; }
    if (t === "t" && !treasureTaken) { sfx.heal(); setFlash("ポーションを拾った"); props.onTreasure(); return; }
    if (t === "o") { sfx.win(); props.onExit(); return; }
  }

  // continuous movement while a dpad button is held
  useEffect(() => {
    const id = setInterval(() => {
      if (heldDirs.current.size === 0) return;
      const now = performance.now();
      if (now - lastMoveAt.current < 160) return;
      lastMoveAt.current = now;
      const dir = Array.from(heldDirs.current)[heldDirs.current.size - 1] as Dir;
      tryMove(dir);
    }, 40);
    return () => clearInterval(id);
  });

  // flash auto-clear
  useEffect(() => { if (!flash) return; const t = setTimeout(() => setFlash(null), 1400); return () => clearTimeout(t); }, [flash]);

  function dpadPress(dir: Dir) {
    if (!heldDirs.current.has(dir)) {
      heldDirs.current.add(dir);
      // immediate single move on tap
      lastMoveAt.current = performance.now();
      tryMove(dir);
    }
  }
  function dpadRelease(dir: Dir) {
    heldDirs.current.delete(dir);
  }

  function inspect() {
    const t = grid[pos.y][pos.x];
    const messages: Record<string, string> = {
      f: "灰の積もる床。足跡は誰のものか分からない。",
      d: ({ 0: "黒炎が静かに燻る。", 1: "色褪せた王国旗。", 2: "井戸の底から血の匂い。", 3: "古い墓標。名は擦り切れている。", 4: "燭台の灯。賛美歌が聞こえる気がする。", 5: "崩れた銅像。元帥か、誰か。", 6: "玉座への赤い絨毯。血の色とよく似ている。", 7: "聖印の刻まれた石。掌が痺れる。", 8: "黒星鉱の脈動。──呼ばれている。" } as Record<number, string>)[stageId] || "古い遺物。",
    };
    setFlash(messages[t === "d" ? "d" : "f"]);
  }

  return (
    <div className="relative h-full w-full overflow-hidden flex flex-col" style={{ background: "hsl(var(--abyss))" }}>
      {/* upper map area ~60% */}
      <div className="relative w-full" style={{ height: "60%" }}>
        {/* HUD */}
        <div className="absolute top-1 left-1 right-1 z-20 flex justify-between items-center pixel-panel px-2 py-1">
          <div>
            <div className="text-[8px] text-muted-foreground pixel-font">STAGE {stageId + 1}</div>
            <div className="text-[11px] jp-font text-glow-gold" style={{ color: "hsl(var(--gold))" }}>{stageName}</div>
          </div>
          <div className="text-[9px] jp-font" style={{ color: "hsl(var(--bone))" }}>
            敵 {Math.min(encounterIndex, encounterCount)}/{encounterCount}
          </div>
        </div>

        {/* Tile grid */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ paddingTop: 36, paddingBottom: 6 }}>
          <div
            className="relative grid"
            style={{
              gridTemplateColumns: `repeat(${COLS}, 1fr)`,
              gridTemplateRows: `repeat(${ROWS}, 1fr)`,
              width: "min(100%, calc((100vh * 0.6 - 50px) * 11 / 13))",
              aspectRatio: `${COLS} / ${ROWS}`,
              imageRendering: "pixelated",
              boxShadow: "0 0 0 2px hsl(var(--gold) / 0.6), 0 0 18px hsl(0 0% 0% / 0.9)",
            }}
          >
            {grid.flatMap((row, y) =>
              row.map((t, x) => (
                <Tile key={`${x}-${y}`} t={t} x={x} y={y} theme={theme}
                  shardTaken={shardTaken} treasureTaken={treasureTaken} />
              ))
            )}
            {/* player overlay */}
            <div
              className="pointer-events-none"
              style={{
                position: "absolute",
                left: `${(pos.x + 0.5) * (100 / COLS)}%`,
                top: `${(pos.y + 0.5) * (100 / ROWS)}%`,
                transform: "translate(-50%, -55%)",
                transition: "left 120ms steps(3), top 120ms steps(3)",
                zIndex: 10,
              }}
            >
              <PixelSprite id={getLordSpriteId(stageId)} color="blood" scale={Math.max(2, Math.floor(window.innerHeight * 0.6 / ROWS / 8 * 0.85))} glow="hsl(var(--blood))" />
            </div>

            {/* scanlines over map */}
            <div className="absolute inset-0 pointer-events-none" style={{
              background: "repeating-linear-gradient(180deg, transparent 0 2px, hsl(0 0% 0% / 0.22) 2px 3px)",
              mixBlendMode: "multiply",
            }} />
          </div>
        </div>

        {/* ambient embers */}
        {Array.from({ length: 6 }).map((_, i) => (
          <span key={i} className="ember" style={{
            left: `${10 + i * 14}%`, top: "100%",
            animationDelay: `${i * 0.6}s`,
            background: theme.ambient === "holy" ? "hsl(50 100% 85%)" : theme.ambient === "blood" ? "hsl(350 80% 50%)" : theme.ambient === "frost" ? "hsl(195 80% 70%)" : theme.ambient === "void" ? "hsl(280 70% 60%)" : "hsl(18 90% 55%)",
            boxShadow: `0 0 6px ${theme.ambient === "holy" ? "hsl(50 100% 85%)" : "hsl(18 90% 55%)"}`,
          }} />
        ))}

        {/* flash text */}
        {flash && (
          <div className="absolute left-1/2 bottom-2 -translate-x-1/2 pixel-panel px-3 py-1 z-30 anim-pulse">
            <div className="text-[10px] jp-font text-glow-gold" style={{ color: "hsl(var(--gold))" }}>{flash}</div>
          </div>
        )}
      </div>

      {/* lower 40% controls */}
      <div className="relative w-full flex-1 pixel-panel border-t-2 grid grid-cols-2">
        {/* D-pad */}
        <div className="flex items-center justify-center">
          <DPad onPress={dpadPress} onRelease={dpadRelease} onInspect={inspect} />
        </div>
        {/* Right command panel (exploration) */}
        <div className="flex flex-col gap-2 p-3 justify-center">
          <div className="grid grid-cols-2 gap-2">
            <button className="pixel-btn pixel-btn-gold text-[10px] py-2" onClick={inspect}>調べる</button>
            <button className="pixel-btn text-[10px] py-2" onClick={() => props.onMenu("equip")}>装備</button>
            <button className="pixel-btn text-[10px] py-2" onClick={() => props.onMenu("upgrade")}>強化</button>
            <button className="pixel-btn pixel-btn-blood text-[10px] py-2" onClick={() => props.onMenu("title")}>メニュー</button>
          </div>
          <div className="text-[8px] jp-font leading-tight" style={{ color: "hsl(var(--muted-foreground))" }}>
            ・十字キーで移動／長押しで連続<br/>
            ・赤×=敵、紫=黒星片、黄=宝<br/>
            ・上の扉/ボスへ進め
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Tile component ----------
function Tile({ t, x, y, theme, shardTaken, treasureTaken }: { t: TileChar; x: number; y: number; theme: StageTheme; shardTaken: boolean; treasureTaken: boolean }) {
  const isAlt = (x + y) % 2 === 0;
  const base: React.CSSProperties = {
    position: "relative",
    background: isAlt ? theme.floor : theme.floorAlt,
    boxShadow: "inset 0 0 0 1px hsl(0 0% 0% / 0.25)",
    overflow: "hidden",
  };
  if (t === "w") {
    return (
      <div style={{ ...base, background: theme.wall, boxShadow: `inset 0 -3px 0 ${theme.wallShadow}, inset 2px 0 0 hsl(0 0% 100% / 0.06)` }}>
        {theme.wallIcon && <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: theme.wallShadow, opacity: 0.7 }}>{theme.wallIcon}</span>}
      </div>
    );
  }
  if (t === "x") {
    // pillar/blocking deco
    return (
      <div style={base}>
        <div style={{ position: "absolute", inset: "10% 20%", background: theme.wall, boxShadow: `inset 0 -3px 0 ${theme.wallShadow}, 0 2px 0 hsl(0 0% 0% / 0.5)` }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: theme.decoAccent }}>{theme.decoIcon}</span>
        </div>
      </div>
    );
  }
  if (t === "d") {
    return (
      <div style={base}>
        <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: theme.decoAccent, textShadow: "0 1px 0 #000" }}>{theme.decoIcon}</span>
      </div>
    );
  }
  if (t === "e") {
    return (
      <div style={base}>
        <div className="anim-pulse" style={{ position: "absolute", inset: "15%", background: "hsl(var(--blood))", border: "2px solid hsl(var(--gold))", boxShadow: "0 0 8px hsl(var(--blood))" }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, color: "hsl(var(--holy))" }}>×</span>
        </div>
      </div>
    );
  }
  if (t === "b") {
    return (
      <div style={base}>
        <div className="anim-pulse" style={{ position: "absolute", inset: "5%", background: "hsl(var(--blood))", border: "2px solid hsl(var(--gold))", boxShadow: "0 0 14px hsl(var(--blood))" }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "hsl(var(--holy))", fontFamily: "'Press Start 2P'" }}>B</span>
        </div>
      </div>
    );
  }
  if (t === "s" && !shardTaken) {
    return (
      <div style={base}>
        <div className="anim-pulse" style={{ position: "absolute", inset: "20%", transform: "rotate(45deg)", background: "hsl(280 70% 45%)", border: "2px solid hsl(280 80% 80%)", boxShadow: "0 0 10px hsl(280 70% 60%)" }} />
      </div>
    );
  }
  if (t === "t" && !treasureTaken) {
    return (
      <div style={base}>
        <div style={{ position: "absolute", inset: "20%", background: "hsl(45 70% 45%)", border: "2px solid hsl(45 90% 75%)", boxShadow: "inset 0 -3px 0 hsl(35 70% 25%)" }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "hsl(0 0% 5%)", fontWeight: 700 }}>$</span>
        </div>
      </div>
    );
  }
  if (t === "o") {
    return (
      <div style={base}>
        <div className="anim-pulse" style={{ position: "absolute", inset: "5%", background: "hsl(45 90% 55%)", border: "2px solid hsl(50 100% 85%)", boxShadow: "0 0 12px hsl(45 90% 55%)" }}>
          <span style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, color: "hsl(0 0% 5%)", fontWeight: 700 }}>↑</span>
        </div>
      </div>
    );
  }
  return <div style={base} />;
}

// ---------- D-Pad ----------
function DPad({ onPress, onRelease, onInspect }: { onPress: (d: Dir) => void; onRelease: (d: Dir) => void; onInspect: () => void }) {
  function bind(d: Dir) {
    return {
      onPointerDown: (e: React.PointerEvent) => {
        e.preventDefault();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        onPress(d);
      },
      onPointerUp: (e: React.PointerEvent) => { e.preventDefault(); onRelease(d); },
      onPointerCancel: () => onRelease(d),
      onPointerLeave: () => onRelease(d),
    };
  }
  const btnBase: React.CSSProperties = {
    width: 48, height: 48,
    background: "linear-gradient(180deg, hsl(var(--secondary)), hsl(var(--abyss)))",
    border: "2px solid hsl(var(--gold) / 0.7)",
    color: "hsl(var(--gold))",
    boxShadow: "0 3px 0 hsl(0 0% 0%), inset 0 0 0 1px hsl(0 0% 0% / 0.6)",
    fontFamily: "'Press Start 2P', monospace",
    fontSize: 14,
    touchAction: "none",
    userSelect: "none",
    display: "flex", alignItems: "center", justifyContent: "center",
  };
  return (
    <div style={{ display: "grid", gridTemplateColumns: "48px 48px 48px", gridTemplateRows: "48px 48px 48px", gap: 4 }}>
      <div />
      <button {...bind("up")} style={btnBase} aria-label="上">▲</button>
      <div />
      <button {...bind("left")} style={btnBase} aria-label="左">◀</button>
      <button onClick={onInspect} style={{ ...btnBase, color: "hsl(var(--blood))", borderColor: "hsl(var(--blood))", fontSize: 10 }} aria-label="決定">●</button>
      <button {...bind("right")} style={btnBase} aria-label="右">▶</button>
      <div />
      <button {...bind("down")} style={btnBase} aria-label="下">▼</button>
      <div />
    </div>
  );
}
