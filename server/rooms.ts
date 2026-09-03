import type { Board, Player } from "../src/game/logic";
import {
  emptyBoard,
  getWinner,
  getWinningPattern,
  isDraw,
} from "../src/game/logic";
import type { GameStatePayload } from "../src/game/types";

type Room = {
  id: string;
  board: Board;
  currentPlayer: Player;
  players: { X?: string; O?: string };
  names: { X?: string; O?: string };
  gameActive: boolean;
  scores: { X: number; O: number };
  rematchReady: { X: boolean; O: boolean };
};

export type RoomResult<T> = { ok: true; data: T } | { ok: false; error: string };

const rooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();

function sanitizeName(username: string): string {
  const trimmed = username.trim().slice(0, 20);
  return trimmed || "Player";
}

function generateRoomId(): string {
  let id = "";
  do {
    id = Math.random().toString(36).substring(2, 8);
  } while (rooms.has(id));
  return id;
}

function playerForSocket(room: Room, socketId: string): Player | null {
  if (room.players.X === socketId) return "X";
  if (room.players.O === socketId) return "O";
  return null;
}

function playersConnected(room: Room): number {
  return Number(Boolean(room.players.X)) + Number(Boolean(room.players.O));
}

export function toPayload(room: Room, socketId: string): GameStatePayload {
  const winner = getWinner(room.board);
  return {
    roomId: room.id,
    board: [...room.board],
    currentPlayer: room.currentPlayer,
    gameActive: room.gameActive,
    scores: { ...room.scores },
    names: { ...room.names },
    you: playerForSocket(room, socketId),
    winner,
    winningPattern: getWinningPattern(room.board),
    isDraw: isDraw(room.board),
    rematchReady: { ...room.rematchReady },
    playersConnected: playersConnected(room),
  };
}

export function getRoomBySocket(socketId: string): Room | undefined {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return undefined;
  return rooms.get(roomId);
}

export function createRoom(
  socketId: string,
  username: string,
): RoomResult<{ roomId: string; payload: GameStatePayload }> {
  leaveRoom(socketId);

  const room: Room = {
    id: generateRoomId(),
    board: emptyBoard(),
    currentPlayer: "X",
    players: { X: socketId },
    names: { X: sanitizeName(username) },
    gameActive: true,
    scores: { X: 0, O: 0 },
    rematchReady: { X: false, O: false },
  };

  rooms.set(room.id, room);
  socketToRoom.set(socketId, room.id);

  return { ok: true, data: { roomId: room.id, payload: toPayload(room, socketId) } };
}

export function joinRoom(
  socketId: string,
  username: string,
  roomId: string,
): RoomResult<{ room: Room }> {
  const id = roomId.trim().toLowerCase();
  const room = rooms.get(id) ?? rooms.get(roomId.trim());

  if (!room) {
    return { ok: false, error: "Room not found." };
  }

  if (room.players.X === socketId || room.players.O === socketId) {
    return { ok: true, data: { room } };
  }

  if (playersConnected(room) >= 2) {
    return { ok: false, error: "This room already has 2 players." };
  }

  leaveRoom(socketId);

  const seat: Player = room.players.X ? "O" : "X";
  room.players[seat] = socketId;
  room.names[seat] = sanitizeName(username);
  socketToRoom.set(socketId, room.id);

  return { ok: true, data: { room } };
}

export function makeMove(
  socketId: string,
  index: number,
): RoomResult<{ room: Room }> {
  const room = getRoomBySocket(socketId);
  if (!room) {
    return { ok: false, error: "You are not in a room." };
  }

  if (playersConnected(room) < 2) {
    return { ok: false, error: "Waiting for an opponent." };
  }

  if (!room.gameActive) {
    return { ok: false, error: "The game is already over." };
  }

  if (!Number.isInteger(index) || index < 0 || index > 8) {
    return { ok: false, error: "Invalid move." };
  }

  const you = playerForSocket(room, socketId);
  if (!you) {
    return { ok: false, error: "You are not in this game." };
  }

  if (you !== room.currentPlayer) {
    return { ok: false, error: "It is not your turn." };
  }

  if (room.board[index] !== "") {
    return { ok: false, error: "That cell is already taken." };
  }

  const next = [...room.board];
  next[index] = you;
  room.board = next;

  const winner = getWinner(room.board);
  if (winner) {
    room.gameActive = false;
    room.scores[winner] += 1;
  } else if (isDraw(room.board)) {
    room.gameActive = false;
  } else {
    room.currentPlayer = you === "X" ? "O" : "X";
  }

  room.rematchReady = { X: false, O: false };
  return { ok: true, data: { room } };
}

export function requestRematch(socketId: string): RoomResult<{ room: Room }> {
  const room = getRoomBySocket(socketId);
  if (!room) {
    return { ok: false, error: "You are not in a room." };
  }

  if (room.gameActive) {
    return { ok: false, error: "The game is still in progress." };
  }

  if (playersConnected(room) < 2) {
    return { ok: false, error: "Waiting for an opponent." };
  }

  const you = playerForSocket(room, socketId);
  if (!you) {
    return { ok: false, error: "You are not in this game." };
  }

  room.rematchReady[you] = true;

  if (room.rematchReady.X && room.rematchReady.O) {
    room.board = emptyBoard();
    room.currentPlayer = "X";
    room.gameActive = true;
    room.rematchReady = { X: false, O: false };
  }

  return { ok: true, data: { room } };
}

export function leaveRoom(socketId: string): {
  roomId: string | null;
  remainingSocketIds: string[];
} {
  const room = getRoomBySocket(socketId);
  socketToRoom.delete(socketId);

  if (!room) {
    return { roomId: null, remainingSocketIds: [] };
  }

  if (room.players.X === socketId) {
    delete room.players.X;
    delete room.names.X;
    room.rematchReady.X = false;
  }

  if (room.players.O === socketId) {
    delete room.players.O;
    delete room.names.O;
    room.rematchReady.O = false;
  }

  const remainingSocketIds = [room.players.X, room.players.O].filter(
    (id): id is string => Boolean(id),
  );

  if (remainingSocketIds.length === 0) {
    rooms.delete(room.id);
    return { roomId: room.id, remainingSocketIds: [] };
  }

  room.gameActive = false;
  return { roomId: room.id, remainingSocketIds };
}

export function emitToRoom(
  room: Room,
  emit: (socketId: string, payload: GameStatePayload) => void,
): void {
  for (const socketId of [room.players.X, room.players.O]) {
    if (socketId) emit(socketId, toPayload(room, socketId));
  }
}
