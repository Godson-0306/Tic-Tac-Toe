import { Board } from "../components/Board";
import { GameLayout } from "../components/GameLayout";
import { Scoreboard } from "../components/Scoreboard";
import { StatusBar } from "../components/StatusBar";
import { useLocalGame } from "../hooks/useLocalGame";

function statusText(
  gameActive: boolean,
  winningPattern: number[] | null,
  board: string[],
  currentPlayer: string,
): string {
  if (!gameActive && winningPattern) {
    return `Player ${board[winningPattern[0]]} Wins!`;
  }
  if (!gameActive) {
    return "It's a Draw!";
  }
  return `Player ${currentPlayer}'s Turn`;
}

export function LocalGame() {
  const {
    board,
    currentPlayer,
    gameActive,
    scores,
    winningPattern,
    playMove,
    playAgain,
  } = useLocalGame("local");

  return (
    <GameLayout title="Local Mode">
      <Scoreboard x={scores.X} o={scores.O} />
      <Board
        board={board}
        winningPattern={winningPattern}
        disabled={!gameActive}
        onCellClick={playMove}
      />
      <StatusBar
        text={statusText(gameActive, winningPattern, board, currentPlayer)}
        player={currentPlayer}
      />
      {!gameActive && (
        <button type="button" className="play-again" onClick={playAgain}>
          Play again
        </button>
      )}
    </GameLayout>
  );
}
