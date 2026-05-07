import { CSSProperties } from "react";

// 8x8 pixel sprites: each row = 8 chars. '.'=transparent, '#'=main, 'o'=secondary, '*'=accent
const SPRITES: Record<string, string[]> = {
  lord: [
    "..####..",
    ".#oooo#.",
    ".#*oo*#.",
    ".#oooo#.",
    "##oooo##",
    "#oo##oo#",
    ".#####..",
    "..#..#..",
  ],
  lordAwakened: [
    "#.####.#",
    ".#oooo#.",
    ".#*oo*#.",
    ".#o**o#.",
    "##o**o##",
    "#oo##oo#",
    ".######.",
    "..#..#..",
  ],
  lordWinged: [
    "#.####.#",
    "##oooo##",
    "##*oo*##",
    "##o**o##",
    "##o**o##",
    "##o##o##",
    "########",
    "..#..#..",
  ],
  lordDemon: [
    "#*####*#",
    "##****##",
    "##*oo*##",
    "##oooo##",
    "##*##*##",
    "########",
    "##*##*##",
    "#.#..#.#",
  ],
  wraith: [
    "..####..",
    ".#oooo#.",
    "#o*oo*o#",
    "#oooooo#",
    ".#oooo#.",
    "..#oo#..",
    ".#.##.#.",
    "#......#",
  ],
  hound: [
    "........",
    "#......#",
    "##....##",
    "#oo##oo#",
    "#o*oo*o#",
    "#oo##oo#",
    ".######.",
    "..#..#..",
  ],
  soldier: [
    "..####..",
    ".#oooo#.",
    ".#o**o#.",
    ".#oooo#.",
    "#######.",
    "#.####o#",
    "..#..#..",
    "..#..#..",
  ],
  archer: [
    "..####..",
    ".#oooo#.",
    ".#o**o#.",
    "##oooo##",
    "#######o",
    ".####o.o",
    "..#..#.o",
    "..#..#..",
  ],
  knight: [
    ".######.",
    "#oooooo#",
    "#o****o#",
    "#oooooo#",
    "########",
    "#oo##oo#",
    "#oo##oo#",
    ".#....#.",
  ],
  spear: [
    "..####.#",
    ".#oooo#.",
    ".#o**o##",
    ".#oooo#.",
    "######o#",
    "#.##.##.",
    "..#..#..",
    "..#..#..",
  ],
  priest: [
    "..####..",
    ".#oooo#.",
    ".#o**o#.",
    "########",
    "##*oo*##",
    "##oooo##",
    "#.####.#",
    "..#..#..",
  ],
  mage: [
    "...##...",
    "..####..",
    ".#oooo#.",
    ".#o**o#.",
    "########",
    ".#oooo#.",
    ".######.",
    "..#..#..",
  ],
  saint: [
    "...##...",
    "..####..",
    ".#oooo#.",
    "#o*oo*o#",
    "#oooooo#",
    "########",
    "##oooo##",
    ".#....#.",
  ],
  hero: [
    "..####..",
    ".#oooo#.",
    ".#****#.",
    ".#oooo#.",
    "###oo###",
    "#o#oo#o#",
    "#.######",
    ".#.##.#.",
  ],
  dragon: [
    "##....##",
    "###..###",
    "##oooo##",
    "##*oo*##",
    "########",
    "##oooo##",
    "##o##o##",
    "#.#..#.#",
  ],
};

const COLOR_MAP: Record<string, { main: string; sub: string; acc: string }> = {
  ash:    { main: "hsl(40 8% 55%)",  sub: "hsl(40 8% 35%)",  acc: "hsl(0 0% 90%)" },
  blood:  { main: "hsl(350 80% 35%)", sub: "hsl(350 60% 20%)", acc: "hsl(45 85% 65%)" },
  void:   { main: "hsl(270 40% 25%)", sub: "hsl(260 30% 12%)", acc: "hsl(280 60% 60%)" },
  gold:   { main: "hsl(45 85% 55%)",  sub: "hsl(35 70% 30%)",  acc: "hsl(50 90% 88%)" },
  holy:   { main: "hsl(50 90% 88%)",  sub: "hsl(45 60% 50%)",  acc: "hsl(50 100% 98%)" },
  bone:   { main: "hsl(40 30% 80%)",  sub: "hsl(40 20% 50%)",  acc: "hsl(0 60% 40%)" },
  ember:  { main: "hsl(18 90% 50%)",  sub: "hsl(0 70% 30%)",   acc: "hsl(50 90% 70%)" },
  frost:  { main: "hsl(195 80% 60%)", sub: "hsl(220 60% 30%)", acc: "hsl(180 90% 80%)" },
};

export function PixelSprite({ id, color = "void", scale = 6, glow, className }: { id: string; color?: string; scale?: number; glow?: string; className?: string }) {
  const s = SPRITES[id] || SPRITES.wraith;
  const c = COLOR_MAP[color] || COLOR_MAP.void;
  const px = scale;
  const w = 8 * px;
  return (
    <div className={className} style={{ width: w, height: w, position: "relative", filter: glow ? `drop-shadow(0 0 6px ${glow})` : undefined }}>
      {s.map((row, y) =>
        [...row].map((ch, x) => {
          if (ch === ".") return null;
          const bg = ch === "#" ? c.main : ch === "o" ? c.sub : c.acc;
          const style: CSSProperties = {
            position: "absolute",
            left: x * px, top: y * px,
            width: px, height: px,
            background: bg,
            boxShadow: `inset 0 -1px 0 hsl(0 0% 0% / 0.3)`,
          };
          return <i key={`${x}-${y}`} style={style} />;
        })
      )}
    </div>
  );
}

export function getLordSpriteId(stage: number) {
  if (stage >= 8) return "lordDemon";
  if (stage >= 6) return "lordWinged";
  if (stage >= 3) return "lordAwakened";
  return "lord";
}
