import type { Player } from "../game/logic";

type StatusBarProps = {
  text: string;
  player: Player;
};

export function StatusBar({ text, player }: StatusBarProps) {
  return (
    <h2 id="status" className={player === "X" ? "x-turn" : "o-turn"}>
      {text}
    </h2>
  );
}
