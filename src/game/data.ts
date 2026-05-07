import { Enemy, Equipment, Skill, Stage } from "./types";

export const SKILLS: Record<string, Skill> = {
  attack: { id: "attack", name: "通常攻撃", desc: "闇の爪で斬る。", mp: 0, power: 1.0, element: "phys", target: "one" },
  darkBolt: { id: "darkBolt", name: "ダークボルト", desc: "闇属性・単体。MP消費小。", mp: 6, power: 1.6, element: "dark", target: "one" },
  abyssWave: { id: "abyssWave", name: "深淵波動", desc: "闇属性・全体攻撃。", mp: 14, power: 1.2, element: "dark", target: "all" },
  lifeRot: { id: "lifeRot", name: "生命腐敗", desc: "呪い付与＋継続ダメージ。", mp: 8, power: 0.8, element: "dark", target: "one", effect: { status: "curse", statusChance: 0.85 } },
  blackSeal: { id: "blackSeal", name: "黒死刻印", desc: "高威力。弱点で追加ターン。", mp: 18, power: 2.4, element: "dark", target: "one", effect: { breakBonus: true } },
  wolfCall: { id: "wolfCall", name: "魔狼召喚", desc: "次2ターン追加攻撃。", mp: 10, power: 0, element: "dark", target: "self", effect: { summon: "wolf" } },
  knightCall: { id: "knightCall", name: "黒騎士召喚", desc: "防御＋反撃支援。", mp: 12, power: 0, element: "dark", target: "self", effect: { summon: "knight" } },
  soulDrain: { id: "soulDrain", name: "ソウルドレイン", desc: "ダメージの50%をHP吸収。", mp: 9, power: 1.4, element: "dark", target: "one", effect: { drain: 0.5 } },
  bloodAbsorb: { id: "bloodAbsorb", name: "血界吸収", desc: "血属性。低HPほど高威力。", mp: 12, power: 1.6, element: "blood", target: "one", effect: { drain: 0.3, hpScale: true } },
};

export const ENEMIES: Record<string, Enemy> = {
  // 1. 魔界辺境
  ashWraith: { id: "ashWraith", name: "灰の亡霊", sprite: "wraith", color: "ash", stats: { hp: 22, maxHp: 22, mp: 0, maxMp: 0, atk: 6, def: 1, mag: 4, spd: 5 }, weak: ["light"], resist: ["dark"], ai: "basic", xp: 4 },
  cinderHound: { id: "cinderHound", name: "燼の獣", sprite: "hound", color: "ember", stats: { hp: 28, maxHp: 28, mp: 0, maxMp: 0, atk: 8, def: 2, mag: 0, spd: 8 }, weak: ["ice"], resist: ["fire"], ai: "berserk", xp: 5 },

  // 2. 国境砦
  swordsman: { id: "swordsman", name: "王国剣兵", sprite: "soldier", color: "bone", stats: { hp: 36, maxHp: 36, mp: 0, maxMp: 0, atk: 10, def: 4, mag: 0, spd: 6 }, weak: ["dark"], resist: [], ai: "basic", xp: 7 },
  spearman: { id: "spearman", name: "王国槍兵", sprite: "soldier", color: "bone", stats: { hp: 32, maxHp: 32, mp: 0, maxMp: 0, atk: 11, def: 3, mag: 0, spd: 7 }, weak: ["dark"], resist: [], ai: "basic", xp: 7 },
  archer: { id: "archer", name: "王国弓兵", sprite: "archer", color: "bone", stats: { hp: 26, maxHp: 26, mp: 0, maxMp: 0, atk: 12, def: 2, mag: 0, spd: 9 }, weak: ["dark"], resist: [], ai: "basic", xp: 8 },
  garm: { id: "garm", name: "灰鎧のガルム", sprite: "knight", color: "ash", stats: { hp: 140, maxHp: 140, mp: 0, maxMp: 0, atk: 14, def: 12, mag: 0, spd: 4 }, weak: ["dark", "thunder"], resist: ["phys"], ai: "boss", skills: [{ name: "鉄壁の構え", power: 0, element: "phys", chance: 0.3 }, { name: "盾撃", power: 1.4, element: "phys", chance: 0.7 }], xp: 30, loot: "ashPlate" },

  // 3. 廃村
  heavyKnight: { id: "heavyKnight", name: "王国重装兵", sprite: "knight", color: "ash", stats: { hp: 60, maxHp: 60, mp: 0, maxMp: 0, atk: 13, def: 10, mag: 0, spd: 3 }, weak: ["dark"], resist: ["phys"], ai: "basic", xp: 12 },
  fanatic: { id: "fanatic", name: "狂信兵", sprite: "soldier", color: "blood", stats: { hp: 28, maxHp: 28, mp: 0, maxMp: 0, atk: 18, def: 1, mag: 0, spd: 7 }, weak: ["dark"], resist: [], ai: "berserk", xp: 9 },

  // 4. 地下墓地
  executioner: { id: "executioner", name: "処刑騎士", sprite: "knight", color: "void", stats: { hp: 70, maxHp: 70, mp: 0, maxMp: 0, atk: 14, def: 6, mag: 0, spd: 6 }, weak: ["light"], resist: ["dark"], ai: "basic", skills: [{ name: "毒刃", power: 1.0, element: "phys", chance: 0.5, status: "bleed" }], xp: 14 },
  elysia: { id: "elysia", name: "白槍のエリシア", sprite: "spear", color: "holy", stats: { hp: 180, maxHp: 180, mp: 0, maxMp: 0, atk: 18, def: 7, mag: 0, spd: 14 }, weak: ["dark"], resist: ["light"], ai: "boss", skills: [{ name: "三連突き", power: 0.7, element: "phys", chance: 0.6 }, { name: "閃光突", power: 1.6, element: "light", chance: 0.4 }], xp: 50, loot: "voidCloak" },

  // 5. 教会都市
  priest: { id: "priest", name: "神官", sprite: "priest", color: "holy", stats: { hp: 40, maxHp: 40, mp: 30, maxMp: 30, atk: 6, def: 4, mag: 12, spd: 6 }, weak: ["dark"], resist: ["light"], ai: "heal", skills: [{ name: "癒しの光", power: 1.4, element: "light", chance: 0.5 }, { name: "光弾", power: 1.2, element: "light", chance: 0.5 }], xp: 14 },
  paladin: { id: "paladin", name: "聖騎士", sprite: "knight", color: "gold", stats: { hp: 90, maxHp: 90, mp: 0, maxMp: 0, atk: 14, def: 9, mag: 0, spd: 7 }, weak: ["dark"], resist: ["light"], ai: "basic", xp: 18 },
  bald: { id: "bald", name: "火刑卿バルド", sprite: "mage", color: "ember", stats: { hp: 200, maxHp: 200, mp: 50, maxMp: 50, atk: 12, def: 6, mag: 22, spd: 8 }, weak: ["ice"], resist: ["fire"], ai: "boss", skills: [{ name: "火葬の業", power: 1.3, element: "fire", chance: 0.6, status: "bleed" }, { name: "煉獄", power: 1.0, element: "fire", chance: 0.4 }], xp: 70, loot: "emberRing" },

  // 6. 王都外郭
  marshal: { id: "marshal", name: "王国元帥", sprite: "knight", color: "gold", stats: { hp: 260, maxHp: 260, mp: 0, maxMp: 0, atk: 20, def: 12, mag: 0, spd: 8 }, weak: ["dark", "thunder"], resist: ["phys"], ai: "boss", skills: [{ name: "斉射命令", power: 1.0, element: "phys", chance: 0.5 }, { name: "戦線突破", power: 1.8, element: "phys", chance: 0.5 }], xp: 90, loot: "marshalCrown" },
  mageSoldier: { id: "mageSoldier", name: "魔導兵", sprite: "mage", color: "frost", stats: { hp: 50, maxHp: 50, mp: 25, maxMp: 25, atk: 6, def: 3, mag: 16, spd: 7 }, weak: ["dark"], resist: [], ai: "basic", skills: [{ name: "氷槍", power: 1.4, element: "ice", chance: 0.7 }], xp: 16 },

  // 7. 王城
  remPriest: { id: "remPriest", name: "沈黙司祭レム", sprite: "priest", color: "void", stats: { hp: 220, maxHp: 220, mp: 60, maxMp: 60, atk: 8, def: 6, mag: 20, spd: 10 }, weak: ["dark"], resist: ["light"], ai: "boss", skills: [{ name: "封印の詠唱", power: 0.8, element: "light", chance: 0.5, status: "silence" }, { name: "光鎖", power: 1.5, element: "light", chance: 0.5 }], xp: 80, loot: "silentSeal" },
  saint: { id: "saint", name: "聖女セラフィナ", sprite: "saint", color: "holy", stats: { hp: 280, maxHp: 280, mp: 80, maxMp: 80, atk: 10, def: 8, mag: 24, spd: 11 }, weak: ["dark", "blood"], resist: ["light"], ai: "boss", skills: [{ name: "聖光癒し", power: 2.0, element: "light", chance: 0.4 }, { name: "洗脳の歌", power: 1.4, element: "light", chance: 0.6, status: "fear" }], xp: 110, loot: "saintTear" },
  royalGuard: { id: "royalGuard", name: "勇者親衛隊", sprite: "knight", color: "gold", stats: { hp: 110, maxHp: 110, mp: 0, maxMp: 0, atk: 22, def: 10, mag: 0, spd: 13 }, weak: ["dark"], resist: ["light"], ai: "basic", xp: 24 },

  // 8. 勇者
  ardion: { id: "ardion", name: "勇者アルディオン", sprite: "hero", color: "holy", stats: { hp: 480, maxHp: 480, mp: 100, maxMp: 100, atk: 26, def: 14, mag: 24, spd: 15 }, weak: ["dark", "blood"], resist: ["light", "phys"], ai: "boss", skills: [{ name: "聖剣斬", power: 1.6, element: "phys", chance: 0.5 }, { name: "光の波動", power: 1.5, element: "light", chance: 0.3 }, { name: "光暴走", power: 2.2, element: "light", chance: 0.2 }], xp: 250, loot: "heroFragment" },

  // 裏ボス
  blackDragon: { id: "blackDragon", name: "黒星竜", sprite: "dragon", color: "void", stats: { hp: 700, maxHp: 700, mp: 100, maxMp: 100, atk: 30, def: 18, mag: 28, spd: 12 }, weak: [], resist: ["dark", "phys"], ai: "boss", skills: [{ name: "黒星息", power: 1.8, element: "dark", chance: 0.5 }, { name: "崩壊の咆哮", power: 1.4, element: "phys", chance: 0.5, status: "fear" }], xp: 500 },
};

export const STAGES: Stage[] = [
  { id: 0, name: "魔界辺境", subtitle: "灰に埋もれた玉座より", bg: "from-abyss via-void to-black",
    encounters: [["ashWraith"], ["ashWraith", "cinderHound"]],
    story: "魔界は焼かれた。\n灰となった民の囁きが、玉座の魔王ヴァルゼインを呼び覚ます。\n\n──逆侵攻を、始めよう。" },
  { id: 1, name: "国境砦", subtitle: "聖王国の鉄門", bg: "from-abyss via-secondary to-stone-900",
    encounters: [["swordsman", "spearman"], ["archer", "swordsman"], ["spearman", "spearman", "archer"]],
    boss: ["garm"], shard: true,
    story: "国境砦は王国軍で満ちている。\n灰鎧のガルム──聖王国四聖騎士の一柱が、鉄門の前に立つ。" },
  { id: 2, name: "廃村セルナ", subtitle: "魔族と人の屍が並ぶ村", bg: "from-stone-950 via-abyss to-blood",
    encounters: [["fanatic", "fanatic"], ["heavyKnight", "fanatic"], ["heavyKnight", "swordsman", "archer"]],
    story: "焼かれた家屋に、魔族と人の骸が同じ場所に並ぶ。\n誰もこの村の名を覚えていない。" },
  { id: 3, name: "地下墓地", subtitle: "呪詛の眠る回廊", bg: "from-black via-void to-abyss",
    encounters: [["executioner"], ["executioner", "fanatic"], ["executioner", "executioner"]],
    boss: ["elysia"], shard: true,
    story: "地下墓地に響く槍の音。\n白槍のエリシアは死者の祈りを切り裂きながら現れた。" },
  { id: 4, name: "教会都市ルクリス", subtitle: "聖光と狂信の街", bg: "from-amber-950 via-abyss to-stone-900",
    encounters: [["priest", "paladin"], ["paladin", "paladin", "priest"], ["paladin", "priest", "fanatic"]],
    boss: ["bald"], shard: true,
    story: "鐘が鳴る。賛美歌が血を求めている。\n火刑卿バルドが薪に火を放つ。" },
  { id: 5, name: "王都外郭", subtitle: "軍勢ひしめく外壁", bg: "from-stone-900 via-secondary to-abyss",
    encounters: [["mageSoldier", "swordsman"], ["mageSoldier", "paladin", "archer"], ["paladin", "paladin", "mageSoldier"]],
    boss: ["marshal"],
    story: "王国元帥は号令ひとつで千の刃を呼ぶ。\n外郭は要塞そのものだ。" },
  { id: 6, name: "王城内部", subtitle: "玉座への階", bg: "from-abyss via-void to-stone-950",
    encounters: [["royalGuard"], ["royalGuard", "mageSoldier"], ["royalGuard", "royalGuard"]],
    boss: ["remPriest"], shard: true,
    story: "王城の最奥、沈黙司祭レムが封印の詠唱を始める。\n──次は聖女、その先は勇者。" },
  { id: 7, name: "聖堂・聖女の間", subtitle: "選択の時", bg: "from-amber-900 via-stone-900 to-abyss",
    encounters: [["paladin", "priest"], ["paladin", "royalGuard"]],
    boss: ["saint"],
    story: "聖女セラフィナ。\nその歌は救済か、洗脳か。\n──君は彼女をどう扱う？" },
  { id: 8, name: "勇者の間", subtitle: "灰冠と聖剣", bg: "from-blood via-abyss to-black",
    encounters: [],
    boss: ["ardion"], shard: true,
    story: "勇者アルディオン。\n神に選ばれたのではない、造られた光。\n\n──終わらせよう。" },
];

export const ABYSS_STAGE: Stage = {
  id: 99, name: "灰深宮", subtitle: "クリア後・裏ダンジョン", bg: "from-black via-void to-blood",
  encounters: [["royalGuard", "executioner"], ["paladin", "paladin", "mageSoldier"], ["fanatic", "fanatic", "fanatic"]],
  boss: ["blackDragon"],
  story: "崩れた魔界の地下深く、黒星鉱の中心に何かが眠っている。",
};

export const EQUIPMENT: Record<string, Equipment> = {
  rustyClaw: { id: "rustyClaw", name: "錆びた爪", slot: "weapon", atk: 2, desc: "魔王の素手の延長。" },
  ashPlate: { id: "ashPlate", name: "灰鎧の欠片", slot: "body", def: 6, hp: 20, desc: "灰鎧ガルムの遺物。" },
  voidCloak: { id: "voidCloak", name: "虚空の外套", slot: "body", def: 3, mag: 4, darkBoost: 0.1, desc: "白槍を裂いた闇の布。" },
  emberRing: { id: "emberRing", name: "煉獄の指輪", slot: "acc", mag: 5, mp: 10, desc: "火刑卿の遺品。" },
  marshalCrown: { id: "marshalCrown", name: "元帥の徽章", slot: "head", atk: 4, def: 4, desc: "千の兵を率いた証。" },
  silentSeal: { id: "silentSeal", name: "沈黙の印", slot: "acc", mag: 6, mp: 15, desc: "封印詠唱を糧にする。" },
  saintTear: { id: "saintTear", name: "聖女の涙", slot: "acc", mag: 8, hp: 40, desc: "救いを願った滴。" },
  heroFragment: { id: "heroFragment", name: "聖剣の断片", slot: "weapon", atk: 12, mag: 6, desc: "光を裂く闇の代償。" },
  cursedFang: { id: "cursedFang", name: "呪牙剣", slot: "weapon", atk: 10, darkBoost: 0.2, cursed: { mpDrain: 2 }, desc: "強力だが毎ターンMPを蝕む。" },
  bloodCrown: { id: "bloodCrown", name: "灰冠", slot: "head", mag: 6, atk: 4, cursed: { hpPenalty: 30 }, desc: "魔王の象徴。HPの最大値を蝕む。" },
};
