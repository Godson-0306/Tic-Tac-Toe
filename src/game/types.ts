import type { Board, Player } from "../game/logic";

export type GameStatePayload = {
  roomId: string;
  board: Board;
  currentPlayer: Player;
  gameActive: boolean;
  scores: { X: number; O: number };
  names: { X?: string; O?: string };
  you: Player | null;
  winner: Player | null;
  winningPattern: number[] | null;
  isDraw: boolean;
  rematchReady: { X: boolean; O: boolean };
  playersConnected: number;
};

export type ClientToServerEvents = {
  createRoom: (payload: { username: string }) => void;
  joinRoom: (payload: { username: string; roomId: string }) => void;
  playerMove: (payload: { index: number }) => void;
  rematch: () => void;
  leaveRoom: () => void;
};

export type ServerToClientEvents = {
  roomCreated: (payload: { roomId: string }) => void;
  gameState: (payload: GameStatePayload) => void;
  roomError: (payload: { message: string }) => void;
  opponentLeft: (payload: { message: string }) => void;
};
