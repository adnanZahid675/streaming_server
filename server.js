const express = require("express");
const cors = require("cors");
const http = require("http");
const app = express();
const port = 3002;
const { webSocketServers, callSocketServers } = require("./controllers"); // Import webSocketServers

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// Import the router
const apiRouter = require("./routers");
app.use(apiRouter);

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  if (request.url.includes("callStreaming")) {
    const call_sid = new URL(request.url, `http://${request.headers.host}`).searchParams.get("call_sid");
    console.log("handle call streaming web socket", call_sid);
    if (callSocketServers[call_sid]) {
      callSocketServers[call_sid].handleUpgrade(request, socket, head, (ws) => {
        callSocketServers[call_sid].emit("connection", ws, request);
      });
    } else {
      socket.destroy();
    }
    return;
  }
  const uniqueId = new URL(request.url, `http://${request.headers.host}`).searchParams.get("id");
  if (webSocketServers[uniqueId]) {
    webSocketServers[uniqueId].handleUpgrade(request, socket, head, (ws) => {
      webSocketServers[uniqueId].emit("connection", ws, request);
    });
  } else {
    socket.destroy();
  }
});

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
