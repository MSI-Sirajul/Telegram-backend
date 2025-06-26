const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// CORS configuration to allow specific origins
app.use(
  cors({
    origin: ["https://your-frontend-domain.com", "http://localhost:3000"], // Replace with your actual frontend domain
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).send("Server is running");
});

// Telegram webhook endpoint
app.post("/telegram-webhook", (req, res) => {
  console.log("Webhook received:", JSON.stringify(req.body, null, 2)); // Log incoming webhook data

  const msg = req.body.message;
  if (!msg || !msg.text) {
    console.log("No valid message or text found in webhook");
    return res.sendStatus(200);
  }

  const messageData = {
    id: msg.message_id,
    text: msg.text,
    sender: msg.from.is_bot ? "admin" : "user",
    timestamp: new Date(msg.date * 1000).toISOString(),
  };

  console.log("Broadcasting message to WebSocket clients:", messageData);

  // Broadcast message to all connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(JSON.stringify(messageData));
        console.log(`Message sent to client: ${client._socket.remoteAddress}`);
      } catch (error) {
        console.error("Error sending message to client:", error);
      }
    }
  });

  res.sendStatus(200);
});

// WebSocket connection handling
wss.on("connection", (ws) => {
  console.log("New WebSocket client connected");
  ws.on("message", (message) => {
    console.log("Received WebSocket message:", message.toString());
  });
  ws.on("close", () => {
    console.log("WebSocket client disconnected");
  });
  ws.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

// Default route
app.get("/", (req, res) => {
  res.send("Telegram Webhook & WebSocket server running.");
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Error handling for server
server.on("error", (error) => {
  console.error("Server error:", error);
});