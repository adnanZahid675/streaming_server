const child_process = require("child_process");
const WebSocket = require("ws");
const { Transform } = require("stream");
const { v4: uuidv4 } = require("uuid"); // Importing uuid

let webSocketServers = {};

function startFFmpeg(ws, ip, user, pass,uniqueId,port) {
  const ffmpegArgs = [
    "-rtsp_transport",
    "tcp",
    "-i",
    // `rtsp://${user}:${pass}@${ip}:5554`,
    `rtsp://${user}:${pass}@${ip}:${port}`,
    "-fflags",
    "nobuffer",
    "-rtbufsize",
    "100M",
    "-use_wallclock_as_timestamps",
    "1",
    "-s",
    "540x360",
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
    console.log(`\n\n\n\n\n\n\n\nffmpeg exited with code ${code} and signal ${signal},state ${ws.readyState}`);
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
  const { ip, user, pass,port } = req.query;
  if (!ip || !user || !pass || !port) {
    return res.status(400).send("Missing IP, user,port or pass");
  }

  const uniqueId = uuidv4();
  webSocketServers[uniqueId] = new WebSocket.Server({ noServer: true });
  webSocketServers[uniqueId].on("connection", (ws) => {
    let ffmpeg = startFFmpeg(ws, ip, user, pass,uniqueId,port);
    ws.on("close", () => {
      if (ffmpeg) {
        ffmpeg.kill("SIGINT");
        ffmpeg = null;
      }
    });
  });
  //    = wsServer;
  const wsUrl = `ws://${req.headers.host}/record-list?id=${uniqueId}`;
  res.json({ message: "WebSocket server created", url: wsUrl });
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
