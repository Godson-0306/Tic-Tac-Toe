import { useState } from "react";
import { Board } from "../components/Board";
import { GameLayout } from "../components/GameLayout";
import { Scoreboard } from "../components/Scoreboard";
import { StatusBar } from "../components/StatusBar";
import type { Difficulty } from "../game/logic";
import { useLocalGame } from "../hooks/useLocalGame";

export function AiGame() {
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const {
    board,
    currentPlayer,
    gameActive,
    scores,
    winningPattern,
    isAiThinking,
    playMove,
    playAgain,
  } = useLocalGame("ai", difficulty);

  const winner = winningPattern ? board[winningPattern[0]] : null;
  let text = `Player ${currentPlayer}'s Turn`;
  if (isAiThinking) text = "AI is thinking...";
  else if (!gameActive && winner === "X") text = "You Win!";
  else if (!gameActive && winner === "O") text = "AI Wins!";
  else if (!gameActive) text = "It's a Draw!";
  else if (currentPlayer === "O") text = "AI's Turn";

  return (
    <GameLayout title="AI Mode">
      <div className="difficulty">
        <button
          type="button"
          className={`diff-btn${difficulty === "easy" ? " active" : ""}`}
          onClick={() => setDifficulty("easy")}
        >
          Easy
        </button>
        <button
          type="button"
          className={`diff-btn${difficulty === "hard" ? " active" : ""}`}
          onClick={() => setDifficulty("hard")}
        >
          Hard
        </button>
      </div>
      <Scoreboard x={scores.X} o={scores.O} xLabel="You" oLabel="AI" />
      <Board
        board={board}
        winningPattern={winningPattern}
        disabled={!gameActive || isAiThinking}
        onCellClick={playMove}
      />
      <StatusBar text={text} player={currentPlayer} />
      {!gameActive && (
        <button type="button" className="play-again" onClick={playAgain}>
          Play again
        </button>
      )}
    </GameLayout>
  );
}
