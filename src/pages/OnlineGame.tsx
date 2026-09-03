import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type { Socket } from "socket.io-client";
import { Board } from "../components/Board";
import { GameLayout } from "../components/GameLayout";
import { Scoreboard } from "../components/Scoreboard";
import { StatusBar } from "../components/StatusBar";
import type { ClientToServerEvents, GameStatePayload, ServerToClientEvents } from "../game/types";
import { connectSocket } from "../socket";

type Phase = "lobby" | "waiting" | "playing" | "left";

function onlineStatus(state: GameStatePayload, phase: Phase): string {
  if (phase === "waiting") return "Waiting for opponent...";
  if (!state.gameActive && state.winner && state.you === state.winner) return "You Win!";
  if (!state.gameActive && state.winner) return "Opponent Wins!";
  if (!state.gameActive && state.isDraw) return "It's a Draw!";
  if (state.you && state.you === state.currentPlayer) return "Your Turn";
  return "Opponent's Turn";
}

export function OnlineGame() {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(
    null,
  );
  const [phase, setPhase] = useState<Phase>("lobby");
  const [username, setUsername] = useState("");
  const [roomInput, setRoomInput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [state, setState] = useState<GameStatePayload | null>(null);

  useEffect(() => {
    const socket = connectSocket();
    socketRef.current = socket;

    socket.on("roomCreated", () => {
      setError("");
      setPhase("waiting");
    });

    socket.on("gameState", (payload) => {
      setState(payload);
      setError("");
      setPhase(payload.playersConnected < 2 ? "waiting" : "playing");
    });

    socket.on("roomError", ({ message }) => {
      setError(message);
    });

    socket.on("opponentLeft", ({ message }) => {
      setError(message);
      setPhase("left");
    });

    socket.on("connect_error", () => {
      setError(
        "Could not reach the game server. Run npm run dev locally, or host the Node server and set VITE_SOCKET_URL.",
      );
    });

    return () => {
      socket.emit("leaveRoom");
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function createRoom() {
    setError("");
    socketRef.current?.emit("createRoom", { username });
  }

  function joinRoom() {
    const id = roomInput.trim();
    if (!id) {
      setError("Enter a valid Room ID");
      return;
    }
    setError("");
    socketRef.current?.emit("joinRoom", { username, roomId: id });
  }

  function playMove(index: number) {
    if (!state?.gameActive || state.you !== state.currentPlayer) return;
    socketRef.current?.emit("playerMove", { index });
  }

  function rematch() {
    socketRef.current?.emit("rematch");
  }

  async function copyRoomId() {
    if (!state?.roomId) return;
    try {
      await navigator.clipboard.writeText(state.roomId);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setError("Could not copy Room ID");
    }
  }

  if (phase === "lobby") {
    return (
      <GameLayout title="Online Multiplayer">
        <p className="subtitle">Create a room or join a friend</p>
        <form
          className="lobby"
          onSubmit={(event) => {
            event.preventDefault();
            createRoom();
          }}
        >
          <input
            type="text"
            maxLength={20}
            placeholder="Your name"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            aria-label="Your name"
          />
          <button type="submit" className="mode-btn">
            Create Room
          </button>
        </form>
        <form
          className="lobby join-room"
          onSubmit={(event) => {
            event.preventDefault();
            joinRoom();
          }}
        >
          <input
            type="text"
            placeholder="Enter Room ID"
            value={roomInput}
            onChange={(event) => setRoomInput(event.target.value)}
            aria-label="Room ID"
          />
          <button type="submit" className="mode-btn">
            Join Room
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </GameLayout>
    );
  }

  if (phase === "left") {
    return (
      <GameLayout title="Online Multiplayer">
        <p className="subtitle">{error || "Your opponent left the room."}</p>
        <Link to="/" className="mode-btn">
          Back to Home
        </Link>
      </GameLayout>
    );
  }

  if (!state) {
    return (
      <GameLayout title="Online Multiplayer">
        <p className="subtitle">Connecting...</p>
      </GameLayout>
    );
  }

  const youReady = Boolean(state.you && state.rematchReady[state.you]);
  const waitingForRematch = !state.gameActive && youReady;

  return (
    <GameLayout title="Online Multiplayer">
      <div className="room-banner">
        <span>
          Room ID: <strong>{state.roomId}</strong>
        </span>
        <button type="button" className="copy-btn" onClick={() => void copyRoomId()}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      {phase === "waiting" && (
        <p className="subtitle">Share this ID and wait for an opponent</p>
      )}
      <Scoreboard
        x={state.scores.X}
        o={state.scores.O}
        xLabel={state.names.X ? `X · ${state.names.X}` : "X"}
        oLabel={state.names.O ? `O · ${state.names.O}` : "O"}
      />
      <Board
        board={state.board}
        winningPattern={state.winningPattern}
        disabled={
          !state.gameActive ||
          state.you !== state.currentPlayer ||
          state.playersConnected < 2
        }
        onCellClick={playMove}
      />
      <StatusBar
        text={onlineStatus(state, phase)}
        player={state.currentPlayer}
      />
      {state.you && <p className="you-mark">You are {state.you}</p>}
      {!state.gameActive && state.playersConnected === 2 && (
        <button
          type="button"
          className="play-again"
          onClick={rematch}
          disabled={waitingForRematch}
        >
          {waitingForRematch ? "Waiting for opponent..." : "Play again"}
        </button>
      )}
      {error && phase === "playing" && <p className="error-text">{error}</p>}
    </GameLayout>
  );
}
