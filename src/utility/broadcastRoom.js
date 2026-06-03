import { rooms } from "../server.js";

function broadcastRoom(roomId, payload, ws) {
    const room = rooms.get(roomId);
    if (!room) return;
    const str = JSON.stringify(payload);
    for (const [, ws] of room.players) {
        if (ws.readyState === 1) ws.send(str);
    }
}

export { broadcastRoom };