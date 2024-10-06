const { Voice } = require("@signalwire/realtime-api");

const WebSocket = require("ws");
let callSocketServers = {};
const axios = require("axios");

// const getCallStreaming = async (req, res) => {
//   const { from, to, projectId, token } = req?.query;
//   if (!from || !to || !projectId || !token) {
//     res.status(400).json({ message: "Query params are not completed" });
//     return;
//   } else {
//     console.log("all querry params from to \n", from, to);
//   }

//   try {
//     const client = new Voice.Client({
//       project: "93d5b1c7-b843-49e8-be85-b9882c51524d",
//       token: "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
//       topics: ["office"],
//     });

//     const call = await client.dialPhone({
//       from: `+${from}`,
//       to: `+${to}`,
//     });

//     call.on("collect.started", (collect) => {
//       console.log("collect.started", collect);
//     });
//     call.on("collect.startOfInput", (collect) => {
//       console.log("Input collection started.");
//     });
//     call.on("collect.updated", (collect) => {
//       console.log("collect.updated", collect.digits);
//     });
//     call.on("collect.ended", (collect) => {
//       console.log("collect.ended", collect.digits);
//     });
//     call.on("collect.failed", (collect) => {
//       console.log("collect.failed", collect.reason);
//     });

//     const collect = await call.collect({
//       digits: {
//         max: 10,
//         digitTimeout: 5,
//         terminators: "#*",
//       },
//     });
//     console.log("\n\ncollect: ", collect);
//     const { digits } = await collect.ended();
//     res.status(200).json({ digit: digits });
//   } catch (error) {
//     console.log("error in call ", error);
//     res.status(400).json({ message: JSON.stringify(error) });
//     return;
//   }
// };

const getCallStreaming = (req, res) => {
  const conf_sid = req?.query?.conf_sid;

  console.log("\nconf_sid: ", conf_sid);

  if (!conf_sid) {
    res.status(400).json({ message: "Conference sid not found" });
    return;
  }

  const callSocket = new WebSocket.Server({ noServer: true });
  callSocketServers[conf_sid] = callSocket;

  callSocketServers[conf_sid].on("connection", (ws) => {
    console.log("\n\n\n\nconnection has created");

    ws.on("message", async (message) => {
      const data = JSON.parse(message); // Parsing the incoming message
      if (data.event === "connected") {
        console.log("Connected now:", data); // Logging the pressed digit
      }
      if (data.event === "start") {
        console.log("Started now:", data); // Logging the pressed digit
      }
      if (data.event === "dtmf") {
        console.log("data?.dtmf.digit", data?.dtmf.digit);
        await sendPostRequestWithDigits(data?.dtmf.digit);
      }
      if (data.event === "stop") {
        console.log("Call stopped"); // Logging the pressed digit
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

async function sendPostRequestWithDigits(digit) {
  try {
    const response = await axios.post("https://your-api-url.com/endpoint", {
      Digits: digit,
    });
  } catch (error) {
    console.error("Error sending axios POST request:", error);
  }
}

module.exports = { getCallStreaming, callSocketServers };
