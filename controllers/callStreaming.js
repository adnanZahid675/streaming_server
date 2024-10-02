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
    console.log("\n\n\n\nconnection created");

    ws.on("message", (message) => {
      const data = JSON.parse(message); // Parsing the incoming message
      console.log("data?.media", data?.media);

      if (data.event === "dtmf") {
        console.log("dtmf Received DTMF digit:", data); // Logging the pressed digit
        console.log("Received DTMF digit:", data.digit); // Logging the pressed digit
      }
      if (data.event === "digits") {
        console.log("digits Received DTMF digit:", data); // Logging the pressed digit
        console.log("Received DTMF digit:", data.digit); // Logging the pressed digit
      }
      if (data.event === "Digits") {
        console.log("Digits Received DTMF digit:", data); // Logging the pressed digit
        console.log("Received DTMF digit:", data.digit); // Logging the pressed digit
      }
      if (data.event === "digit") {
        console.log("digit Received DTMF digit:", data); // Logging the pressed digit
        console.log("Received DTMF digit:", data.digit); // Logging the pressed digit
      }
      if (data.event === "digit") {
        console.log("digit Received DTMF digit:", data); // Logging the pressed digit
        console.log("Received DTMF digit:", data.digit); // Logging the pressed digit
      }
      ws.send(`Server response: ${message}`);
    });
    ws.on("close", () => {
      console.log("Client disconnected");
    });
    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });

  const wsUrl = `wss://${req.headers.host}/callStreaming?call_sid=${conf_sid}`;

  res.json({
    message: "WebSocket server for call has been created",
    url: wsUrl,
  });
};

module.exports = { getCallStreaming, callSocketServers };
