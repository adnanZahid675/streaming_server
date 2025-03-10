const child_process = require("child_process");
const WebSocket = require("ws");
const { Transform } = require("stream");
const { v4: uuidv4 } = require("uuid"); // Importing uuid
const decryptData = require("./../utils/shared_func");

let webSocketServers = {};

function startFFmpeg(ws,rtspURL) {
  const ffmpegArgs = [
    "-rtsp_transport",
    "tcp",
    "-i",
    `${rtspURL}`,
    "-fflags",
    "nobuffer",
    "-rtbufsize",
    "100M",
    "-use_wallclock_as_timestamps",
    "1",
    "-s",
    "540x318",
    "-fps_mode",
    "passthrough",
    "-copyts",
    "-c:v",
    "mpeg1video",
    "-f",
    "mpegts",
    "-",
  ];

  const ffmpeg = child_process.spawn("ffmpeg", ffmpegArgs);

  const transformStream = new Transform({
    transform(chunk, encoding, callback) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(chunk);
      }
      callback();
    },
  });

  ffmpeg.stdout.pipe(transformStream);

  ffmpeg.stderr.on("data", (data) => {
    console.error(`ffmpeg stderr: ${data}`);
  });

  ffmpeg.on("exit", (code, signal) => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log("state ${ws.readyState} closing ", ws.readyState);
      ws.close();
      console.log("state ${ws.readyState} closed ", ws.readyState);
    }
  });

  ffmpeg.on("error", (error) => {
    console.error(`ffmpeg error: ${error}`);
    if (ws.readyState === WebSocket.OPEN) {
      ws.close();
    }
  });

  return ffmpeg;
}

const getStreaming = (req, res) => {
  const { data } = req.body;
  try {    
    const { ip, user, pass, port } = decryptData(data)
    if (!ip || !user || !pass || !port) {
      return res.status(400).send("Missing IP, user,port or pass");
    }
    const uniqueId = uuidv4();
    webSocketServers[uniqueId] = new WebSocket.Server({ noServer: true });
    webSocketServers[uniqueId].on("connection", (ws) => {
      let rtsp_url=`rtsp://${user}:${pass}@${ip}:${port}`
      
      let ffmpeg = startFFmpeg(ws, rtsp_url);
      ws.on("close", () => {
        if (ffmpeg) {
          ffmpeg.kill("SIGINT");
          ffmpeg = null;
        }
      });
    });
    const wsUrl = `ws://${req.headers.host}/record-list?id=${uniqueId}`;
    res.status(200).json({ message: "WebSocket server created", url: wsUrl });
  } catch (error) {
    console.log("internal error : ", error);
    res.status(500).json({ message: "Internal server error" });
  }  
};

const closeAllSockets = (req, res) => {
  Object.values(webSocketServers).forEach((wsServer) => {
    wsServer.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.close();
      }
    });
  });
  webSocketServers = {}; // Reset the server list
  res.json({ message: "All WebSocket connections closed" });
};  

module.exports = { getStreaming, webSocketServers, closeAllSockets };
