const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(cors());
app.use(express.json());

app.post("/telegram-webhook", (req, res) => {
  const msg = req.body.message;
  if (!msg || !msg.text) return res.sendStatus(200);

  const messageData = {
    id: msg.message_id,
    text: msg.text,
    sender: msg.from.is_bot ? "admin" : "user",
    timestamp: new Date(msg.date * 1000),
  };

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(messageData));
    }
  });

  res.sendStatus(200);
});

app.get("/", (req, res) => {
  res.send("Telegram Webhook & WebSocket server running.");
});

server.listen(process.env.PORT || 3000, () => {
  console.log("Server running on port", process.env.PORT || 3000);
});
