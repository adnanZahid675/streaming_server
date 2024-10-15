const { Voice } = require("@signalwire/realtime-api");

const WebSocket = require("ws");
let callSocketServers = {};
let callResult = {};
const axios = require("axios");
const { response } = require("express");

const { RestClient } = require("@signalwire/node"); // Import SignalWire RestClient

// Initialize the SignalWire client with your credentials
const client = new RestClient(
  "93d5b1c7-b843-49e8-be85-b9882c51524d",
  "PT4506a1c72f4ce75305b634a5ef11ca40e636fd0d9837f094",
  {
    signalwireSpaceUrl: "myautogate.signalwire.com", // Replace with your SignalWire space URL
  }
);

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

// calling function is starting from here on

const initialGreetings = async (req, res) => {
  console.log("\n\n\ngreeting");

  const responseXML = `
          <Response>
  <Say> Hello, please press 1 if you want to continue the call. </Say>
  <Gather numDigits="1" action='https://callstream-6b64fe9b1f4d.herokuapp.com/api/call_to_owner' method='POST' timeout='10'/>
</Response>`;

  res.send(responseXML);
};

const calling_to_owner = async (req, res) => {
  console.log("\n\n\nreq", req.body, "\n\n\n\n\n\n\n\\n\n");
  console.log("\n\n\nreq.body", req.body);

  const digit = req.body.Digits;
  console.log("digits from guest", digit);

  from = "+18016506700";
  to = "+18334356935"; // owner number

  // console.log("Call initiated successfully");

  if (digit == "1") {
    // Bridge the two calls using <Dial> verb
    const responseXML = `
     <Response>
       <Say>Connecting you to Person B now.</Say>
       <Dial callerId="${from}">
         <Number statusCallback="https://callstream-6b64fe9b1f4d.herokuapp.com/api/status_call_back">${to}</Number>
       </Dial>
     </Response>`;

    res.set("Content-Type", "text/xml");
    res.send(responseXML); // This will bridge Person A and Person B

    // const call = await client.calls.create({
    //   from: from, // The SignalWire number that Person A called
    //   to: to, // The phone number of Person B
    //   url: "https://callstream-6b64fe9b1f4d.herokuapp.com/api/connect_call", // LaML URL to handle the call
    //   // statusCallback:
    //   //   "https://callstream-6b64fe9b1f4d.herokuapp.com/api/status_call_back",
    // });

    // res.send("<Response><Say>Connecting you to Person B now.</Say></Response>");
  } else {
    console.log("\n\nits from else part");
    console.log("Initiating call from:", from, "to:", to);

    const call = await client.calls.create({
      from: from, // The SignalWire number that Person A called
      to: to, // The phone number of Person B
      url: "https://callstream-6b64fe9b1f4d.herokuapp.com/api/connect_call", // LaML URL to handle the call
      // statusCallback:
      //   "https://callstream-6b64fe9b1f4d.herokuapp.com/api/status_call_back",
    });
    res.send("<Response><Say>Connecting you to Person B now.</Say></Response>");
    // res.send("<Response><Say>Invalid input. Goodbye.</Say></Response>");
  }
};

const connect_call = (req, res) => {
  // Respond with LaML to dial Person B and bridge the call
  console.log("\n\n\n\n\nis it comming here ");

  // dialing owner number
  res.send(`
    
    <Response>
      <Say>Dialing now. Please wait</Say>
      <Dial>
        <Number>+1834356935</Number>
      </Dial>
    </Response>
  `);
};

const status_call_back = (req, res) => {
  // Respond with LaML to dial Person B and bridge the call
  console.log("\n\n\n\n\nstatus_call_back ");
  res.send(`
    <Response>
      <Say>Thank you for the call. To authorize Person A, please press 1.</Say>
      <Gather numDigits="1" action="https://callstream-6b64fe9b1f4d.herokuapp.com/api/process_authorization" method="POST"/>
    </Response>
  `);
};

const process_authorization = (req, res) => {
  const digit = req.body.Digits;
  console.log("\n\n\n\n\n\n\n\ngot digit from the owner", digit);
  if (digit == "1") {
    // Send an SMS to Person A to confirm authorization
    // const messaging = new signalwire.messaging({
    //   from: "+YourSignalWireNumber",
    //   to: "+PersonAPhoneNumber",
    //   body: "You have been authorized by Person B!",
    // });

    // messaging.create(); // Send the SMS

    res.send(
      "<Response><Say>Thank you, Person A has been authorized.</Say></Response>"
    );
  } else {
    res.send("<Response><Say>Authorization failed. Goodbye.</Say></Response>");
  }
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
  status_call_back,
  process_authorization,
  initialGreetings,
};
