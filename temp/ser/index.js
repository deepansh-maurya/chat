import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 3000 });
const clients = new Map();

wss.on("connection", (ws) => {
  let myId = null;

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    // Register client
    if (data.type === "join") {
      myId = data.id;
      clients.set(myId, ws);
      return;
    }

    // Forward SDP / ICE to target peer
    const target = clients.get(data.to);
    if (target) {
      target.send(JSON.stringify(data));
    }
  });

  ws.on("close", () => {
    if (myId) clients.delete(myId);
  });
});

console.log("Signaling server running on ws://localhost:3000");
