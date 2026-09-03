import { io, type Socket } from "socket.io-client";
import type { ClientToServerEvents, ServerToClientEvents } from "./game/types";

export function connectSocket(): Socket<ServerToClientEvents, ClientToServerEvents> {
  const url = import.meta.env.VITE_SOCKET_URL as string | undefined;
  return io(url || undefined, {
    autoConnect: true,
  });
}
