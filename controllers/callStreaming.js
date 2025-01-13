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

const { SignalWire } = require("@signalwire/realtime-api");

const dialAndAddToConference = async (req, res) => {
  try {
    const { from, to } = req?.query;
    if (!from || !to) {
      res.status(400).json({ message: "Query params are not completed" });
      return;
    } else {
      console.log("all query params from to \n", from, to);
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
  // console.log("\n\n\ncomplete req", req);
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
      console.log("\n\n\ncollect.started", collect, "\n\n\n");
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
    console.log("\n\n\n\ngot error in catch section ", error, "\n\n\n\n\n\n");
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

const send_sms = async (req, res) => {
  try {
    const { from_number, to_number, message_body } = req.body;
    const sendResult = await client.messages.create({
      from: from_number,
      to: to_number,
      body: message_body,
    });
    res.status(200).json({ success: true, message: sendResult });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: JSON.stringify(error),
      error_message: error?.message,
    });
  }
};

const fetch_sms_status = async (req, res) => {
  const { message_sid } = req.body;
  try {
    const messageStatus = await client.messages(message_sid).fetch();
    res.status(200).json({ success: true, message: messageStatus });
  } catch (error) {
    res.status(500).json({
      success: false,
      error_message: error?.message,
      error: JSON.stringify(error),
    });
  }
};

const getCallStreaming = (req, res) => {
  const conf_sid = req?.body?.conf_sid;
  const dtmf_url = req?.body?.dtmf_url;
  console.log("\nconf_sid: ", conf_sid);
  console.log("\ndtmf_url: ", dtmf_url);
  if (!conf_sid) {
    res.status(400).json({ message: "Conference sid not found" });
    return;
  }

  const callSocket = new WebSocket.Server({ noServer: true });
  callSocketServers[conf_sid] = callSocket;

  callSocketServers[conf_sid].on("connection", (ws) => {
    // streamConnected(conf_sid);
    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      if (data.event === "connected") {
        console.log("Connected now:", data);
      }
      if (data.event === "start") {
        console.log("Started now:", data);
      }
      if (data.event === "dtmf") {
        sendDTMFEvent(data, conf_sid, dtmf_url);
        console.log("\n\n\n\ndtmf event got: ", data);
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

async function sendDTMFEvent(digit, call_id, dtmf_url) {
  try {
    const data = await axios.get(
      `${dtmf_url}?digit=${digit?.dtmf?.digit}&call_id=${call_id}`
    );
    console.log("\n\nDTMF response", data.data);
  } catch (error) {
    console.error("Error in sending DTMF :", JSON.stringify(error));
  }
}

async function create_call_app(conf_id) {
  console.log("creating call app", conf_id);
  try {
    const call = await client.calls.create({
      from: "+18016506700", // Your SignalWire number
      to: "sip:myautogate-conference.dapp.signalwire.com",
      twiml: `
        <Response>
          <Dial>
            <Conference>MyConference_${conf_id}</Conference>
          </Dial>
        </Response>
      `,
    });
    console.log("Call created:", call.sid);
  } catch (error) {
    console.error("Error creating call:", error);
  }
}

const process_authorization = (req, res) => {
  console.log("\n\n\n\n\nreq?.query?".req?.query);
  const conf_id = req?.query?.conf_id;
  res.send(
    `
    <?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Dial>
        <Conference>Room1234</Conference>
      </Dial>
    </Response>
  `
  );
};

async function sendPostRequestWithOnCall(url, call_id) {
  try {
    let payload = {
      call_id,
    };
    const response = await axios.get(url, payload);
  } catch (error) {
    console.error("Error sending axios POST request:", error);
  }
}

// calling function is starting from here on

const initialGreetings = async (req, res) => {
  const responseXML = `
          <Response>
            <Say> Hello, please press 1 if you want to continue the call. </Say>
            <Gather numDigits="1" action='https://callstream-6b64fe9b1f4d.herokuapp.com/api/call_to_owner' method='POST' timeout='10'/>
          </Response>`;

  res.send(responseXML);
};

const calling_to_owner = async (req, res) => {
  const digit = req.body.Digits;
  console.log("digits from guest", digit);

  from = "+12019716175"; // signal wire
  to = "+18334356935"; // owner number

  if (digit == "1") {
    console.log("going to create a bridge between guest and owner");

    const responseXML = `
     <Response>
        <Say>Connecting you to Person B now.</Say>
        <Dial callerId="${from}" action="https://callstream-6b64fe9b1f4d.herokuapp.com/api/bridge_end" hangupOnStar="false" endOnBridge="false">
          <Number statusCallbackEvent="answered" statusCallback="https://callstream-6b64fe9b1f4d.herokuapp.com/api/status_call_back">${to}</Number>
        </Dial>
      </Response>`;

    console.log("calling initiated");
    res.set("Content-Type", "text/xml");
    res.send(responseXML); // This will bridge Person A and Person B
  } else {
    res.send("<Response><Say>Invalid input. Goodbye.</Say></Response>");
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
        <Number>+18334356935</Number>
      </Dial>
    </Response>
  `);
};

const bridge_end = async (req, res) => {
  const callStatus = req.body.DialCallStatus;
  const from = req.body.From; // Person A
  const to = req.body.To; // Person B

  console.log("\n\n\n\nreq.body", req.body);

  console.log(
    "Bridge ended. Call status:",
    callStatus,
    "From:",
    from,
    "To:",
    to
  );

  if (callStatus === "completed" && to === "+18334356935") {
    // Ensure this is for Person B
    // Send a prompt to Person B for authorization
    const responseXML = `
      <?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say>Thank you for the call. Please authorize Person A by pressing 1.</Say>
        <Gather numDigits="1" action="https://callstream-6b64fe9b1f4d.herokuapp.com/api/authorization" method="POST" timeout="10"/>
      </Response>
    `;

    console.log("Prompting Person B for authorization");

    res.set("Content-Type", "text/xml");
    res.send(responseXML); // Ask Person B for authorization
  } else {
    res.send(` <Response>
        <Say>else part else part press 1 else part else partelse part else partelse part else partelse part else part</Say>
        <Gather numDigits="1" action="https://callstream-6b64fe9b1f4d.herokuapp.com/api/process_authorization" method="POST" timeout="10"/>
      </Response>`);
  }
};

const status_call_back = (req, res) => {
  // Respond with LaML to dial Person B and bridge the call
  console.log("\n\n\n\n\nstatus_call_back ended ", req.body);
  res.send(`
    <Response>
      <Say>In the status call back To authorize Person A please press 1.</Say>
      <Gather numDigits="1" action="https://callstream-6b64fe9b1f4d.herokuapp.com/api/process_authorization" method="POST"/>
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
  status_call_back,
  process_authorization,
  initialGreetings,
  bridge_end,
  send_sms,
  fetch_sms_status,
};
