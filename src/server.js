import { WebSocketServer } from "ws";
import { v4 as uuidv4 } from "uuid";
import http from 'http';  // Node built-in—no install needed

import { broadcastRoom } from "./utility/broadcastRoom.js";
import { createRoom, joinRoom, makeMove, resetGame, leaveRoom } from "./game/game.js";

const PORT = process.env.PORT || 8080;
const server = http.createServer();  // Empty HTTP—just for hosting
const wss = new WebSocketServer({ server });  // WS on same port

export const rooms = new Map();
// rooms (Map)
//  ├─ 'ROOM123' → { 
//  │    players: Map
//  │     ├─ 'clientA' → wsA
//  │     └─ 'clientB' → wsB
//  │    state: { board: [...], turn: 'X', ... }
//  │  }
//  └─ 'ROOM456' → { ...another room... }


// Handle connections
wss.on('connection', (ws) => {
  const clientId = uuidv4();
  ws.clientId = clientId; // Assign a unique ID to this client and store it on the socket.
  ws.roomId = null; // Also track which room this client is in (null until they join/create a room).

  ws.send(JSON.stringify({ type: 'connected', clientId }));

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      switch (msg.type) {

        case 'create': {
          createRoom(clientId, rooms, ws);
          break;
        }
        case 'join': {
          joinRoom(clientId, msg.roomId, rooms, ws);
          break;
        }
        case 'move': {
          makeMove(clientId, msg.index, rooms, ws);
          break;
        }
        case 'reset': {
          resetGame(clientId, rooms, ws);
          break;
        }
        case 'leave': {
          leaveRoom(clientId, rooms, ws);
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
      }

    } catch (err) {
      console.error('Invalid message', err);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  // Handle socket closing (browser close, crash)
  ws.on('close', () => {
    const room = rooms.get(ws.roomId);
    if (room) {
      broadcastRoom(ws.roomId, { type: 'left', clientId });
      rooms.delete(ws.roomId);
    }
  });

});

server.listen(PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}`);
});  // Binds everything