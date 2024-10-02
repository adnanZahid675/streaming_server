const WebSocket = require("ws");
let callSocketServers = {};

const getCallStreaming = (req, res) => {
  const conf_sid = req?.query?.conf_sid;
  console.log("conference sid: ", conf_sid);

  if (!conf_sid) {
    res.status(400).json({ message: "Conference sid not found" });
    return;
  }

  const callSocket = new WebSocket.Server({ noServer: true });
  callSocketServers[conf_sid] = callSocket;

  callSocketServers[conf_sid].on("connection", (ws) => {
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
      ws.send(`Server response: ${message}`);
    });

    ws.on("close", () => {
      console.log("Client disconnected");
    });

    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });

  // Check if the incoming request is secure (HTTPS) to decide between ws or wss
  const protocol = req.secure ? "wss" : "ws"; // req.secure is true if HTTPS
  const wsUrl = `${protocol}://${req.headers.host}/callStreaming?call_sid=${conf_sid}`;

  res.json({
    message: "WebSocket server for call has been created",
    url: wsUrl,
  });
};

module.exports = { getCallStreaming, callSocketServers };
