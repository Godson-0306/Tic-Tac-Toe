import type { Board } from "../game/logic";
import { Cell } from "./Cell";

type BoardProps = {
  board: Board;
  winningPattern: number[] | null;
  disabled: boolean;
  onCellClick: (index: number) => void;
};

export function Board({ board, winningPattern, disabled, onCellClick }: BoardProps) {
  return (
    <div className="board">
      {board.map((value, index) => (
        <Cell
          key={index}
          value={value}
          index={index}
          isWin={winningPattern?.includes(index) ?? false}
          disabled={disabled}
          onClick={onCellClick}
        />
      ))}
    </div>
  );
}
