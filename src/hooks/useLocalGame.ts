import { useCallback, useEffect, useState } from "react";
import type { Board, Difficulty, Player } from "../game/logic";
import {
  emptyBoard,
  getEasyMove,
  getHardMove,
  getWinningPattern,
  isDraw,
} from "../game/logic";

type Mode = "local" | "ai";

type GameHook = {
  board: Board;
  currentPlayer: Player;
  gameActive: boolean;
  scores: { X: number; O: number };
  winningPattern: number[] | null;
  isAiThinking: boolean;
  playMove: (index: number) => void;
  playAgain: () => void;
};

export function useLocalGame(mode: Mode, difficulty: Difficulty = "easy"): GameHook {
  const [board, setBoard] = useState<Board>(emptyBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>("X");
  const [gameActive, setGameActive] = useState(true);
  const [scores, setScores] = useState({ X: 0, O: 0 });
  const [winningPattern, setWinningPattern] = useState<number[] | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);

  const applyMove = useCallback((currentBoard: Board, index: number, player: Player) => {
    if (currentBoard[index] !== "") {
      return { board: currentBoard, ended: true, nextPlayer: player };
    }

    const next = [...currentBoard];
    next[index] = player;
    const pattern = getWinningPattern(next);

    if (pattern) {
      setBoard(next);
      setWinningPattern(pattern);
      setGameActive(false);
      setScores((prev) => ({ ...prev, [player]: prev[player] + 1 }));
      return { board: next, ended: true, nextPlayer: player };
    }

    if (isDraw(next)) {
      setBoard(next);
      setGameActive(false);
      return { board: next, ended: true, nextPlayer: player };
    }

    const nextPlayer: Player = player === "X" ? "O" : "X";
    setBoard(next);
    setCurrentPlayer(nextPlayer);
    return { board: next, ended: false, nextPlayer };
  }, []);

  const playAgain = useCallback(() => {
    setBoard(emptyBoard());
    setCurrentPlayer("X");
    setGameActive(true);
    setWinningPattern(null);
    setIsAiThinking(false);
  }, []);

  useEffect(() => {
    setBoard(emptyBoard());
    setCurrentPlayer("X");
    setGameActive(true);
    setWinningPattern(null);
    setIsAiThinking(false);
  }, [difficulty]);

  useEffect(() => {
    if (mode !== "ai" || !gameActive || currentPlayer !== "O") {
      setIsAiThinking(false);
      return;
    }

    setIsAiThinking(true);
    const timeout = window.setTimeout(() => {
      setBoard((current) => {
        const move =
          difficulty === "hard" ? getHardMove(current, "O") : getEasyMove(current);
        if (move === -1) {
          return current;
        }

        const next = [...current];
        next[move] = "O";
        const pattern = getWinningPattern(next);

        if (pattern) {
          setWinningPattern(pattern);
          setGameActive(false);
          setScores((prev) => ({ ...prev, O: prev.O + 1 }));
          return next;
        }

        if (isDraw(next)) {
          setGameActive(false);
          return next;
        }

        setCurrentPlayer("X");
        return next;
      });
      setIsAiThinking(false);
    }, 450);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [mode, gameActive, currentPlayer, difficulty]);

  const playMove = useCallback(
    (index: number) => {
      if (!gameActive || isAiThinking || board[index] !== "") return;
      if (mode === "ai" && currentPlayer !== "X") return;
      applyMove(board, index, currentPlayer);
    },
    [applyMove, board, currentPlayer, gameActive, isAiThinking, mode],
  );

  return {
    board,
    currentPlayer,
    gameActive,
    scores,
    winningPattern,
    isAiThinking,
    playMove,
    playAgain,
  };
}
