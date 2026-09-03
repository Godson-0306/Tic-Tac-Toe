export type Player = "X" | "O";
export type CellValue = Player | "";
export type Board = CellValue[];
export type Difficulty = "easy" | "hard";

export const WIN_PATTERNS: readonly number[][] = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function emptyBoard(): Board {
  return ["", "", "", "", "", "", "", "", ""];
}

export function getWinningPattern(board: Board): number[] | null {
  for (const pattern of WIN_PATTERNS) {
    const [a, b, c] = pattern;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return [...pattern];
    }
  }
  return null;
}

export function getWinner(board: Board): Player | null {
  const pattern = getWinningPattern(board);
  if (!pattern) return null;
  return board[pattern[0]] as Player;
}

export function isDraw(board: Board): boolean {
  return getWinner(board) === null && board.every((cell) => cell !== "");
}

export function emptyIndices(board: Board): number[] {
  return board
    .map((value, index) => (value === "" ? index : -1))
    .filter((index) => index !== -1);
}

export function getEasyMove(board: Board): number {
  const empty = emptyIndices(board);
  if (empty.length === 0) return -1;
  return empty[Math.floor(Math.random() * empty.length)];
}

export function getHardMove(board: Board, ai: Player = "O"): number {
  const human: Player = ai === "O" ? "X" : "O";
  const options = emptyIndices(board);
  if (options.length === 0) return -1;

  let bestScore = -Infinity;
  let bestMove = options[0];

  for (const index of options) {
    const next = [...board];
    next[index] = ai;
    const score = minimax(next, 0, false, ai, human);
    if (score > bestScore) {
      bestScore = score;
      bestMove = index;
    }
  }

  return bestMove;
}

function minimax(
  board: Board,
  depth: number,
  isMaximizing: boolean,
  ai: Player,
  human: Player,
): number {
  const winner = getWinner(board);
  if (winner === ai) return 10 - depth;
  if (winner === human) return depth - 10;
  if (isDraw(board)) return 0;

  if (isMaximizing) {
    let best = -Infinity;
    for (const index of emptyIndices(board)) {
      const next = [...board];
      next[index] = ai;
      best = Math.max(best, minimax(next, depth + 1, false, ai, human));
    }
    return best;
  }

  let best = Infinity;
  for (const index of emptyIndices(board)) {
    const next = [...board];
    next[index] = human;
    best = Math.min(best, minimax(next, depth + 1, true, ai, human));
  }
  return best;
}
