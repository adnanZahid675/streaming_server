const getVideoCTRL = require("./getVideoController");
const { getStreaming, webSocketServers, closeAllSockets } = require("./createSocket");
const { getCallStreaming, callSocketServers } = require("./callStreaming");

module.exports = {
  getVideoCTRL,
  getStreaming,
  webSocketServers,
  closeAllSockets,
  getCallStreaming,
  callSocketServers,
};
