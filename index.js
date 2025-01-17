const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
const app = express();
const bodyParser = require('body-parser');
const port = process.env.PORT || 3003;
const connection = require("./config/db.config");
const { webSocketServers, callSocketServers } = require("./controllers"); // Import webSocketServers

app.use(bodyParser.urlencoded({ extended: false }));

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

app.get("/", (req, res) => {
  res.send("Welcome to the Invisible App!");
});

const server = http.createServer(app);

server.on("upgrade", (request, socket, head) => {
  if (request.url.includes("callStreaming")) {
    const call_sid = new URL(
      request.url,
      `https://${request.headers.host}`
    ).searchParams.get("call_sid");
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
  const uniqueId = new URL(
    request.url,
    `http://${request.headers.host}`
  ).searchParams.get("id");
  if (webSocketServers[uniqueId]) {
    webSocketServers[uniqueId].handleUpgrade(request, socket, head, (ws) => {
      webSocketServers[uniqueId].emit("connection", ws, request);
    });
  } else {
    console.log("nothing condition is matched so now closing the socket");
    socket.destroy();
  }
});

connection();

server.listen(port, () => {
  console.log(`server logs checking 1`);
  console.log(`Server is running at http://localhost:${port}`);
});
