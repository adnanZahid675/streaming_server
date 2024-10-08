const { Voice } = require("@signalwire/realtime-api");

const WebSocket = require("ws");
let callSocketServers = {};
let callResult = {};
const axios = require("axios");

const { RelayConsumer } = require("@signalwire/node");

// const consumer = new RelayConsumer({
//   project: "93d5b1c7-b843-49e8-be85-b9882c51524d", // Replace with your project ID
//   token: "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094", // Replace with your API token
//   contexts: ["office"], // Contexts to listen for inbound calls
//   onIncomingCall: async (call) => {
//     try {
//       console.log("Incoming call from: ", call.from);

//       // Answer the incoming call
//       await call.answer();

//       // Add the incoming call to a conference
//       const conference = await call?.client?.conference({
//         name: "Conference1", // Name your conference
//         from: call.from,
//       });

//       // Add the incoming call to the conference
//       await call.join(conference);

//       console.log("Call joined the conference");
//     } catch (error) {
//       console.error("Error handling the call: ", error);
//     }
//   },
// });

// consumer.run();

const consumer = new RelayConsumer({
  project: '93d5b1c7-b843-49e8-be85-b9882c51524d',
  token: 'PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094',
  contexts: ['office'],
  ready: async ({ client }) => {
    console.log('Client is ready!');

    // Initialize calling if necessary (some setups might require this).
    const calling = client.calling;
    if (!calling) {
      console.error("Calling capabilities not initialized.");
      return;
    }

    // Create a new conference
    // const conferenceName = 'my-conference';
    // try {
    //   const conference = await client.calling.conferences.create({
    //     name: conferenceName,
    //     status: "in-progress",
    //   });
    //   console.log(`Conference created: ${conference.sid}`);
    // } catch (error) {
    //   console.error("Error creating conference:", error);
    // }
  },
  onIncomingCall: async (call) => {
    console.log(`Incoming call: ${call.id}`);
    const { successful } = await call.answer();
    if (!successful) return;

    // Add participant logic here if needed.
  }
});

consumer.run();

const dialAndAddToConference = async (req, res) => {
  try {
    const { from, to } = req?.query;
    if (!from || !to) {
      res.status(400).json({ message: "Query params are not completed" });
      return;
    } else {
      console.log("all querry params from to \n", from, to);
    }

    const dialedCall = await consumer.client.calling.dial({
      type: "phone",
      to: `+${to}`, // Replace with the destination number
      from: `+${from}`, // Replace with your SignalWire number
    });

    console.log("dialedCall", dialedCall);

    if (dialedCall) {
      const conference = await dialedCall?.client?.conference({
        name: "Conference1", // Same conference as the one created earlier
        from: dialedCall.from,
      });
      await dialedCall?.join(conference);
    }
  } catch (error) {
    console.error("Error making the call:", error);
  }
};

const getConferenceStreaming = async (req, res) => {
  const { from, to, conferenceName } = req?.query;
  if (!from || !to || !conferenceName) {
    res.status(400).json({ message: "Query params are not completed" });
    return;
  } else {
    console.log("all querry params from to \n", from, to);
  }

  res.status(200).json({ message: "Processing your request" });
  const client = new Voice.Client({
    project: "93d5b1c7-b843-49e8-be85-b9882c51524d",
    token: "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
    topics: ["office"],
  });

  const call = await client.dialPhone({
    from: `+${from}`,
    to: `+${to}`,
  });

  const conference = await call?.client?.conference({
    name: conferenceName,
    from: call.from,
  });
  await call.join(conference);

  call.on("collect.started", (collect) => {
    console.log("collect.started", collect);
  });
  call.on("collect.startOfInput", (collect) => {
    console.log("Input collection started.");
  });
  call.on("collect.updated", (collect) => {
    console.log("collect.updated", collect.digits);
  });
  call.on("collect.ended", (collect) => {
    console.log("collect.ended", collect.digits);
    callResult[requestId] = collect.digits;
  });
  call.on("collect.failed", (collect) => {
    console.log("collect.failed", collect.reason);
  });
  const collect = await call.collect({
    digits: {
      max: 10,
      digitTimeout: 5,
      terminators: "#*",
    },
  });
  const { digits } = await collect.ended();
  try {
  } catch (error) {
    console.log("\ngot error in catch section", JSON.stringify(error));

    return;
  }
};

const checkDigits = (req, res) => {
  const { requestId } = req.query;
  if (!requestId || !callResult[requestId]) {
    res.status(404).json({ message: "Digits not available yet" });
    return;
  }
  res.status(200).json({ digits: callResult[requestId] });
};

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

module.exports = {
  getCallStreaming,
  callSocketServers,
  checkDigits,
  getConferenceStreaming,
  dialAndAddToConference,
};
