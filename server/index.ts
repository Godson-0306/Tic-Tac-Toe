import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
} from "../src/game/types";
import {
  createRoom,
  emitToRoom,
  joinRoom,
  leaveRoom,
  makeMove,
  requestRematch,
} from "./rooms";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3001;
const distPath = path.join(__dirname, "../dist");
const isDev = process.env.NODE_ENV !== "production";

const app = express();
app.use(
  cors({
    origin: isDev ? ["http://localhost:5173", "http://127.0.0.1:5173"] : false,
  }),
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/socket.io")) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, "index.html"));
  });
}

const httpServer = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: isDev ? ["http://localhost:5173", "http://127.0.0.1:5173"] : false,
  },
});

function broadcastRoom(room: { players: { X?: string; O?: string } }): void {
  emitToRoom(room as Parameters<typeof emitToRoom>[0], (socketId, payload) => {
    io.to(socketId).emit("gameState", payload);
  });
}

io.on("connection", (socket) => {
  socket.on("createRoom", ({ username }) => {
    const result = createRoom(socket.id, username ?? "");
    if (!result.ok) {
      socket.emit("roomError", { message: result.error });
      return;
    }
    void socket.join(result.data.roomId);
    socket.emit("roomCreated", { roomId: result.data.roomId });
    socket.emit("gameState", result.data.payload);
  });

  socket.on("joinRoom", ({ username, roomId }) => {
    const result = joinRoom(socket.id, username ?? "", roomId ?? "");
    if (!result.ok) {
      socket.emit("roomError", { message: result.error });
      return;
    }
    void socket.join(result.data.room.id);
    broadcastRoom(result.data.room);
  });

  socket.on("playerMove", ({ index }) => {
    const result = makeMove(socket.id, index);
    if (!result.ok) {
      socket.emit("roomError", { message: result.error });
      return;
    }
    broadcastRoom(result.data.room);
  });

  socket.on("rematch", () => {
    const result = requestRematch(socket.id);
    if (!result.ok) {
      socket.emit("roomError", { message: result.error });
      return;
    }
    broadcastRoom(result.data.room);
  });

  socket.on("leaveRoom", () => {
    const { remainingSocketIds } = leaveRoom(socket.id);
    for (const id of remainingSocketIds) {
      io.to(id).emit("opponentLeft", {
        message: "Your opponent left the room.",
      });
    }
  });

  socket.on("disconnect", () => {
    const { remainingSocketIds } = leaveRoom(socket.id);
    for (const id of remainingSocketIds) {
      io.to(id).emit("opponentLeft", {
        message: "Your opponent disconnected.",
      });
    }
  });
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on 0.0.0.0:${PORT}`);
});
