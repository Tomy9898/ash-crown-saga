import { useEffect, useState } from "react";
import { sfx } from "./audio";

interface Props {
  text: string;
  title?: string;
  subtitle?: string;
  choices?: { label: string; value: string }[];
  onContinue: (choice?: string) => void;
}

export function StoryScreen({ text, title, subtitle, choices, onContinue }: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    setShown(""); setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i % 4 === 0) sfx.click();
      if (i >= text.length) { clearInterval(interval); setDone(true); }
    }, 35);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-b from-black via-abyss to-stone-950 scanlines vignette flex flex-col p-4"
      onClick={() => { if (!done) { setShown(text); setDone(true); } }}>
      {title && (
        <div className="text-center mb-6 mt-4">
          <div className="text-[10px] text-gold pixel-font tracking-widest">CHAPTER</div>
          <h2 className="text-2xl jp-font text-blood text-glow-blood mt-1">{title}</h2>
          {subtitle && <div className="text-[11px] jp-font text-bone opacity-80 mt-1">{subtitle}</div>}
        </div>
      )}
      <div className="flex-1 pixel-panel p-4 overflow-y-auto">
        <p className="jp-font text-bone text-[13px] leading-relaxed whitespace-pre-line">{shown}<span className="anim-pulse text-blood">▌</span></p>
      </div>

      {done && (
        <div className="mt-3 flex flex-col gap-2">
          {choices ? choices.map(c => (
            <button key={c.value} className="pixel-btn pixel-btn-gold text-[11px] py-2 jp-font" onClick={() => { sfx.click(); onContinue(c.value); }}>{c.label}</button>
          )) : (
            <button className="pixel-btn pixel-btn-blood text-[11px] py-2 jp-font" onClick={() => { sfx.click(); onContinue(); }}>▼ 続ける</button>
          )}
        </div>
      )}
      {!done && <div className="text-center text-[9px] text-muted-foreground mt-2 pixel-font">TAP TO SKIP</div>}
    </div>
  );
}
