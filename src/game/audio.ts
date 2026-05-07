let ctx: AudioContext | null = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
  return ctx;
}
export function beep(freq = 440, dur = 0.08, type: OscillatorType = "square", vol = 0.08) {
  try {
    const a = ac();
    const o = a.createOscillator();
    const g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(a.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, a.currentTime + dur);
    o.stop(a.currentTime + dur);
  } catch {}
}
export const sfx = {
  click: () => beep(660, 0.04, "square", 0.05),
  hit: () => { beep(180, 0.06, "square", 0.1); setTimeout(() => beep(120, 0.08, "sawtooth", 0.08), 30); },
  cast: () => { beep(220, 0.06, "triangle", 0.07); setTimeout(() => beep(440, 0.1, "triangle", 0.07), 50); },
  heal: () => { beep(660, 0.06, "sine", 0.06); setTimeout(() => beep(880, 0.1, "sine", 0.06), 60); },
  win: () => { [523, 659, 784, 1046].forEach((f, i) => setTimeout(() => beep(f, 0.12, "square", 0.08), i * 90)); },
  lose: () => { [330, 247, 196, 147].forEach((f, i) => setTimeout(() => beep(f, 0.18, "sawtooth", 0.08), i * 120)); },
  boss: () => { beep(80, 0.4, "sawtooth", 0.12); setTimeout(() => beep(60, 0.6, "sawtooth", 0.1), 200); },
  break: () => { [880, 1320, 1760].forEach((f, i) => setTimeout(() => beep(f, 0.06, "square", 0.09), i * 40)); },
};
