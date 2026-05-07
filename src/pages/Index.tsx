import { useEffect } from "react";
import { Game } from "@/game/Game";

const Index = () => {
  useEffect(() => {
    document.title = "灰冠の魔王 | The Ash-Crowned Lord";
    const desc = document.querySelector('meta[name="description"]') || document.createElement("meta");
    desc.setAttribute("name", "description");
    desc.setAttribute("content", "縦型スマホ向け8ビット風ダークファンタジーRPG『灰冠の魔王』。魔王ヴァルゼインを操作し聖王国へ逆侵攻するターン制コマンドバトル。");
    if (!desc.parentElement) document.head.appendChild(desc);
  }, []);

  return (
    <main className="fixed inset-0 bg-black flex items-center justify-center">
      <h1 className="sr-only">灰冠の魔王 - The Ash-Crowned Lord</h1>
      <div className="relative w-full h-full max-w-[440px] max-h-[900px] mx-auto bg-abyss overflow-hidden border-x-2 border-gold/30 shadow-2xl">
        <Game />
      </div>
    </main>
  );
};

export default Index;
