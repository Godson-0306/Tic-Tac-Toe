# Tic Tac Toe

Neon React remake of a local, AI, and online tic-tac-toe game.

## Stack

- **Vite + React + TypeScript** for the UI
- **Express + Socket.IO** for online rooms (server is the source of truth)
- Hard AI uses minimax in the browser (no Python backend)

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

- **Local (2 Players)** — hotseat on one device
- **Play vs AI** — Easy (random) or Hard (unbeatable)
- **Online Multiplayer** — create a room, share the ID, join from another tab or browser

## Production

```bash
npm run build
npm start
```

The Node server serves the built SPA and WebSockets on `0.0.0.0:$PORT` (default `3001`). `GET /health` is the health check.

## Deploy on Render

This repo includes a [`render.yaml`](render.yaml) Blueprint: one web service, `npm ci && npm run build`, then `npm start`. Rooms are in-memory, so they reset when the service restarts.
