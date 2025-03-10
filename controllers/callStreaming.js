const { callApi } = require("../utils/call_api");
const WebSocket = require("ws");
let callSocketServers = {};
let latestMessageData = {
  message: null,
  timestamp: null,
};
const axios = require("axios");
const decryptData = require("./../utils/shared_func");
const {createACronJob} = require("./../utils/cron_jobs");

const { RestClient } = require("@signalwire/node");

const {
  securityDate,
  security2561,
  security2,
  security3,
} = require("../utils/security_encryptions");


const execute_schedule_task = async (req, res) => {
  try {
    const { data,action,dateTime,time_ahead} = req.body;
    console.log("\n\n\ndateTime",dateTime);
    console.log("\n\n\ntimeAhead",time_ahead);
    createACronJob(dateTime,data,time_ahead);
    
    res.status(200).json({ success: true, message: data });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: JSON.stringify(error),
      error_message: error?.message,
    });
  }
};

const send_sms = async (req, res) => {
  try {
    const { data } = req.body;
    const { from_number, to_number, message_body, project_id ,api_token,space_url} = decryptData(data)
    if (!from_number || !to_number ||!message_body || !project_id) {
      return res.status(400).send("Missing from_number, to_number,message_body or project_id");
    }
    const myClient = new RestClient(project_id, api_token, {
      signalwireSpaceUrl: space_url,
    });
    const sendResult = await myClient.messages.create({
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
function setSocket(sms_sid) {
  callSocketServers[sms_sid].on("connection", (ws) => {
    const MESSAGE_EXPIRATION_TIME = 6000; // 6 seconds

    console.log(
      "latestMessageData.message && latestMessageData.timestamp",
      latestMessageData.message,
      latestMessageData.timestamp
    );

    if (latestMessageData.message && latestMessageData.timestamp) {
      const currentTime = Date.now();
      if (
        currentTime - latestMessageData.timestamp <=
        MESSAGE_EXPIRATION_TIME
      ) {
        console.log("sending the latest message: ");
        ws.send(JSON.stringify(latestMessageData.message));
      } else {
        console.log("\n\nlatest time ", new Date(latestMessageData.timestamp));
      }
    }

    ws.on("message", async (message) => {
      const data = JSON.parse(message);
      if (data.event === "connected") {
        console.log("Connected now:", data);
      }
      ws.send(`Server response: ${message}`);
    });
    ws.on("close", () => {
      console.log(`Client disconnected from ${sms_sid}`);
      delete callSocketServers[sms_sid]; // Clean up the server instance
    });
    ws.on("error", (error) => {
      console.error(`WebSocket error: ${error}`);
    });
  });
}

const fetch_sms_status = async (req, res) => {
  const { data } = req.body;
  const { message_sid, project_id, api_token, space_url } = decryptData(data);
  if (!message_sid || !project_id || !api_token || !space_url) {
    return res
      .status(400)
      .send("Missing space_url, api_token,project_id or message_sid");
  }

  const myClient = new RestClient(project_id, api_token, {
    signalwireSpaceUrl: space_url,
  });

  try {
    const messageStatus = await myClient.messages(message_sid).fetch();
    let wsUrl = "";

    const message_status = messageStatus?.status?.toLowerCase();

    if (message_status == "delivered") {
      const sms_sid = messageStatus?.sid;
      const callSocket = new WebSocket.Server({ noServer: true });
      callSocketServers[sms_sid] = callSocket;
      wsUrl = `ws://${req.headers.host}/callStreaming?call_sid=${sms_sid}`;
      setSocket(sms_sid);
    }

    res
      .status(200)
      .json({ success: true, message: messageStatus, socket: wsUrl });
  } catch (error) {
    res.status(500).json({
      success: false,
      error_message: error?.message,
      error: JSON.stringify(error),
    });
  }
};

const handle_incoming_sms = async (req, res) => {
  try {
    const { From, To, Body } = req.body;
    console.log(`\n\n\n\n\n\Message body: ${Body}`);
    latestMessageData = {
      message: { From, To, Body },
      timestamp: Date.now(),
    };

    res.set("Content-Type", "text/xml");
    res.send(`<Response></Response>`);
    Object.values(callSocketServers)?.forEach((socketServer) => {
      socketServer?.clients?.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ From, To, Body }));
        }
      });
    });

    // Respond with a LaML response (required for SignalWire)
  } catch (error) {
    console.error("Error handling incoming SMS:", JSON.stringify(error));
    res.status(500).json({
      success: false,
      error_message: error?.message,
      error: JSON.stringify(error),
    });
  }
};

const getPlaybackRecords = async (req, res) => {
  try {
    const username = "admin";
    const password = "AutoGate!!";

    const login_data = await login(username, password);

    const iv = "7CF38B23DC7ED371";

    const userToken = encodeURIComponent(
      JSON.stringify({
        loginName: username,
        encryptionType: login_data?.encryptionType,
        datetime: login_data?.date,
        iv,
      })
    );

    const cookieHeader = `updateTips=true; previewRes=1; previewStream=1; modifypsw=true; userName=${username}; cookie=${encodeURIComponent(
      JSON.stringify(login_data?.response?.data)
    )}; ${
      login_data?.response?.data?.cookie
    }; userToken=${userToken}; default_streamtype=false`;

    let payload={
      action: "get",
      data: {
        fileType: req.body.fileType,
        startTime: req.body.startTime,
        endTime: req.body.endTime,
      },
    }
    console.log("payload",payload)
    const record = await callApi(
      "http://70.163.3.136:5555/api/record/record-list",
      "POST",
      payload,
      {
        "Content-Type": "application/json",
        Cookie: cookieHeader,
      }
    );
    res.status(200).json({
      success: true,
      login_data,
      Cookie: login_data?.response?.data,
      response: record?.data,
    });
  } catch (error) {
    console.error("Error in getPlaybackRecords:", error.message || error);
    res.status(500).json({
      success: false,
      error_message: error.message || "An unknown error occurred",
      error: error,
    });
  }
};

const getRecordFileInfo = async (req, res) => {
  try {
    const {Cookie,fileType,startTime} = req.body;
    console.log("cookies: ",Cookie);

    const login_data=JSON.stringify(Cookie);
    console.log("login_data",login_data);
    
    const userToken = encodeURIComponent(
      JSON.stringify({
        loginName: username,
        encryptionType: login_data.encryptionType,
        datetime: login_data.date,
        iv,
      })
    );
    
    // Encode the cookie object (it will encode the entire JSON)
    const encodedCookie = encodeURIComponent(JSON.stringify(login_data.response.data));

    const response = await axios.post(
      "http://70.163.3.136:5555/api/record/record-encode-info",
      {
        action: "get",
        data: {
          fileType: fileType,
          startTime: startTime,
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          Cookie: encodedCookie,
        },
        withCredentials: true,
      }
    );

    res.status(200).json({
      success: true,
      response: response.data,
    });
  } catch (error) {
    console.error("Error handling incoming SMS:", JSON.stringify(error));
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
      delete callSocketServers[conf_sid];
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

const login = async (username, password) => {
  try {
    const sessionResult = await callApi(
      "http://70.163.3.136:5555/api/session/login-capabilities",
      "POST",
      { action: "get", data: { username } },
      { "Content-Type": "application/json" }
    );

    console.log("sessionResult",sessionResult?.data);
    

    if (!sessionResult?.data?.data?.sessionID) {
      throw new Error("Session ID not received from login-capabilities API");
    }

    const sessionID = sessionResult.data.data.sessionID;
    const salt = sessionResult.data.data.param?.salt || "";
    const challenge = sessionResult.data.data.param?.challenge || "";
    const enableIteration =
      sessionResult.data.data.param?.enableIteration || false;
    const iterations = sessionResult.data.data.param?.iterations || 1;

    const e = securityDate();

    let hashedPassword = security2561(username, salt, e[0], password);
    hashedPassword = security2(hashedPassword, challenge);
    if (enableIteration) {
      hashedPassword = security3(iterations, hashedPassword);
    }

    // Step 3: Send Login Request
    const finalPayload = {
      action: "set",
      data: {
        username,
        loginEncryptionType: "sha256-1",
        password: hashedPassword,
        sessionID,
        datetime: e[1],
      },
    };

    const loginHeaders = {
      "Content-Type": "application/json",
      Cookie: `sessionID=${sessionID}; updateTips=true; default_streamtype=true; userName=admin; modifypsw=true; cookie={"cookie":"sessionID=${sessionID}"}; sessionID=${sessionID}`,
    };

    const loginResult = await callApi(
      "http://70.163.3.136:5555/api/session/login",
      "POST",
      finalPayload,
      loginHeaders
    );
    return {
      success: true,
      sessionID,
      encryptionType: sessionResult.data.data.encryptionType[0],
      date: e[1],
      response: loginResult.data,
    };
  } catch (error) {
    console.error("Login error:", error.message);
    return {
      success: false,
      error_message: error.message || "Login attempt unsuccessful.",
    };
  }
};

module.exports = {
  getCallStreaming,
  send_sms,
  fetch_sms_status,
  handle_incoming_sms,
  getPlaybackRecords,
  getRecordFileInfo,
  execute_schedule_task
};
