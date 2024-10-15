const { Voice } = require("@signalwire/realtime-api");

const WebSocket = require("ws");
let callSocketServers = {};
let callResult = {};
const axios = require("axios");

const { RestClient } = require("@signalwire/node"); // Import SignalWire RestClient

// Initialize the SignalWire client with your credentials
const client = new RestClient(
  "93d5b1c7-b843-49e8-be85-b9882c51524d",
  "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
  {
    signalwireSpaceUrl: "myautogate.signalwire.com", // Replace with your SignalWire space URL
  }
);

// const client = new SignalWire.RestClient(
//   "93d5b1c7-b843-49e8-be85-b9882c51524d",
//   "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
//   {
//     signalwireSpaceUrl: "myautogate.signalwire.com",
//   }
// );

// console.log("cleint : ", client);

// const voiceResponse = new SignalWire.VoiceResponse();

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

// const consumer = new RelayConsumer({
//   project: "93d5b1c7-b843-49e8-be85-b9882c51524d",
//   token: "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
//   contexts: ["office"],
//   ready: async ({ client }) => {
//     console.log("Client is ready!");

//     // Initialize calling if necessary (some setups might require this).
//     const calling = client.calling;
//     if (!calling) {
//       console.error("Calling capabilities not initialized.");
//       return;
//     }

//     // Create a new conference
//     // const conferenceName = 'my-conference';
//     // try {
//     //   const conference = await client.calling.conferences.create({
//     //     name: conferenceName,
//     //     status: "in-progress",
//     //   });
//     //   console.log(`Conference created: ${conference.sid}`);
//     // } catch (error) {
//     //   console.error("Error creating conference:", error);
//     // }
//   },
//   onIncomingCall: async (call) => {
//     console.log(`Incoming call: ${call.id}`);
//     const { successful } = await call.answer();
//     if (!successful) return;

//     // Add participant logic here if needed.
//   },
// });

// consumer.run();

const dialAndAddToConference = async (req, res) => {
  try {
    const { from, to } = req?.query;
    if (!from || !to) {
      res.status(400).json({ message: "Query params are not completed" });
      return;
    } else {
      console.log("all querry params from to \n", from, to);
    }
    res.status(200).json({ message: "Processing request" });
    const dialedCall = await consumer.client.calling.dial({
      type: "phone",
      to: `+${to}`, // Replace with the destination number
      from: `+${from}`, // Replace with your SignalWire number
    });
    console.log("dialed call ", dialedCall);

    // if (dialedCall) {
    //   const conference = await dialedCall?.client?.conference({
    //     name: "Conference1", // Same conference as the one created earlier
    //     from: dialedCall.from,
    //   });
    //   await dialedCall?.join(conference);
    // }
  } catch (error) {
    console.error("Error making the call:", error);
  }
};
request = 0;

const getConferenceStreaming = async (req, res) => {
  console.log("\n\nrequest call log", request++);
  console.log("req?.body", req?.body);
  console.log("\n\n\ncomplete req", req);
  console.log("\n\n\n\n\n\n\n");

  const { from, to, url, call_id } = req?.body;
  if (!from || !to || !url || !call_id) {
    res.status(400).json({
      message: `${!from ? "From number is required" : " "} ${
        !to ? "to number is required" : ""
      }${!url ? "Call sid is required" : ""}
          `,
    });
    return;
  } else {
    console.log("\nall querry params from to \n", from, to, url);
  }

  const client = new Voice.Client({
    project: "93d5b1c7-b843-49e8-be85-b9882c51524d",
    token: "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
    topics: ["office"],
  });
  res.status(200).json({ message: "Processing your request" });
  try {
    const call = await client.dialPhone({
      from: `${from}`,
      to: `${to}`,
    });

    console.log("call", call);
    console.log("call voptions", call?.options?.payload?.call_id);

    if (call?.options?.payload?.call_id) {
      sendPostRequestWithOnCall(url, call_id);
    }
    call.on("call.state", (newState) => {
      if (newState === "ended") {
        console.log("Call has ended.");
      }
    });

    let collectDigits = await call.collect({
      digits: {
        max: 10,
        digitTimeout: 3,
        terminators: "#*",
      },
    });

    call.on("collect.started", (collect) => {
      console.log("\n\n\ncollect.started", collect);
    });
    call.on("collect.startOfInput", (collect) => {
      console.log("\n\n\nInput collection started.");
    });
    call.on("collect.updated", (collect) => {
      console.log("\n\n\ncollect.updated", collect.digits);
    });
    call.on("collect.ended", async (collect) => {
      console.log("\n\n\ncollect.ended", collect.digits);
      await call.playTTS({
        text: "Please enter the number ",
      });
      collectDigits = await call.collect({
        digits: {
          max: 10,
          digitTimeout: 3,
          terminators: "#*",
        },
      });
    });
    call.on("collect.failed", (collect) => {
      console.log("\n\n\ncollect.failed", collect.reason);
    });
  } catch (error) {
    console.log("\n\n\n\ngot error in catch section ", error);
  }
  // const { digits } = await collectDigits.ended();
  // console.log("digits: ", digits);
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
    streamConnected();
    ws.on("message", async (message) => {
      console.log("message:", message);

      const data = JSON.parse(message); // Parsing the incoming message
      if (data.event === "connected") {
        console.log("Connected now:", data); // Logging the pressed digit
      }
      if (data.event === "start") {
        console.log("Started now:", data); // Logging the pressed digit
      }
      if (data.event === "dtmf") {
        sendDTMFEvent(data, conf_sid);
        console.log("\n\n\n\n\n\n\n\n\n\ndtmf event got: ", data);
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

async function streamConnected() {
  try {
    await axios.post(
      "https://invisibletest.myagecam.net/invisible/signalwire_call/get_socket_response.php",
      { connected: true }
    );
  } catch (error) {
    console.error("Error sending axios POST request:", error);
  }
}

async function sendDTMFEvent(digit, call_id) {
  let payload = {
    call_id,
    stream_sid: digit?.streamSid,
    digit: digit?.dtmf?.digit,
  };
  try {
    console.log("payload\n\n\n\n", payload);
    await axios.post(
      "https://invisibletest.myagecam.net/invisible/signalwire_call/get_dtmf_event.php",
      {
        payload,
      }
    );
  } catch (error) {
    console.error("Error sending axios POST request:", JSON.stringify(error));
  }
}

async function sendPostRequestWithOnCall(url, call_id) {
  try {
    let payload = {
      call_id,
    };
    const response = await axios.get(url, payload);
    console.log("\n\ngot response : ", response);
  } catch (error) {
    console.error("Error sending axios POST request:", error);
  }
}

const calling_to_owner = async (req, res) => {
  from = "+18016506700";
  to = "+18334356935";

  console.log("Initiating call from:", from, "to:", to);
  const call = await client.calls.create({
    from: from, // The SignalWire number that Person A called
    to: to, // The phone number of Person B
    url: "http://localhost:3002/api/connect_call", // LaML URL to handle the call
  });

  console.log("Call initiated successfully");

  res.send("<Response><Say>Connecting you now.</Say></Response>");
};

const connect_call = (req, res) => {
  // Respond with LaML to dial Person B and bridge the call
  console.log("is it comming here ");
  res.send(`
    <Response>
      <Dial>
        <Number>+1834356935</Number>
      </Dial>
    </Response>
  `);
};

module.exports = {
  getCallStreaming,
  callSocketServers,
  checkDigits,
  getConferenceStreaming,
  dialAndAddToConference,

  // calling_to_owner
  calling_to_owner,
  connect_call,
};
