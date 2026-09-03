import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./game/types";

export function connectSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  return io({
    autoConnect: true,
  });
}
