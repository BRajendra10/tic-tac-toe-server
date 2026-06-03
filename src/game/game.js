import { v4 as uuidv4 } from "uuid";

import { createEmptyState } from "../utility/createGameState.js";
import { broadcastRoom } from "../utility/broadcastRoom.js";
import { checkWinner } from "../utility/checkWinner.js";

function createRoom(clientId, rooms, ws) {
    const roomId = uuidv4().slice(0, 6).toUpperCase();
    const state = createEmptyState();
    state.players[clientId] = 'X';
    const players = new Map([[clientId, ws]]);
    rooms.set(roomId, { players, state });
    ws.roomId = roomId;
    ws.symbol = 'X';
    ws.send(JSON.stringify({ type: 'created', roomId, state }));

    return;
}

function joinRoom(clientId, roomId, rooms, ws) {
    const room = rooms.get(roomId);

    if (!room) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
    }

    if (room.players.size === 2) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room full' }));
        return;
    }

    room.players.set(clientId, ws); // seting second the 0 user in roomId(roomdId the user provide)
    room.state.players[clientId] = 'O';
    ws.roomId = roomId;
    ws.symbol = 'O';
    broadcastRoom(roomId, { type: 'joined', roomId, state: room.state }, ws)
}

function makeMove(clientId, index, rooms, ws) {
    const room = rooms.get(ws.roomId);
    const state = room.state;
    const mySymbol = state.players[clientId];
    // Early exit if invalid move
    if (
        state.result ||             // game already finished
        state.turn !== mySymbol ||  // not your turn
        index < 0 || index > 8 ||  // invalid index
        state.board[index]          // cell already filled
    ) return;
    // Make the move
    state.board[index] = mySymbol;
    state.turn = mySymbol === 'X' ? 'O' : 'X';
    // Check for winner
    const result = checkWinner(state.board);
    if (result) state.result = result;
    // Broadcast updated state
    broadcastRoom(ws.roomId, { type: 'state', state }, ws);
}

function resetGame(clientId, rooms, ws) {
    const room = rooms.get(ws.roomId);
    if (!room) return;
    // Reset state
    const players = room.state.players;
    room.state = createEmptyState();
    room.state.players = players; // Keep player symbols
    // Broadcast updated state
    broadcastRoom(ws.roomId, { type: 'state', state: room.state }, ws);
}

function leaveRoom(clientId, rooms, ws) {
    const room = rooms.get(ws.roomId);
    if (room) {
        // Notify the other player
        broadcastRoom(ws.roomId, { type: 'left', clientId }, ws);
        // Delete the entire room
        rooms.delete(ws.roomId);
    }
    ws.roomId = null;
}

export { createRoom, joinRoom, makeMove, resetGame, leaveRoom };